import { readFileSync } from 'node:fs'
import { mergeOption } from '../../../src/editor/utils/option'
import { describe, expect, it } from 'vitest'
import {
  ControlComponent,
  ControlType,
  ElementType,
  TextDirection
} from '../../../src/editor'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { LayoutHostAdapter } from '../../../src/editor/core/text-engine-host/LayoutHostAdapter'
import type { IElement } from '../../../src/editor/interface/Element'

function options(defaultDirection: TextDirection = TextDirection.LTR) {
  return mergeOption({
    defaultFont: 'Arabic',
    autoDownloadFonts: false,
    defaultSize: 16,
    defaultDirection,
    fonts: [
      {
        family: 'Arabic',
        data: new Uint8Array(
          readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
        ).buffer
      }
    ]
  })
}

function buildRtlSignatureElements(): IElement[] {
  const controlMeta = {
    type: ControlType.TEXT,
    value: null,
    minWidth: 160,
    underline: true,
    prefix: '\u200c',
    postfix: '\u200c'
  }
  return [
    { value: ZERO, direction: TextDirection.RTL },
    {
      value: 'توقيع المريض: ',
      size: 16,
      direction: TextDirection.RTL,
      rowFlex: 'start' as any
    },
    {
      value: '\u200c',
      type: ElementType.CONTROL,
      control: controlMeta,
      controlId: 'sig',
      controlComponent: ControlComponent.PREFIX,
      direction: TextDirection.RTL
    },
    {
      value: '\u200c',
      type: ElementType.CONTROL,
      control: controlMeta,
      controlId: 'sig',
      controlComponent: ControlComponent.POSTFIX,
      direction: TextDirection.RTL
    }
  ]
}

function buildSignatureElements(withValue: boolean): IElement[] {
  const controlMeta = {
    type: ControlType.TEXT,
    value: null,
    minWidth: 160,
    underline: true,
    prefix: '\u200c',
    postfix: '\u200c'
  }
  const list: IElement[] = [
    { value: ZERO },
    { value: '患', size: 16 },
    { value: '者', size: 16 },
    { value: '签', size: 16 },
    { value: '名', size: 16 },
    { value: '：', size: 16 },
    {
      value: '\u200c',
      type: ElementType.CONTROL,
      control: controlMeta,
      controlId: 'sig',
      controlComponent: ControlComponent.PREFIX
    }
  ]
  if (withValue) {
    list.push(
      {
        value: '的',
        type: ElementType.CONTROL,
        control: controlMeta,
        controlId: 'sig',
        controlComponent: ControlComponent.VALUE,
        underline: true
      },
      {
        value: 'v',
        type: ElementType.CONTROL,
        control: controlMeta,
        controlId: 'sig',
        controlComponent: ControlComponent.VALUE,
        underline: true
      }
    )
  }
  list.push({
    value: '\u200c',
    type: ElementType.CONTROL,
    control: controlMeta,
    controlId: 'sig',
    controlComponent: ControlComponent.POSTFIX
  })
  return list
}

describe('signature minWidth during input', () => {
  it('ZWJ prefix/postfix must not get LRI/PDI isolates', () => {
    const bridge = new ElementBridge()
    const [paragraph] = bridge.scanParagraphs(buildSignatureElements(true), {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    expect(paragraph.text).toBe('患者签名：\u200c的v\u200c')
    expect(paragraph.text).not.toContain('\u2066')
    expect(paragraph.text).not.toContain('\u2069')
  })

  it('native VALUE right edge meets the reserved postfix underline slot', async () => {
    const elementList = buildSignatureElements(true)
    const bridge = new ElementBridge()
    const [paragraph] = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })

    const adapter = new LayoutHostAdapter(() => options())
    await adapter.ensureReady()
    const rows = adapter.layoutParagraphToRows(
      paragraph,
      elementList,
      500,
      0,
      'main'
    )
    expect(rows?.length).toBeGreaterThan(0)

    const els = rows![0].elementList
    const valueEls = els.filter(
      e => e.controlComponent === ControlComponent.VALUE
    )
    const postfix = els.find(
      e => e.controlComponent === ControlComponent.POSTFIX
    )!
    const lastValue = valueEls[valueEls.length - 1]
    const valueRight =
      (lastValue.visualLeft || 0) + (lastValue.metrics?.width || 0)
    const underlineStart = postfix.visualLeft || 0

    expect(postfix.left).toBe(0)
    expect(postfix.metrics.width).toBeGreaterThan(0)
    expect(Math.abs(underlineStart - valueRight)).toBeLessThan(1.5)
  })

  it('RTL signature reserves an unshifted underline box left of the label', async () => {
    const elementList = buildRtlSignatureElements()
    const bridge = new ElementBridge()
    const [paragraph] = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.RTL,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    expect(paragraph.direction).toBe('rtl')
    const adapter = new LayoutHostAdapter(() => options(TextDirection.RTL))
    await adapter.ensureReady()
    const rows = adapter.layoutParagraphToRows(
      paragraph,
      elementList,
      500,
      0,
      'main'
    )
    expect(rows?.length).toBeGreaterThan(0)

    const row = rows![0]
    expect(row.direction).toBe('rtl')
    const postfix = row.elementList.find(
      e => e.controlComponent === ControlComponent.POSTFIX
    )!
    expect(postfix.left).toBe(0)
    const underlineX = (postfix.visualLeft || 0) + (postfix.left || 0)
    const underlineRight = (postfix.visualLeft || 0) + postfix.metrics.width
    // 底线从 postfix 画到内容右缘，且整体位于标签左侧
    expect(underlineRight - underlineX).toBeCloseTo(160, 0)
    const label = row.elementList.find(e => !e.controlId && e.value !== ZERO)!
    expect(underlineRight).toBeCloseTo(label.visualLeft!, 6)
  })

  it('native minimum-width projection does not poison cached glyphs', async () => {
    const elementList = buildSignatureElements(true)
    const bridge = new ElementBridge()
    const [paragraph] = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    const adapter = new LayoutHostAdapter(() => options())
    await adapter.ensureReady()

    const rows1 = adapter.layoutParagraphToRows(
      paragraph,
      elementList,
      500,
      0,
      'main'
    )!
    const cachedGlyphLeft = rows1[0].engineLine!.glyphs.map(g => g.left)

    // 再次布局应命中同一 cache；若上次原地改了 glyphs，postfix.visualLeft 会累加漂走
    const rows2 = adapter.layoutParagraphToRows(
      paragraph,
      elementList,
      500,
      0,
      'main'
    )!
    expect(rows2[0].engineLine!.glyphs.map(g => g.left)).toEqual(
      cachedGlyphLeft
    )

    const els = rows2[0].elementList
    const values = els.filter(
      e => e.controlComponent === ControlComponent.VALUE
    )
    const postfix = els.find(
      e => e.controlComponent === ControlComponent.POSTFIX
    )!
    const last = values[values.length - 1]
    const valueRight = (last.visualLeft || 0) + (last.metrics?.width || 0)
    expect(Math.abs((postfix.visualLeft || 0) - valueRight)).toBeLessThan(1.5)
  })
})
