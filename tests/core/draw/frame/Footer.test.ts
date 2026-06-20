import { describe, it, expect, vi } from 'vitest'
import { Footer } from '@/editor/core/draw/frame/Footer'
import { mergeOption } from '@/editor/utils/option'
import { IEditorOption } from '@/editor/interface/Editor'

function createMockDraw(optionOverrides: Partial<IEditorOption> = {}) {
  const options = mergeOption(optionOverrides)
  const drawRow = vi.fn()
  return {
    getPosition: vi.fn(() => ({})),
    getZone: vi.fn(() => ({ isFooterActive: () => true })),
    getOptions: vi.fn(() => options),
    getInnerWidth: vi.fn(() => 554),
    getHeight: vi.fn(() => 1123),
    getMargins: vi.fn(() => [100, 120, 100, 120]),
    drawRow,
    options
  } as any
}

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    fillText: vi.fn()
  } as any
}

describe('Footer', () => {
  it('禁用页面不渲染页脚', () => {
    const draw = createMockDraw({ footer: { disabledPages: [0, 2] } })
    const footer = new Footer(draw)
    const ctx = createMockCtx()

    footer.render(ctx, 0)
    expect(draw.drawRow).not.toHaveBeenCalled()

    footer.render(ctx, 1)
    expect(draw.drawRow).toHaveBeenCalledTimes(1)

    footer.render(ctx, 2)
    expect(draw.drawRow).toHaveBeenCalledTimes(1)
  })

  it('禁用页面高度返回 0', () => {
    const draw = createMockDraw({ footer: { disabledPages: [1] } })
    const footer = new Footer(draw)

    expect(footer.getHeight(1)).toBe(0)
    expect(footer.getExtraHeight(1)).toBe(0)
    expect(footer.getFooterBottom(1)).toBe(0)

    expect(footer.getFooterBottom(0)).toBeGreaterThan(0)
  })

  it('全局 disabled 时所有页高度为 0', () => {
    const draw = createMockDraw({ footer: { disabled: true } })
    const footer = new Footer(draw)

    expect(footer.getHeight(0)).toBe(0)
    expect(footer.getFooterBottom(0)).toBe(0)
    expect(footer.getExtraHeight(0)).toBe(0)
  })
})
