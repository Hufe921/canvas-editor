import { MAX_FONT_BYTES } from '../fontBinary'
import { bunnyResourceUrl } from './bunnyFontCss'

interface Entry {
  key: string
  url: string
  bytes: ArrayBuffer
  headers: [string, string][]
  expires: number
  accessed: number
}
export interface FontResourcePersistence {
  get(key: string): Promise<Entry | undefined>
  put(entry: Entry): Promise<void>
  deleteUrl(url: string): Promise<void>
}

/** Fail closed to the bounded memory cache when storage is denied/unavailable. */
export class IndexedFontCache implements FontResourcePersistence {
  private async run<T>(
    work: (store: IDBObjectStore, done: (value: T) => void) => void
  ): Promise<T | undefined> {
    if (typeof indexedDB === 'undefined') return undefined
    return new Promise(resolve => {
      let database: IDBDatabase | undefined
      let transaction: IDBTransaction | undefined
      let settled = false
      const finish = (value?: T) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        database?.close()
        resolve(value)
      }
      const timer = setTimeout(() => {
        try {
          transaction?.abort()
        } catch {
          /* Already completed. */
        }
        finish()
      }, 1500)
      let request: IDBOpenDBRequest
      try {
        request = indexedDB.open('canvas-editor-bunny-fonts-v1', 1)
      } catch {
        finish()
        return
      }
      request.onupgradeneeded = () =>
        request.result.createObjectStore('resources', { keyPath: 'key' })
      request.onerror = request.onblocked = () => finish()
      request.onsuccess = () => {
        database = request.result
        if (settled) {
          database.close()
          return
        }
        try {
          transaction = database.transaction('resources', 'readwrite')
          let result: T
          work(transaction.objectStore('resources'), value => {
            result = value
          })
          transaction.oncomplete = () => finish(result)
          transaction.onerror = transaction.onabort = () => finish()
        } catch {
          finish()
        }
      }
    })
  }
  async get(key: string) {
    return this.run<Entry>((store, done) => {
      const request = store.get(key)
      request.onsuccess = () => {
        const entry = request.result as Entry | undefined
        if (entry) {
          entry.accessed = Date.now()
          store.put(entry)
          done(entry)
        }
      }
    })
  }
  async put(entry: Entry) {
    await this.run<void>(store => {
      store.put(entry)
      const request = store.getAll()
      request.onsuccess = () => {
        const entries = (request.result as Entry[]).sort(
          (a, b) => b.accessed - a.accessed
        )
        let bytes = 0
        entries.forEach((item, index) => {
          bytes += item.bytes.byteLength
          if (index >= 64 || bytes > 32 * 1024 * 1024) store.delete(item.key)
        })
      }
    })
  }
  async deleteUrl(url: string) {
    await this.run<void>(store => {
      const request = store.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) return
        if (cursor.value.url === url) cursor.delete()
        cursor.continue()
      }
    })
  }
}

function aborted(): never {
  throw new DOMException('Font request aborted', 'AbortError')
}
class HttpError extends Error {
  constructor(public status: number) {
    super(`Bunny HTTP ${status}`)
  }
}

/** Shared across editors: ref-counted jobs, bounded caches, finite HTTP retries. */
export class FontResourceStore {
  private memory = new Map<string, Entry>()
  private negative = new Map<string, { error: unknown; expires: number }>()
  private invalidated = new Set<string>()
  private pending = new Map<
    string,
    { controller: AbortController; users: number; promise: Promise<Entry> }
  >()
  private active = 0
  private queue: (() => void)[] = []

  constructor(
    private fetcher: typeof fetch = (...args) => globalThis.fetch(...args),
    private persistence: FontResourcePersistence = new IndexedFontCache(),
    private concurrency = 3
  ) {}

  invalidate(url: string) {
    this.invalidated.add(url)
    if (this.invalidated.size > 256)
      this.invalidated.delete(this.invalidated.values().next().value!)
    for (const [key, entry] of this.memory)
      if (entry.url === url) this.memory.delete(key)
    for (const key of this.negative.keys())
      if (key.startsWith(`${url}\n`)) this.negative.delete(key)
    void this.persistence.deleteUrl(url).catch(() => {})
  }
  clearFailures() {
    this.negative.clear()
  }

  private remember(entry: Entry) {
    this.memory.delete(entry.key)
    this.memory.set(entry.key, entry)
    let bytes = [...this.memory.values()].reduce(
      (sum, item) => sum + item.bytes.byteLength,
      0
    )
    while (this.memory.size > 64 || bytes > 32 * 1024 * 1024) {
      const first = this.memory.keys().next().value!
      bytes -= this.memory.get(first)!.bytes.byteLength
      this.memory.delete(first)
    }
  }

