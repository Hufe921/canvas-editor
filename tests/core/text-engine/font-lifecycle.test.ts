import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
const data = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.length
)
const managers: FontManager[] = []
const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts')

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(yes => {
    resolve = yes
  })
  return { promise, resolve }
}

function manager() {
  const instance = new FontManager()
  managers.push(instance)
  return instance
}

afterEach(() => {
  managers.forEach(instance => instance.destroy())
  managers.length = 0
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts)
  else Reflect.deleteProperty(document, 'fonts')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('font initialization teardown', () => {
  it('aborts its fetch and rejects even if a transport returns data after destroy', async () => {
    const response = deferred<Response>()
    const requested = deferred<AbortSignal>()
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, options: RequestInit) => {
        requested.resolve(options.signal!)
        return response.promise
      })
    )
    const instance = manager()
    const pending = instance.init([{ family: 'Arabic', url: '/font.ttf' }])
    const signal = await requested.promise
    instance.destroy()
    expect(signal.aborted).toBe(true)
    response.resolve(new Response(data))
    await expect(pending).rejects.toMatchObject({ code: 'EDITOR_DESTROYED' })
    expect(instance.isReady()).toBe(false)
    expect(instance.getFont({ fontFamily: 'Arabic', fontSize: 16 })).toBeNull()
  })

  it('does not register a late FontFace result after destroy', async () => {
    const loaded = deferred<void>()
    const requested = deferred<void>()
    const add = vi.fn()
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { add, delete: vi.fn() }
    })
    vi.stubGlobal(
      'FontFace',
      class {
        async load() {
          requested.resolve()
          await loaded.promise
          return this
        }
      }
    )
    const instance = manager()
    const pending = instance.init([{ family: 'Arabic', data }])
    await requested.promise
    instance.destroy()
    loaded.resolve()
    await expect(pending).rejects.toMatchObject({ code: 'EDITOR_DESTROYED' })
    expect(add).not.toHaveBeenCalled()
    expect(instance.isReady()).toBe(false)
  })

  it('does not commit an automatic FontFace after its subscription is canceled', async () => {
    const loaded = deferred<void>(),
      requested = deferred<void>()
    const add = vi.fn()
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { add, delete: vi.fn() }
    })
    vi.stubGlobal(
      'FontFace',
      class {
        async load() {
          requested.resolve()
          await loaded.promise
          return this
        }
      }
    )
    const instance = manager()
    const controller = new AbortController()
    const pending = instance.registerFace(
      { family: 'Arabic', data },
      controller.signal
    )
    await requested.promise
    controller.abort()
    loaded.resolve()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(instance.getRevision()).toBe(0)
    expect(instance.getFaces()).toEqual([])
    expect(add).not.toHaveBeenCalled()
  })

  it('removes only owned document fonts and leaves other editors usable', async () => {
    const faces = new Set<FontFace>()
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: faces
    })
    vi.stubGlobal(
      'FontFace',
      class {
        async load() {
          return this
        }
      }
    )
    const first = manager()
    const second = manager()
    await Promise.all([
      first.init([{ family: 'Arabic', data }]),
      second.init([{ family: 'Arabic', data }])
    ])
    expect(faces.size).toBe(2)
    first.destroy()
    expect(faces.size).toBe(1)
    expect(
      second.getFont({ fontFamily: 'Arabic', fontSize: 16 })
    ).not.toBeNull()
    second.destroy()
    expect(faces.size).toBe(0)
  })

  it('keeps browser registration failures distinct from valid HB font data', async () => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: new Set<FontFace>()
    })
    vi.stubGlobal(
      'FontFace',
      class {
        async load() {
          throw new Error('Browser rejected FontFace')
        }
      }
    )
    const instance = manager()
    const result = await instance.registerFace({ family: 'Arabic', data })
    expect(result).toMatchObject({
      status: 'registered',
      warnings: [
        {
          stage: 'register',
          reason: 'browserRegistrationFailed'
        }
      ]
    })
    expect(instance.getFailures()).toMatchObject([
      {
        stage: 'register',
        reason: 'browserRegistrationFailed'
      }
    ])
    expect(
      instance.resolve({ fontFamily: 'Arabic', fontSize: 16 }, 'مرحبا').covered
    ).toBe(true)
  })
})
