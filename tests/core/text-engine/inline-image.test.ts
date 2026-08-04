import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { ImageDisplay } from '../../../src/editor/dataset/enum/Common'
import { ControlComponent } from '../../../src/editor/dataset/enum/Control'
import { ControlType } from '../../../src/editor/dataset/enum/Control'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { BrowserTextShaper } from '../../../src/editor/core/text-engine/shape/BrowserTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'
import { mapLayoutToRows } from '../../../src/editor/core/text-engine-host/mapToLegacyRow'
import type { IElement } from '../../../src/editor/interface/Element'

describe('inline IMAGE / control segment start', () => {
  it('keeps default IMAGE in the same paragraph as surrounding text', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: '签' },
      { value: '【' },
      {
        value: 'data:image/png;base64,xx',
        type: ElementType.IMAGE,
        width: 89,
        height: 32
      },
      { value: '】' }
    ]
    const paras = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000',
      scale: 1
    })
    expect(paras).toHaveLength(1)
    expect(paras[0].text.includes('\uFFFC')).toBe(true)
    const obj = paras[0].spans.find(s => s.style.objectWidth != null)
    expect(obj?.style.objectWidth).toBe(89)
    expect(obj?.style.objectHeight).toBe(32)
    expect(obj?.logicalIndex).toBe(3)
  })

  it('maps IMAGE metrics into one row with neighbors', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: '【' },
      {
        value: '',
        type: ElementType.IMAGE,
        width: 89,
        height: 32
      },
      { value: '】' }
    ]
    const para = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000',
      scale: 1
    })[0]
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: para.spans,
      availableWidth: 500,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    expect(layout.lines).toHaveLength(1)
    expect(layout.lines[0].ascent).toBeGreaterThanOrEqual(32)
    const rows = mapLayoutToRows({
      layout,
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    expect(rows).toHaveLength(1)
    const img = rows[0].elementList.find(el => el.type === ElementType.IMAGE)!
    expect(img.metrics.width).toBe(89)
    expect(img.metrics.height).toBe(32)
    expect(rows[0].elementList.some(el => el.value === '【')).toBe(true)
    expect(rows[0].elementList.some(el => el.value === '】')).toBe(true)
  })

  it('layout cache misses when IMAGE height changes (row grows)', async () => {
    const { LayoutHostAdapter } = await import(
      '../../../src/editor/core/text-engine-host/LayoutHostAdapter'
    )
    const { TextEngineMode } = await import(
      '../../../src/editor/dataset/enum/TextDirection'
    )
    const { WordBreak } = await import(
      '../../../src/editor/dataset/enum/Editor'
    )
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: '公式' },
      {
        value: '',
        type: ElementType.IMAGE,
        width: 40,
        height: 20
      }
    ]
    const bridge = new ElementBridge()
    const host = new LayoutHostAdapter(
      () =>
        ({
          textEngine: TextEngineMode.HARFBUZZ,
          defaultFont: 'sans-serif',
          defaultSize: 16,
          defaultColor: '#000',
          defaultRowMargin: 1,
          defaultDirection: TextDirection.LTR,
          scale: 1,
          wordBreak: WordBreak.BREAK_WORD,
          fonts: [],
          checkbox: { width: 14, gap: 5 },
          radio: { width: 14, gap: 5 },
          label: { defaultColor: '#1976d2' }
        }) as any
    )
    ;(host as any).engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )

    const layoutRows = (h: number) => {
      elementList[2].height = h
      const para = bridge.scanParagraphs(elementList, {
        defaultDirection: TextDirection.LTR,
        defaultFont: 'sans-serif',
        defaultSize: 16,
        defaultColor: '#000',
        scale: 1
      })[0]
      return host.layoutParagraphToRows(para, elementList, 500, 0, 'main')
    }

    const rows20 = layoutRows(20)
    const rows80 = layoutRows(80)
    expect(rows20).toBeTruthy()
    expect(rows80).toBeTruthy()
    expect(rows20![0].height).toBeLessThan(rows80![0].height)
    expect(rows80![0].ascent).toBeGreaterThanOrEqual(80)
    expect(rows80![0].height).toBeGreaterThanOrEqual(80)
  })

  it('still breaks paragraph for floating IMAGE', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: '前' },
      {
        value: '',
        type: ElementType.IMAGE,
        width: 40,
        height: 40,
        imgDisplay: ImageDisplay.SURROUND
      },
      { value: '后' }
    ]
    const paras = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    expect(paras.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps control chrome starting a segment in one paragraph', () => {
    const bridge = new ElementBridge()
    const control = {
      type: ControlType.SELECT,
      value: null,
      placeholder: '分级',
      prefix: '{',
      postfix: '}',
      preText: '，高血压分级：'
    }
    const elementList: IElement[] = [
      { value: '\u200B' },
      {
        value: '{',
        type: ElementType.CONTROL,
        control,
        controlId: 'c1',
        controlComponent: ControlComponent.PREFIX
      },
      {
        value: '，',
        type: ElementType.CONTROL,
        control,
        controlId: 'c1',
        controlComponent: ControlComponent.PRE_TEXT
      },
      {
        value: '高',
        type: ElementType.CONTROL,
        control,
        controlId: 'c1',
        controlComponent: ControlComponent.PRE_TEXT
      },
      {
        value: '分',
        type: ElementType.CONTROL,
        control,
        controlId: 'c1',
        controlComponent: ControlComponent.PLACEHOLDER
      },
      {
        value: '}',
        type: ElementType.CONTROL,
        control,
        controlId: 'c1',
        controlComponent: ControlComponent.POSTFIX
      }
    ]
    const paras = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    expect(paras).toHaveLength(1)
    // LTR 段不包 LRI/PDI（避免跨行半截隔离）；括号与 preText 仍逻辑相邻
    expect(paras[0].text).not.toContain('\u2066')
    expect(paras[0].text).toContain('，')
    expect(paras[0].text.indexOf('{')).toBeLessThan(
      paras[0].text.indexOf('，')
    )
  })
})
