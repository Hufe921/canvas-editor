import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import { WebSocketServer } from 'ws'
import seedParagraphs from '../shared/seed.json' with { type: 'json' }

export const MESSAGE_SYNC = 0
export const MESSAGE_AWARENESS = 1

const EXAMPLE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const DEFAULT_DATA_DIR = join(EXAMPLE_ROOT, '.data')
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2'
}

export function createSeedDocument() {
  const doc = new Y.Doc()
  const elements = doc.getArray('elements')
  doc.transact(() => {
    for (const paragraph of seedParagraphs) {
      for (const value of Array.from(paragraph.value)) {
        const element = new Y.Map()
        element.set('id', randomUUID())
        element.set('value', value)
        for (const [key, styleValue] of Object.entries(paragraph)) {
          if (key !== 'value') element.set(key, styleValue)
        }
        elements.push([element])
      }
    }
    doc.getMap('meta').set('initialized', true)
  })
  return doc
}

function encodeMessage(type, writer) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, type)
  writer(encoder)
  return encoding.toUint8Array(encoder)
}

function isValidRoomName(roomName) {
  return /^[\w-]{1,64}$/.test(roomName)
}

export class CollaborationServer {
  constructor(options = {}) {
    this.host = options.host || '0.0.0.0'
    this.port = options.port ?? 7100
    this.dataDir = options.dataDir || DEFAULT_DATA_DIR
    this.production = options.production || false
    this.logger = options.logger || console
    this.rooms = new Map()
    this.roomPromises = new Map()
    this.vite = null
    this.httpServer = createServer((request, response) => {
      void this.handleRequest(request, response)
    })
    this.webSocketServer = new WebSocketServer({
      noServer: true,
      maxPayload: 16 * 1024 * 1024
    })
    this.httpServer.on('upgrade', (request, socket, head) => {
      void this.handleUpgrade(request, socket, head)
    })
  }

  async start() {
    if (!this.production) {
      const { createServer: createViteServer } = await import('vite')
      this.vite = await createViteServer({
        configFile: join(EXAMPLE_ROOT, 'vite.config.ts'),
        server: {
          middlewareMode: true,
          hmr: { server: this.httpServer }
        },
        appType: 'spa'
      })
    }
    await mkdir(this.dataDir, { recursive: true })
    await new Promise((resolve, reject) => {
      this.httpServer.once('error', reject)
      this.httpServer.listen(this.port, this.host, resolve)
    })
    const address = this.httpServer.address()
    this.port = typeof address === 'object' && address ? address.port : this.port
    this.logger.log(
      `[collaboration] listening on http://${this.host}:${this.port}`
    )
    return this
  }

  async handleRequest(request, response) {
    const url = new URL(request.url || '/', 'http://localhost')
    if (url.pathname === '/healthz') {
      const connections = [...this.rooms.values()].reduce(
        (total, room) => total + room.connections.size,
        0
      )
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(
        JSON.stringify({ ok: true, rooms: this.rooms.size, connections })
      )
      return
    }
    if (this.vite) {
      this.vite.middlewares(request, response, error => {
        if (error) {
          response.statusCode = 500
          response.end(error instanceof Error ? error.message : String(error))
        }
      })
      return
    }
    await this.serveStatic(url.pathname, response)
  }

  async serveStatic(pathname, response) {
    const distDir = join(EXAMPLE_ROOT, 'dist')
    const requestedPath = pathname === '/' ? '/index.html' : pathname
    const safePath = normalize(decodeURIComponent(requestedPath)).replace(
      /^(\.\.(\/|\\|$))+/,
      ''
    )
    let filePath = join(distDir, safePath)
    if (!filePath.startsWith(distDir)) {
      response.writeHead(403)
      response.end('Forbidden')
      return
    }
    try {
      const fileStat = await stat(filePath)
      if (!fileStat.isFile()) throw new Error('Not a file')
    } catch {
      filePath = join(distDir, 'index.html')
    }
    try {
      response.writeHead(200, {
        'content-type': MIME_TYPES[extname(filePath)] || 'application/octet-stream'
      })
      createReadStream(filePath).pipe(response)
    } catch {
      response.writeHead(404)
      response.end('Build the example first: npm run build')
    }
  }

  async handleUpgrade(request, socket, head) {
    const url = new URL(request.url || '/', 'http://localhost')
    const match = url.pathname.match(/^\/collaboration\/([^/]+)$/)
    if (!match) return
    const roomName = decodeURIComponent(match[1])
    if (!isValidRoomName(roomName)) {
      socket.destroy()
      return
    }
    try {
      const room = await this.getRoom(roomName)
      this.webSocketServer.handleUpgrade(request, socket, head, webSocket => {
        this.setupConnection(roomName, room, webSocket)
      })
    } catch (error) {
      this.logger.error('[collaboration] upgrade failed', error)
      socket.destroy()
    }
  }

  async getRoom(roomName) {
    const existingRoom = this.rooms.get(roomName)
    if (existingRoom) return existingRoom
    const existingPromise = this.roomPromises.get(roomName)
    if (existingPromise) return existingPromise
    const roomPromise = this.createRoom(roomName)
    this.roomPromises.set(roomName, roomPromise)
    try {
      return await roomPromise
    } finally {
      this.roomPromises.delete(roomName)
    }
  }

