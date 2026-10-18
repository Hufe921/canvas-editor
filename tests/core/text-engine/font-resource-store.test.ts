import {
  FontResourceStore,
  type FontResourcePersistence
} from '@/editor/core/text-engine/font/bunny/FontResourceStore'
import { afterEach, describe, expect, it, vi } from 'vitest'

const url = 'https://fonts.bunny.net/font.woff2'
function response(text = 'font', cache = 'public, max-age=60') {
  return new Response(text, {
    headers: { 'content-type': 'font/woff2', 'cache-control': cache }
  })
}
function persistence(): FontResourcePersistence {
  const entries = new Map<string, any>()
  return {
    get: vi.fn(async key => entries.get(key)),
    put: vi.fn(async entry => {
      entries.set(entry.key, structuredClone(entry))
    }),
    deleteUrl: vi.fn(async url => {
      for (const [key, value] of entries)
        if (value.url === url) entries.delete(key)
    })
  }
}
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('shared font resource transport', () => {
  it('coalesces concurrent callers and detaches cancellation per subscriber', async () => {
    let finish!: (response: Response) => void
    let transportSignal: AbortSignal | null | undefined
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        transportSignal = init?.signal
        return new Promise(resolve => {
          finish = resolve
        })
      })
    const store = new FontResourceStore(fetcher, persistence())
    const first = new AbortController()
    const a = store.fetch(url, { signal: first.signal })
    const assertion = expect(a).rejects.toMatchObject({ name: 'AbortError' })
    const b = store.fetch(url)
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    first.abort()
    await assertion
    expect(transportSignal?.aborted).toBe(false)
    finish(response())
    expect(await (await b).text()).toBe('font')
    expect(await (await store.fetch(url)).text()).toBe('font')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('aborts the last subscriber and removes queued requests without issuing HTTP', async () => {
    const signals: AbortSignal[] = []
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          signals.push(init!.signal!)
          init!.signal!.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError'))
          )
        })
    )
    const store = new FontResourceStore(fetcher, persistence(), 1)
    const one = new AbortController(),
      two = new AbortController()
    const a = store.fetch(url, { signal: one.signal })
    const b = store.fetch(url + '?second', { signal: two.signal })
    const checks = [
      expect(a).rejects.toThrow('aborted'),
      expect(b).rejects.toThrow('aborted')
    ]
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    two.abort()
    one.abort()
    await Promise.all(checks)
    expect(signals[0].aborted).toBe(true)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('bounds concurrency and retries transient failures only twice', async () => {
    let active = 0,
      maximum = 0
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => {
      active++
      maximum = Math.max(maximum, active)
      await new Promise(resolve => setTimeout(resolve, 5))
      active--
      return response()
    })
    const store = new FontResourceStore(fetcher, persistence(), 2)
    await Promise.all(
      Array.from({ length: 5 }, (_, i) => store.fetch(url + '?v=' + i))
    )
    expect(maximum).toBe(2)
    fetcher.mockResolvedValue(new Response(null, { status: 503 }))
    await expect(store.fetch(url + '?failure')).rejects.toThrow('503')
    expect(fetcher).toHaveBeenCalledTimes(7)
    await expect(store.fetch(url + '?failure')).rejects.toThrow('503')
    expect(fetcher).toHaveBeenCalledTimes(7)
    store.clearFailures()
    fetcher.mockResolvedValue(new Response(null, { status: 404 }))
    await expect(store.fetch(url + '?failure')).rejects.toThrow('404')
    expect(fetcher).toHaveBeenCalledTimes(8)
  })

  it('times out finitely and expires negative entries', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError'))
          )
        })
    )
    const store = new FontResourceStore(fetcher, persistence())
    const pending = store.fetch(url)
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'AbortError'
    })
    await vi.advanceTimersByTimeAsync(13001)
    await assertion
    expect(fetcher).toHaveBeenCalledTimes(2)
    await expect(store.fetch(url)).rejects.toThrow('aborted')
    expect(fetcher).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(30001)
    fetcher.mockImplementation(async () => response())
    await store.fetch(url)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('uses persistent fresh entries, version isolation, TTL and explicit invalidation', async () => {
    const disk = persistence()
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => response())
    await new FontResourceStore(fetcher, disk).fetch(url, {}, 'v1')
    const store = new FontResourceStore(fetcher, disk)
    await store.fetch(url, {}, 'v1')
    expect(fetcher).toHaveBeenCalledTimes(1)
    await store.fetch(url, {}, 'v2')
    expect(fetcher).toHaveBeenCalledTimes(2)
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61000)
    await store.fetch(url, {}, 'v2')
    expect(fetcher).toHaveBeenCalledTimes(3)
    store.invalidate(url)
    await store.fetch(url, {}, 'v2')
    expect(fetcher).toHaveBeenCalledTimes(4)
    expect(fetcher.mock.calls[3][1]?.cache).toBe('no-cache')
  })

  it('evicts least recently used memory entries at the entry limit', async () => {
    const disk: FontResourcePersistence = {
      get: async () => undefined,
      put: async () => {},
      deleteUrl: async () => {}
    }
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => response())
    const store = new FontResourceStore(fetcher, disk)
    for (let i = 0; i < 65; i++) await store.fetch(`${url}?item=${i}`)
    await store.fetch(`${url}?item=64`)
    expect(fetcher).toHaveBeenCalledTimes(65)
    await store.fetch(`${url}?item=0`)
    expect(fetcher).toHaveBeenCalledTimes(66)
  })

  it('honors no-store and falls back when persistent storage fails', async () => {
    const disk = persistence()
    vi.mocked(disk.get).mockRejectedValue(new Error('denied'))
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => response('font', 'no-store'))
    const store = new FontResourceStore(fetcher, disk)
    await store.fetch(url)
    await store.fetch(url)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(disk.put).not.toHaveBeenCalled()
  })
})
