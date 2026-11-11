import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import WebSocket from 'ws'
import {
  CollaborationServer,
  MESSAGE_AWARENESS,
  MESSAGE_SYNC
} from './CollaborationServer.js'

const silentLogger = { log() {}, error() {} }

function encodeMessage(type, writer) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, type)
  writer(encoder)
  return encoding.toUint8Array(encoder)
}

function documentText(doc) {
  return doc
    .getArray('elements')
    .map(element => element.get('value'))
    .join('')
}

function insertText(doc, index, text) {
  const elements = doc.getArray('elements')
  doc.transact(() => {
    elements.insert(
      index,
      Array.from(text).map(value => {
        const element = new Y.Map()
        element.set('id', crypto.randomUUID())
        element.set('value', value)
        return element
      })
    )
  })
}

async function waitFor(predicate, message = 'condition', timeout = 5000) {
  const startedAt = Date.now()
  while (!predicate()) {
    if (Date.now() - startedAt > timeout) {
      throw new Error(`Timed out waiting for ${message}`)
    }
    await new Promise(resolve => setTimeout(resolve, 20))
  }
}

class TestClient {
  constructor(port, roomName, doc = new Y.Doc()) {
    this.doc = doc
    this.awareness = new awarenessProtocol.Awareness(doc)
    this.paused = false
    this.pendingUpdates = []
    this.synced = false
    this.webSocket = new WebSocket(
      `ws://127.0.0.1:${port}/collaboration/${roomName}`
    )
    this.webSocket.binaryType = 'arraybuffer'
    this.webSocket.on('open', () => {
      this.send(
        encodeMessage(MESSAGE_SYNC, encoder => {
          syncProtocol.writeSyncStep1(encoder, this.doc)
        })
      )
      this.sendAwareness([this.doc.clientID])
    })
    this.webSocket.on('message', data => this.handleMessage(new Uint8Array(data)))
    this.handleDocumentUpdate = (update, origin) => {
      if (origin === this) return
      if (this.paused) this.pendingUpdates.push(update)
      else this.sendUpdate(update)
    }
    this.doc.on('update', this.handleDocumentUpdate)
  }

  handleMessage(message) {
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)
    if (messageType === MESSAGE_SYNC) {
      const peekDecoder = decoding.createDecoder(message)
      decoding.readVarUint(peekDecoder)
      const syncType = decoding.readVarUint(peekDecoder)
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      syncProtocol.readSyncMessage(decoder, encoder, this.doc, this)
      if (encoding.length(encoder) > 1) {
        this.send(encoding.toUint8Array(encoder))
      }
      if (syncType === 1) this.synced = true
    } else if (messageType === MESSAGE_AWARENESS) {
      awarenessProtocol.applyAwarenessUpdate(
        this.awareness,
        decoding.readVarUint8Array(decoder),
        this
      )
    }
  }

  sendUpdate(update) {
    this.send(
      encodeMessage(MESSAGE_SYNC, encoder => {
        syncProtocol.writeUpdate(encoder, update)
      })
    )
  }

  sendAwareness(clientIds) {
    this.send(
      encodeMessage(MESSAGE_AWARENESS, encoder => {
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(this.awareness, clientIds)
        )
      })
    )
  }

  send(message) {
    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(message)
    }
  }

  resume() {
    this.paused = false
    for (const update of this.pendingUpdates) this.sendUpdate(update)
    this.pendingUpdates = []
  }

  async close() {
    this.doc.off('update', this.handleDocumentUpdate)
    if (this.webSocket.readyState === WebSocket.OPEN) {
      const closed = new Promise(resolve => this.webSocket.once('close', resolve))
      this.webSocket.close()
      await closed
    }
    this.awareness.destroy()
  }
}

async function createTestServer(dataDir, port = 0) {
  const server = new CollaborationServer({
    host: '127.0.0.1',
    port,
    dataDir,
    production: true,
    logger: silentLogger
  })
  await server.start()
  return server
}