  async createRoom(roomName) {
    const doc = new Y.Doc()
    const filePath = join(this.dataDir, `${roomName}.ydoc`)
    let restored = false
    try {
      const persistedUpdate = await readFile(filePath)
      Y.applyUpdate(doc, new Uint8Array(persistedUpdate))
      restored = true
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        this.logger.error(`[collaboration] failed to restore ${roomName}`, error)
      }
    }
    if (!doc.getMap('meta').get('initialized')) {
      const seedDoc = createSeedDocument()
      Y.applyUpdate(doc, Y.encodeStateAsUpdate(seedDoc))
      seedDoc.destroy()
    }
    const room = {
      name: roomName,
      doc,
      awareness: new awarenessProtocol.Awareness(doc),
      connections: new Map(),
      filePath,
      persistTimer: null,
      persistPromise: Promise.resolve()
    }
    this.rooms.set(roomName, room)
    doc.on('update', (update, origin) => {
      const message = encodeMessage(MESSAGE_SYNC, encoder => {
        syncProtocol.writeUpdate(encoder, update)
      })
      this.broadcast(room, message, origin)
      this.schedulePersist(room)
    })
    room.awareness.on('update', ({ added, updated, removed }, origin) => {
      const changedClients = [...added, ...updated, ...removed]
      if (!changedClients.length) return
      const message = encodeMessage(MESSAGE_AWARENESS, encoder => {
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients)
        )
      })
      this.broadcast(room, message, origin)
    })
    this.logger.log(
      `[collaboration] room ${roomName} ${restored ? 'restored' : 'created'}`
    )
    return room
  }

  setupConnection(roomName, room, webSocket) {
    const controlledClients = new Set()
    room.connections.set(webSocket, controlledClients)
    webSocket.binaryType = 'arraybuffer'
    webSocket.on('message', data => {
      try {
        const decoder = decoding.createDecoder(new Uint8Array(data))
        const messageType = decoding.readVarUint(decoder)
        if (messageType === MESSAGE_SYNC) {
          const encoder = encoding.createEncoder()
          encoding.writeVarUint(encoder, MESSAGE_SYNC)
          syncProtocol.readSyncMessage(decoder, encoder, room.doc, webSocket)
          if (encoding.length(encoder) > 1) {
            this.send(webSocket, encoding.toUint8Array(encoder))
          }
        } else if (messageType === MESSAGE_AWARENESS) {
          const update = decoding.readVarUint8Array(decoder)
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            update,
            webSocket
          )
        } else {
          webSocket.close(1003, 'Unsupported message')
        }
      } catch (error) {
        this.logger.error(`[collaboration] invalid message in ${roomName}`, error)
        webSocket.close(1003, 'Invalid message')
      }
    })
    webSocket.on('close', () => {
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        [...controlledClients],
        webSocket
      )
      room.connections.delete(webSocket)
      this.logger.log(
        `[collaboration] ${roomName} connections: ${room.connections.size}`
      )
    })
    webSocket.on('error', error => {
      this.logger.error(`[collaboration] socket error in ${roomName}`, error)
    })
    this.send(
      webSocket,
      encodeMessage(MESSAGE_SYNC, encoder => {
        syncProtocol.writeSyncStep1(encoder, room.doc)
      })
    )
    this.send(
      webSocket,
      encodeMessage(MESSAGE_AWARENESS, encoder => {
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            room.awareness,
            [...room.awareness.getStates().keys()]
          )
        )
      })
    )
    this.logger.log(
      `[collaboration] ${roomName} connections: ${room.connections.size}`
    )
  }

  broadcast(room, message, origin = null) {
    for (const webSocket of room.connections.keys()) {
      if (webSocket !== origin) this.send(webSocket, message)
    }
  }

  send(webSocket, message) {
    if (webSocket.readyState === webSocket.OPEN) webSocket.send(message)
  }

  schedulePersist(room) {
    if (room.persistTimer) clearTimeout(room.persistTimer)
    room.persistTimer = setTimeout(() => {
      void this.persistRoom(room)
    }, 250)
  }

  persistRoom(room) {
    if (room.persistTimer) {
      clearTimeout(room.persistTimer)
      room.persistTimer = null
    }
    room.persistPromise = room.persistPromise.then(async () => {
      const update = Y.encodeStateAsUpdate(room.doc)
      const temporaryPath = `${room.filePath}.${randomUUID()}.tmp`
      await mkdir(dirname(room.filePath), { recursive: true })
      await writeFile(temporaryPath, update)
      await rename(temporaryPath, room.filePath)
    })
    return room.persistPromise
  }

  async stop() {
    for (const room of this.rooms.values()) {
      for (const webSocket of room.connections.keys()) webSocket.terminate()
      await this.persistRoom(room)
      room.awareness.destroy()
      room.doc.destroy()
    }
    this.rooms.clear()
    if (this.vite) await this.vite.close()
    await new Promise(resolve => this.webSocketServer.close(resolve))
    if (this.httpServer.listening) {
      await new Promise(resolve => this.httpServer.close(resolve))
    }
  }
}
