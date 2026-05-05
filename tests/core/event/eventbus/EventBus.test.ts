import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../../../../src/editor/core/event/eventbus/EventBus'

describe('EventBus', () => {
  it('on + emit 触发回调并传递参数', () => {
    const bus = new EventBus<{ hello: (v: string) => void }>()
    const cb = vi.fn()
    bus.on('hello', cb)
    bus.emit('hello', 'world')
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('world')
  })

  it('emit 无订阅时不抛错', () => {
    const bus = new EventBus<{ noop: () => void }>()
    expect(() => bus.emit('noop')).not.toThrow()
  })

  it('off 移除指定回调', () => {
    const bus = new EventBus<{ event: () => void }>()
    const cb = vi.fn()
    bus.on('event', cb)
    bus.off('event', cb)
    bus.emit('event')
    expect(cb).not.toHaveBeenCalled()
  })

  it('isSubscribe 返回正确订阅状态', () => {
    const bus = new EventBus<{ event: () => void }>()
    expect(bus.isSubscribe('event')).toBe(false)
    bus.on('event', () => {})
    expect(bus.isSubscribe('event')).toBe(true)
  })

  it('dangerouslyClearAll 清空所有订阅', () => {
    const bus = new EventBus<{ a: () => void; b: () => void }>()
    bus.on('a', () => {})
    bus.on('b', () => {})
    bus.dangerouslyClearAll()
    expect(bus.isSubscribe('a')).toBe(false)
    expect(bus.isSubscribe('b')).toBe(false)
  })

  it('多个回调都被触发', () => {
    const bus = new EventBus<{ multi: (n: number) => void }>()
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    bus.on('multi', cb1)
    bus.on('multi', cb2)
    bus.emit('multi', 42)
    expect(cb1).toHaveBeenCalledWith(42)
    expect(cb2).toHaveBeenCalledWith(42)
  })
})
