import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1
const SYNC_STEP2 = 1

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'
type ProviderEvent = 'status' | 'sync' | 'error'
type ProviderListener = (payload?: unknown) => void

export class WebSocketProvider {
  public readonly doc: Y.Doc
  public readonly awareness: awarenessProtocol.Awareness
  public synced = false

  private readonly serverUrl: string
  private readonly roomName: string
  private readonly listeners = new Map<ProviderEvent, Set<ProviderListener>>()
  private webSocket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private destroyed = false

  constructor(
    serverUrl: string,
    roomName: string,
    doc = new Y.Doc(),
    awareness = new awarenessProtocol.Awareness(doc)
  ) {
    this.serverUrl = serverUrl.replace(/\/$/, '')
    this.roomName = roomName
    this.doc = doc
    this.awareness = awareness
    this.doc.on('update', this.handleDocumentUpdate)
    this.awareness.on('update', this.handleAwarenessUpdate)
    this.connect()
  }

  public on(event: ProviderEvent, listener: ProviderListener) {
    const eventListeners = this.listeners.get(event) || new Set()
    eventListeners.add(listener)
    this.listeners.set(event, eventListeners)
  }

  private emit(event: ProviderEvent, payload?: unknown) {
    this.listeners.get(event)?.forEach(listener => listener(payload))
  }

  private connect() {
    if (this.destroyed) return
    this.emit('status', 'connecting' satisfies ConnectionStatus)
    const webSocket = new WebSocket(
      `${this.serverUrl}/${encodeURIComponent(this.roomName)}`
    )
    this.webSocket = webSocket
    webSocket.binaryType = 'arraybuffer'
    webSocket.addEventListener('open', () => {
      if (webSocket !== this.webSocket) return
      this.reconnectAttempts = 0
      this.emit('status', 'connected' satisfies ConnectionStatus)
      this.send(
        this.encodeMessage(MESSAGE_SYNC, encoder => {
          syncProtocol.writeSyncStep1(encoder, this.doc)
        })
      )
      this.sendLocalAwareness()
    })
    webSocket.addEventListener('message', event => {
      if (webSocket !== this.webSocket) return
      try {
        this.handleMessage(new Uint8Array(event.data as ArrayBuffer))
      } catch (error) {
        this.emit('error', error)
      }
    })
    webSocket.addEventListener('error', event => this.emit('error', event))
    webSocket.addEventListener('close', () => {
      if (webSocket !== this.webSocket) return
      this.webSocket = null
      this.synced = false
      this.emit('status', 'disconnected' satisfies ConnectionStatus)
      this.scheduleReconnect()
    })
  }

  private handleMessage(message: Uint8Array) {
    const messageDecoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(messageDecoder)
    if (messageType === MESSAGE_SYNC) {
      const peekDecoder = decoding.createDecoder(message)
      decoding.readVarUint(peekDecoder)
      const syncType = decoding.readVarUint(peekDecoder)
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MESSAGE_SYNC)
      syncProtocol.readSyncMessage(messageDecoder, encoder, this.doc, this)
      if (encoding.length(encoder) > 1) {
        this.send(encoding.toUint8Array(encoder))
      }
      if (syncType === SYNC_STEP2 && !this.synced) {
        this.synced = true
        this.emit('sync', true)
      }
      return
    }
    if (messageType === MESSAGE_AWARENESS) {
      awarenessProtocol.applyAwarenessUpdate(
        this.awareness,
        decoding.readVarUint8Array(messageDecoder),
        this
      )
    }
  }

  private handleDocumentUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this) return
    this.send(
      this.encodeMessage(MESSAGE_SYNC, encoder => {
        syncProtocol.writeUpdate(encoder, update)
      })
    )
  }

  private handleAwarenessUpdate = ({
    added,
    updated,
    removed
  }: {
    added: number[]
    updated: number[]
    removed: number[]
  }) => {
    const changedClients = [...added, ...updated, ...removed]
    if (!changedClients.length) return
    this.send(
      this.encodeMessage(MESSAGE_AWARENESS, encoder => {
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            this.awareness,
            changedClients
          )
        )
      })
    )
  }

  private sendLocalAwareness() {
    if (!this.awareness.getLocalState()) return
    this.send(
      this.encodeMessage(MESSAGE_AWARENESS, encoder => {
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
            this.doc.clientID
          ])
        )
      })
    )
  }

  private encodeMessage(
    type: number,
    writer: (encoder: encoding.Encoder) => void
  ) {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, type)
    writer(encoder)
    return encoding.toUint8Array(encoder)
  }

  private send(message: Uint8Array) {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(message as Uint8Array<ArrayBuffer>)
    }
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) return
    const delay = Math.min(10000, 500 * 2 ** this.reconnectAttempts++)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay + Math.floor(Math.random() * 250))
  }

  public destroy() {
    this.destroyed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.doc.off('update', this.handleDocumentUpdate)
    this.awareness.off('update', this.handleAwarenessUpdate)
    this.webSocket?.close()
    this.awareness.destroy()
    this.listeners.clear()
  }
}
