import { HarfBuzzRuntime } from '@/editor/core/text-engine/HarfBuzzRuntime'
import { describe, expect, it, vi } from 'vitest'

describe('shared HarfBuzz runtime', () => {
  it('loads WASM only once for concurrent callers', async () => {
    const module = {} as Awaited<ReturnType<HarfBuzzRuntime['initialize']>>
    const load = vi.fn(async () => module)
    const runtime = new HarfBuzzRuntime(load)
    const first = runtime.initialize()
    expect(runtime.initialize()).toBe(first)
    const values = await Promise.all([first, runtime.initialize()])
    expect(values).toEqual([module, module])
    expect(load).toHaveBeenCalledTimes(1)
    expect(runtime.getModule()).toBe(module)
  })

  it('keeps initialization failures observable without retry/fallback loops', async () => {
    const failure = new Error('WASM unavailable')
    const load = vi.fn().mockRejectedValue(failure)
    const runtime = new HarfBuzzRuntime(load)
    await expect(runtime.initialize()).rejects.toBe(failure)
    await expect(runtime.initialize()).rejects.toBe(failure)
    expect(load).toHaveBeenCalledTimes(1)
    expect(() => runtime.getModule()).toThrow('not initialized')
  })

  it('does not expose an uninitialized runtime to synchronous shaping', () => {
    const load = vi.fn()
    const runtime = new HarfBuzzRuntime(load)
    expect(() => runtime.getModule()).toThrow('await editor.ready')
    expect(load).not.toHaveBeenCalled()
  })
})
