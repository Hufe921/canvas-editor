import { describe, expect, it, vi } from 'vitest'
import { TextMeasurer } from '@/editor/core/layout/TextMeasurer'
import { METRICS_BASIS_TEXT } from '@/editor/dataset/constant/Common'

function createContext() {
  return document.createElement('canvas').getContext('2d')!
}

describe('TextMeasurer', () => {
  it('使用元素指定宽度并保留原生字体的其他度量', () => {
    const ctx = createContext()
    const measurer = new TextMeasurer(ctx)
    const nativeMetrics = ctx.measureText('文字')

    const metrics = measurer.measure(
      { value: '文字', width: 36 },
      '16px sans-serif'
    )

    expect(metrics).toEqual({
      width: 36,
      actualBoundingBoxAscent: nativeMetrics.actualBoundingBoxAscent,
      actualBoundingBoxDescent: nativeMetrics.actualBoundingBoxDescent,
      actualBoundingBoxLeft: nativeMetrics.actualBoundingBoxLeft,
      actualBoundingBoxRight: nativeMetrics.actualBoundingBoxRight,
      fontBoundingBoxAscent: nativeMetrics.fontBoundingBoxAscent,
      fontBoundingBoxDescent: nativeMetrics.fontBoundingBoxDescent
    })
  })

  it('按文本和字体缓存度量结果', () => {
    const ctx = createContext()
    const measureSpy = vi.spyOn(ctx, 'measureText')
    const measurer = new TextMeasurer(ctx)

    const first = measurer.measure({ value: 'cache' }, '16px sans-serif')
    const second = measurer.measure({ value: 'cache' }, '16px sans-serif')
    measurer.measure({ value: 'cache' }, '18px sans-serif')

    expect(second).toBe(first)
    expect(measureSpy).toHaveBeenCalledTimes(2)
  })

  it('缺省字体时按上下文实际字体隔离缓存', () => {
    const ctx = createContext()
    const measureSpy = vi.spyOn(ctx, 'measureText')
    const measurer = new TextMeasurer(ctx)
    const font = undefined as unknown as string
    ctx.font = '16px sans-serif'
    const small = measurer.measureText(METRICS_BASIS_TEXT, font)
    ctx.font = '32px sans-serif'
    const large = measurer.measureText(METRICS_BASIS_TEXT, font)

    expect(large).not.toBe(small)
    expect(measureSpy).toHaveBeenCalledTimes(2)
  })

  it('优先使用调用方提供的测量上下文', () => {
    const defaultCtx = createContext()
    const suppliedCtx = createContext()
    const defaultSpy = vi.spyOn(defaultCtx, 'measureText')
    const suppliedSpy = vi.spyOn(suppliedCtx, 'measureText')
    const measurer = new TextMeasurer(defaultCtx)

    measurer.measure({ value: 'context' }, '16px sans-serif', suppliedCtx)

    expect(suppliedSpy).toHaveBeenCalledOnce()
    expect(defaultSpy).not.toHaveBeenCalled()
  })

  it('测量文本时应用指定字体', () => {
    const ctx = createContext()
    const measurer = new TextMeasurer(ctx)

    measurer.measureText('plain', '18px serif')

    expect(ctx.font).toBe('18px serif')
  })

  it('测量基准字符后恢复上下文字体', () => {
    const ctx = createContext()
    const measureSpy = vi.spyOn(ctx, 'measureText')
    const measurer = new TextMeasurer(ctx)
    ctx.font = '12px serif'

    measurer.measureBasis('20px sans-serif')

    expect(measureSpy).toHaveBeenCalledWith(METRICS_BASIS_TEXT)
    expect(ctx.font).toBe('12px serif')
  })
})