  private async limited<T>(
    signal: AbortSignal,
    task: () => Promise<T>
  ): Promise<T> {
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {
        const at = this.queue.indexOf(start)
        if (at >= 0) this.queue.splice(at, 1)
        reject(new DOMException('Font request aborted', 'AbortError'))
      }
      const start = () => {
        signal.removeEventListener('abort', cancel)
        if (signal.aborted) {
          cancel()
          return
        }
        this.active++
        resolve()
      }
      if (signal.aborted) {
        cancel()
        return
      }
      signal.addEventListener('abort', cancel, { once: true })
      if (this.active < this.concurrency) start()
      else this.queue.push(start)
    })
    try {
      return await task()
    } finally {
      this.active--
      this.queue.shift()?.()
    }
  }

  private async load(
    key: string,
    url: string,
    init: RequestInit,
    signal: AbortSignal
  ): Promise<Entry> {
    const cached = this.memory.get(key)
    if (!this.invalidated.has(url) && cached && cached.expires > Date.now()) {
      this.remember(cached)
      return cached
    }
    if (!this.invalidated.has(url)) {
      const stored = await this.persistence.get(key).catch(() => undefined)
      if (signal.aborted) aborted()
      if (
        !this.invalidated.has(url) &&
        stored &&
        stored.expires > Date.now() &&
        stored.key === key &&
        stored.url === url &&
        Object.prototype.toString.call(stored.bytes) ===
          '[object ArrayBuffer]' &&
        stored.bytes.byteLength <= MAX_FONT_BYTES
      ) {
        this.remember(stored)
        return stored
      }
    }
    return this.limited(signal, async () => {
      let lastError: unknown
      for (let attempt = 0; attempt < 2; attempt++) {
        if (signal.aborted) aborted()
        const controller = new AbortController()
        const cancel = () => controller.abort()
        signal.addEventListener('abort', cancel, { once: true })
        const timer = setTimeout(cancel, 6500)
        try {
          const response = await this.fetcher(url, {
            ...init,
            signal: controller.signal,
            cache: 'no-cache',
            credentials: 'omit',
            redirect: 'error',
            mode: 'cors',
            referrerPolicy: 'no-referrer'
          })
          if (signal.aborted || controller.signal.aborted) aborted()
          if (!response.ok) throw new HttpError(response.status)
          if (response.url) bunnyResourceUrl(response.url)
          const type = (response.headers.get('content-type') || '')
            .split(';')[0]
            .trim()
            .toLowerCase()
          const css = new URL(url).pathname === '/css'
          const valid = css
            ? type === 'text/css'
            : /^(?:font\/(?:woff2?|ttf|otf|sfnt)|application\/(?:octet-stream|font-woff2?|x-font-(?:ttf|opentype)))$/.test(
                type
              )
          if (!valid) throw new HttpError(415)
          const limit = css ? 1024 * 1024 : MAX_FONT_BYTES
          if (Number(response.headers.get('content-length')) > limit)
            throw new HttpError(413)
          if (!response.body) throw new HttpError(422)
          const reader = response.body.getReader()
          const chunks: Uint8Array[] = []
          let size = 0
          try {
            while (true) {
              const chunk = await reader.read()
              if (chunk.done) break
              size += chunk.value.length
              if (size > limit) throw new HttpError(413)
              chunks.push(chunk.value)
            }
          } finally {
            await reader.cancel().catch(() => {})
          }
          if (signal.aborted || controller.signal.aborted) aborted()
          const bytes = new Uint8Array(size)
          let offset = 0
          chunks.forEach(chunk => {
            bytes.set(chunk, offset)
            offset += chunk.length
          })
          const control = response.headers.get('cache-control') || ''
          const max = css ? 3600000 : 86400000
          const age = /max-age\s*=\s*(\d+)/i.exec(control)
          const ttl = /no-store|no-cache/i.test(control)
            ? 0
            : Math.min(max, age ? Number(age[1]) * 1000 : max)
          const entry: Entry = {
            key,
            url,
            bytes: bytes.buffer,
            headers: [...response.headers.entries()],
            expires: Date.now() + ttl,
            accessed: Date.now()
          }
          if (ttl) {
            this.invalidated.delete(url)
            this.remember(entry)
            void this.persistence.put(entry).catch(() => {})
          }
          return entry
        } catch (error) {
          lastError = error
          if (signal.aborted) aborted()
          if (error instanceof HttpError && error.status < 500) break
        } finally {
          clearTimeout(timer)
          signal.removeEventListener('abort', cancel)
          controller.abort()
        }
      }
      this.negative.set(key, { error: lastError, expires: Date.now() + 30000 })
      if (this.negative.size > 256)
        this.negative.delete(this.negative.keys().next().value!)
      throw lastError
    })
  }

  async fetch(
    url: string,
    init: RequestInit = {},
    version = ''
  ): Promise<Response> {
    url = bunnyResourceUrl(url)
    const signal = init.signal
    if (signal?.aborted) aborted()
    const key = `${url}\n${version}`
    const failure = this.negative.get(key)
    if (failure && failure.expires > Date.now()) throw failure.error
    let job = this.pending.get(key)
    if (!job) {
      const controller = new AbortController()
      const promise = this.load(key, url, init, controller.signal)
      job = { controller, promise, users: 0 }
      this.pending.set(key, job)
      const current = job
      void promise
        .finally(() => {
          if (this.pending.get(key) === current) this.pending.delete(key)
        })
        .catch(() => {})
    }
    const current = job
    current.users++
    return new Promise((resolve, reject) => {
      let finished = false
      const release = () => {
        if (finished) return false
        finished = true
        signal?.removeEventListener('abort', cancel)
        if (--current.users === 0 && this.pending.get(key) === current) {
          this.pending.delete(key)
          current.controller.abort()
        }
        return true
      }
      const cancel = () => {
        if (release())
          reject(new DOMException('Font request aborted', 'AbortError'))
      }
      signal?.addEventListener('abort', cancel, { once: true })
      if (signal?.aborted) {
        cancel()
        return
      }
      current.promise.then(
        entry => {
          try {
            const response = new Response(entry.bytes.slice(0), {
              headers: entry.headers
            })
            if (release()) resolve(response)
          } catch (error) {
            if (release()) reject(error)
          }
        },
        error => {
          if (release()) reject(error)
        }
      )
    })
  }
}

export const sharedFontResources = new FontResourceStore()