async function withTempDir(run) {
  const dataDir = await mkdtemp(join(tmpdir(), 'canvas-editor-collab-'))
  try {
    await run(dataDir)
  } finally {
    await rm(dataDir, { recursive: true, force: true })
  }
}

test('concurrent inserts, formatting and awareness converge across clients', async () => {
  await withTempDir(async dataDir => {
    const server = await createTestServer(dataDir)
    const first = new TestClient(server.port, 'concurrent')
    const second = new TestClient(server.port, 'concurrent')
    try {
      await waitFor(
        () => first.synced && second.synced,
        'initial synchronization'
      )
      assert.equal(documentText(first.doc), documentText(second.doc))
      first.paused = true
      second.paused = true
      insertText(first.doc, 0, '甲')
      insertText(second.doc, 0, '乙')
      await new Promise(resolve => setTimeout(resolve, 50))
      first.resume()
      second.resume()
      await waitFor(
        () =>
          documentText(first.doc) === documentText(second.doc) &&
          documentText(first.doc).includes('甲') &&
          documentText(first.doc).includes('乙'),
        'concurrent inserts to converge'
      )
      const firstElement = first.doc.getArray('elements').get(1)
      firstElement.set('bold', true)
      await waitFor(
        () => second.doc.getArray('elements').get(1).get('bold') === true,
        'formatting synchronization'
      )
      first.awareness.setLocalState({ user: { name: '第一位成员' } })
      second.awareness.setLocalState({ user: { name: '第二位成员' } })
      first.sendAwareness([first.doc.clientID])
      second.sendAwareness([second.doc.clientID])
      await waitFor(
        () =>
          first.awareness.getStates().size === 2 &&
          second.awareness.getStates().size === 2,
        'awareness exchange'
      )
    } finally {
      await first.close()
      await second.close()
      await server.stop()
    }
  })
})

test('server persistence restores a room after restart', async () => {
  await withTempDir(async dataDir => {
    let server = await createTestServer(dataDir)
    const writer = new TestClient(server.port, 'persistent')
    try {
      await waitFor(() => writer.synced, 'writer synchronization')
      insertText(writer.doc, 0, '重启后仍在')
      await waitFor(
        () => documentText(server.rooms.get('persistent').doc).includes('重启后仍在'),
        'server update'
      )
      await server.persistRoom(server.rooms.get('persistent'))
    } finally {
      await writer.close()
      await server.stop()
    }
    server = await createTestServer(dataDir)
    const reader = new TestClient(server.port, 'persistent')
    try {
      await waitFor(() => reader.synced, 'reader synchronization')
      assert.ok(documentText(reader.doc).includes('重启后仍在'))
    } finally {
      await reader.close()
      await server.stop()
    }
  })
})

test('offline edits merge with the persisted document after reconnect', async () => {
  await withTempDir(async dataDir => {
    let server = await createTestServer(dataDir)
    const port = server.port
    const offlineDoc = new Y.Doc()
    let client = new TestClient(port, 'offline', offlineDoc)
    await waitFor(() => client.synced, 'initial client synchronization')
    insertText(offlineDoc, 0, '在线修改')
    await waitFor(
      () => documentText(server.rooms.get('offline').doc).includes('在线修改'),
      'initial server update'
    )
    await client.close()
    await server.stop()
    insertText(offlineDoc, 0, '离线修改')
    server = await createTestServer(dataDir, port)
    client = new TestClient(port, 'offline', offlineDoc)
    const observer = new TestClient(port, 'offline')
    try {
      await waitFor(
        () => client.synced && observer.synced,
        'reconnection synchronization'
      )
      await waitFor(
        () =>
          documentText(client.doc).includes('离线修改') &&
          documentText(observer.doc).includes('离线修改') &&
          documentText(observer.doc).includes('在线修改'),
        'offline updates to merge'
      )
      assert.equal(documentText(client.doc), documentText(observer.doc))
    } finally {
      await client.close()
      await observer.close()
      await server.stop()
    }
  })
})
