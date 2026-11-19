import { describe, expect, it, vi } from 'vitest'
import { NativeTextShaper } from '@/editor/core/bidi/shape/NativeTextShaper'
import {
  ControlComponent,
  ControlType
} from '@/editor/dataset/enum/Control'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IElement } from '@/editor/interface/Element'

function createContext() {
  const measureText = vi.fn((text: string) => ({
    width: Array.from(text).length * 10
  }))
  const ctx = {
    font: '',
    direction: 'ltr',
    textAlign: 'left',
    save: vi.fn(),
    restore: vi.fn(),
    measureText
  } as unknown as CanvasRenderingContext2D
  return { ctx, measureText }
}

describe('NativeTextShaper', () => {
  it('按完整 run 测量并按逻辑前缀拆回元素宽度', () => {
    const { ctx, measureText } = createContext()
    const shaper = new NativeTextShaper()
    const elementList: IElement[] = [
      { value: 'ا', direction: TextDirection.RTL },
      { value: 'ا', direction: TextDirection.RTL },
      { value: 'ب', direction: TextDirection.RTL }
    ]
    const getFont = () => '16px sans-serif'

    const widths = elementList.map((_, index) =>
      shaper.measureElement(
        ctx,
        elementList,
        index,
        getFont,
        TextDirection.RTL
      )
    )

    expect(widths).toEqual([10, 10, 10])
    expect(measureText).toHaveBeenCalledTimes(3)
    expect(measureText.mock.calls.map(call => call[0])).toEqual([
      'ا',
      'اا',
      'ااب'
    ])
    expect(ctx.save).toHaveBeenCalledTimes(1)
    expect(ctx.restore).toHaveBeenCalledTimes(1)
  })

  it('相同样式和方向的 run 复用测量缓存', () => {
    const { ctx, measureText } = createContext()
    const shaper = new NativeTextShaper()
    const elementList: IElement[] = [
      { value: 'س', direction: TextDirection.RTL },
      { value: 'ل', direction: TextDirection.RTL }
    ]
    const getFont = vi.fn(() => '16px sans-serif')

    shaper.measureElement(ctx, elementList, 0, getFont, TextDirection.RTL)
    getFont.mockClear()
    shaper.measureElement(ctx, elementList, 0, getFont, TextDirection.RTL)

    expect(getFont).toHaveBeenCalledTimes(1)

    getFont.mockClear()
    shaper.measureElement(ctx, elementList, 1, getFont, TextDirection.RTL)

    // 仍需读取字体以校验缓存，但不得再次扫描 run 或调用原生测量
    expect(getFont).toHaveBeenCalledTimes(1)
    expect(measureText).toHaveBeenCalledTimes(2)
  })

  it('连写前缀出现负增量时按整段宽度分配非负字宽', () => {
    const widthMap: Record<string, number> = {
      م: 6,
      ر: 6,
      ح: 8,
      ب: 8,
      ا: 4,
      مر: 12,
      مرح: 18,
      مرحب: 28,
      مرحبا: 27
    }
    const ctx = {
      font: '',
      direction: 'ltr',
      textAlign: 'left',
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: widthMap[text] || 0 }))
    } as unknown as CanvasRenderingContext2D
    const shaper = new NativeTextShaper()
    const elementList: IElement[] = Array.from('مرحبا').map(value => ({
      value,
      direction: TextDirection.RTL
    }))
    const getFont = () => '16px sans-serif'

    const widths = elementList.map((_, index) =>
      shaper.measureElement(
        ctx,
        elementList,
        index,
        getFont,
        TextDirection.RTL
      )
    )

    expect(widths.every(width => width > 0)).toBe(true)
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(27)
  })

  it('控件文本与相邻同字体文本共享测量 run', () => {
    const { ctx, measureText } = createContext()
    const shaper = new NativeTextShaper()
    const elementList: IElement[] = [
      {
        value: 'ا',
        direction: TextDirection.RTL,
        controlId: 'control',
        controlComponent: ControlComponent.PREFIX
      },
      { value: '1', direction: TextDirection.RTL },
      { value: 'ب', direction: TextDirection.RTL }
    ]
    const getFont = () => '16px sans-serif'

    shaper.measureElement(ctx, elementList, 0, getFont, TextDirection.RTL)

    expect(measureText.mock.calls.map(call => call[0])).toEqual([
      'ا',
      '1',
      'ب'
    ])
  })

  it('复选框选项尾部间距不截断连写测量 run', () => {
    const { ctx, measureText } = createContext()
    const shaper = new NativeTextShaper()
    const elementList: IElement[] = Array.from('أوافق').map(
      (value, index) => ({
        value,
        direction: TextDirection.RTL,
        letterSpacing: index === 4 ? 5 : 0,
        controlComponent: ControlComponent.VALUE,
        control: { type: ControlType.CHECKBOX } as IElement['control']
      })
    )

    shaper.measureElement(
      ctx,
      elementList,
      0,
      () => '16px sans-serif',
      TextDirection.RTL
    )

    expect(measureText.mock.calls.map(call => call[0])).toEqual([
      'أ',
      'أو',
      'أوا',
      'أواف',
      'أوافق'
    ])
  })

  it('相同元素分段跨文档位置复用 run 测量缓存', () => {
    const { ctx, measureText } = createContext()
    const shaper = new NativeTextShaper()
    const createElements = (): IElement[] => [
      { value: 'A', letterSpacing: 1 },
      { value: 'ا', direction: TextDirection.RTL },
      { value: 'ب', direction: TextDirection.RTL }
    ]
    const getFont = () => '16px sans-serif'

    shaper.measureElement(
      ctx,
      createElements(),
      1,
      getFont,
      TextDirection.RTL
    )
    measureText.mockClear()
    shaper.measureElement(
      ctx,
      createElements(),
      1,
      getFont,
      TextDirection.RTL
    )

    expect(measureText).not.toHaveBeenCalled()
  })

  it('相同文本的不同元素分段不复用字宽缓存', () => {
    const { ctx, measureText } = createContext()
    const shaper = new NativeTextShaper()
    const getFont = () => '16px sans-serif'
    const splitElements: IElement[] = [
      { value: 'ا', direction: TextDirection.RTL },
      { value: 'ب', direction: TextDirection.RTL }
    ]
    const joinedElements: IElement[] = [
      { value: 'اب', direction: TextDirection.RTL }
    ]

    shaper.measureElement(
      ctx,
      splitElements,
      0,
      getFont,
      TextDirection.RTL
    )
    measureText.mockClear()
    shaper.measureElement(
      ctx,
      joinedElements,
      0,
      getFont,
      TextDirection.RTL
    )

    expect(measureText.mock.calls.map(call => call[0])).toEqual(['اب'])
  })

  it('混排数字按独立 BiDi run 测量避免字宽缩水', () => {
    const ctx = {
      font: '',
      direction: 'ltr',
      textAlign: 'left',
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn((text: string) => {
        const numberCount = text.startsWith('ع')
          ? text.match(/[0-9]/g)?.length || 0
          : 0
        return { width: Array.from(text).length * 10 - numberCount * 4 }
      })
    } as unknown as CanvasRenderingContext2D
    const shaper = new NativeTextShaper()
    const elementList: IElement[] = Array.from('ع2026-11').map(value => ({
      value,
      direction: TextDirection.RTL
    }))
    const getFont = () => '16px sans-serif'

    const widths = elementList.map((_, index) =>
      shaper.measureElement(
        ctx,
        elementList,
        index,
        getFont,
        TextDirection.RTL
      )
    )

    expect(widths).toEqual([10, 10, 10, 10, 10, 10, 10, 10])
  })

  it('按 BiDi 层级方向测量行内 run', () => {
    const directionList: CanvasDirection[] = []
    const ctx = {
      font: '',
      direction: 'ltr',
      textAlign: 'left',
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn(function (this: CanvasRenderingContext2D, text) {
        if (text.startsWith('T')) directionList.push(this.direction)
        return { width: Array.from(text).length * 10 }
      })
    } as unknown as CanvasRenderingContext2D
    const shaper = new NativeTextShaper()
    const elementList: IElement[] = Array.from(
      'T：39.5℃，P：80bpm；'
    ).map(value => ({
      value,
      direction: TextDirection.RTL
    }))

    shaper.measureElement(
      ctx,
      elementList,
      0,
      () => '16px sans-serif',
      TextDirection.RTL
    )

    expect(directionList.length).toBeGreaterThan(0)
    expect(directionList.every(direction => direction === 'ltr')).toBe(true)
  })
})
