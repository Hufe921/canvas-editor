import { describe, it, expect, vi } from 'vitest'
import { Header } from '@/editor/core/draw/frame/Header'
import { mergeOption } from '@/editor/utils/option'
import { IEditorOption } from '@/editor/interface/Editor'

function createMockDraw(optionOverrides: Partial<IEditorOption> = {}) {
  const options = mergeOption(optionOverrides)
  const drawRow = vi.fn()
  return {
    getPosition: vi.fn(() => ({})),
    getZone: vi.fn(() => ({ isHeaderActive: () => true })),
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

describe('Header', () => {
  it('禁用页面不渲染页眉', () => {
    const draw = createMockDraw({ header: { disabledPages: [0, 2] } })
    const header = new Header(draw)
    const ctx = createMockCtx()

    header.render(ctx, 0)
    expect(draw.drawRow).not.toHaveBeenCalled()

    header.render(ctx, 1)
    expect(draw.drawRow).toHaveBeenCalledTimes(1)

    header.render(ctx, 2)
    expect(draw.drawRow).toHaveBeenCalledTimes(1)
  })

  it('禁用页面高度返回 0', () => {
    const draw = createMockDraw({ header: { disabledPages: [1] } })
    const header = new Header(draw)

    expect(header.getHeight(1)).toBe(0)
    expect(header.getExtraHeight(1)).toBe(0)
    expect(header.getHeaderTop(1)).toBe(0)

    expect(header.getHeight(0)).toBeGreaterThanOrEqual(0)
    expect(header.getHeaderTop(0)).toBeGreaterThan(0)
  })

  it('全局 disabled 时所有页高度为 0', () => {
    const draw = createMockDraw({ header: { disabled: true } })
    const header = new Header(draw)

    expect(header.getHeight(0)).toBe(0)
    expect(header.getHeaderTop(0)).toBe(0)
    expect(header.getExtraHeight(0)).toBe(0)
  })
})
