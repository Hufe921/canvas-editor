import { describe, expect, it, vi } from 'vitest'
import { SubscriptParticle } from '@/editor/core/draw/particle/SubscriptParticle'
import { SuperscriptParticle } from '@/editor/core/draw/particle/SuperscriptParticle'
import type { IRowElement } from '@/editor/interface/Row'
import type { IRenderContext } from '@/editor/core/render/model/RenderContext'

const element: IRowElement = {
  value: 'ب',
  style: '16px sans-serif',
  metrics: {
    width: 10,
    height: 16,
    boundingBoxAscent: 12,
    boundingBoxDescent: 4
  }
}

function createContext() {
  return {
    direction: 'ltr' as CanvasDirection,
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn()
  } as unknown as IRenderContext
}

describe('directional standalone text particles', () => {
  it('上标使用已解析的行方向', () => {
    const ctx = createContext()
    new SuperscriptParticle().render(ctx, element, 20, 16, 'rtl')

    expect(ctx.direction).toBe('rtl')
    expect(ctx.fillText).toHaveBeenCalledWith('ب', 20, 8)
  })

  it('下标使用已解析的行方向', () => {
    const ctx = createContext()
    new SubscriptParticle().render(ctx, element, 20, 16, 'rtl')

    expect(ctx.direction).toBe('rtl')
    expect(ctx.fillText).toHaveBeenCalledWith('ب', 20, 24)
  })

  it('普通行不写入方向状态', () => {
    const ctx = createContext()
    new SuperscriptParticle().render(ctx, element, 20, 16)

    expect(ctx.direction).toBe('ltr')
  })
})
