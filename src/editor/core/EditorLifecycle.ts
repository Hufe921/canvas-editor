import type {
  EditorRuntimeErrorCode,
  EditorRuntimeState
} from '../interface/Runtime'

const messages: Record<EditorRuntimeErrorCode, string> = {
  EDITOR_NOT_READY: 'Editor is initializing; await editor.ready',
  EDITOR_INITIALIZATION_FAILED: 'Editor initialization failed',
  EDITOR_DESTROYED: 'Editor was destroyed'
}

export class EditorRuntimeError extends Error {
  constructor(
    public readonly code: EditorRuntimeErrorCode,
    options?: ErrorOptions
  ) {
    super(messages[code], options)
    this.name = 'EditorRuntimeError'
  }
}

/** Per-instance state. Initialization never queues model mutations. */
export class EditorLifecycle {
  public readonly ready: Promise<void>
  private currentState: EditorRuntimeState = 'initializing'
  private failure: EditorRuntimeError | null = null
  private resolve!: () => void
  private reject!: (error: EditorRuntimeError) => void

  constructor() {
    this.ready = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    // Hosts may destroy before awaiting ready. Its rejection remains awaitable.
    void this.ready.catch(() => {})
  }

  get state(): EditorRuntimeState {
    return this.currentState
  }

  get error(): EditorRuntimeError | null {
    return this.failure
  }

  start(initialization: Promise<void> | null, firstLayout: () => void) {
    const finish = () => {
      if (this.currentState !== 'initializing') return
      try {
        firstLayout()
        if (this.currentState !== 'initializing') return
        this.currentState = 'ready'
        this.resolve()
      } catch (cause) {
        this.fail(cause)
      }
    }
    if (initialization)
      void initialization.then(finish, error => this.fail(error))
    else finish()
  }

  private fail(cause: unknown) {
    if (this.currentState !== 'initializing') return
    this.currentState = 'failed'
    this.failure = new EditorRuntimeError('EDITOR_INITIALIZATION_FAILED', {
      cause
    })
    this.reject(this.failure)
  }

  assertReady(allowInitializing = false) {
    if (this.currentState === 'ready') return
    if (this.currentState === 'initializing' && allowInitializing) return
    if (this.currentState === 'destroyed') {
      throw new EditorRuntimeError('EDITOR_DESTROYED')
    }
    throw this.failure || new EditorRuntimeError('EDITOR_NOT_READY')
  }

  destroy(): boolean {
    if (this.currentState === 'destroyed') return false
    const pending = this.currentState === 'initializing'
    this.currentState = 'destroyed'
    if (pending) this.reject(new EditorRuntimeError('EDITOR_DESTROYED'))
    return true
  }
}
