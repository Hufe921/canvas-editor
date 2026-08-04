import { describe, expect, it } from 'vitest'
import {
  ControlComponent,
  ControlType,
  ElementType,
  TextDirection,
  TextEngineMode
} from '../../../src/editor'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { Control } from '../../../src/editor/core/draw/control/Control'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { LayoutHostAdapter } from '../../../src/editor/core/text-engine-host/LayoutHostAdapter'
import type { IElement } from '../../../src/editor/interface/Element'
import type { DeepRequired } from '../../../src/editor/interface/Common'
import type { IEditorOption } from '../../../src/editor/interface/Editor'

function options(): DeepRequired<IEditorOption> {
  return {
    textEngine: TextEngineMode.HARFBUZZ,
    defaultFont: 'sans-serif',
    defaultSize: 16,
    defaultColor: '#000',
    defaultRowMargin: 1,
    defaultDirection: TextDirection.LTR,
    direction: TextDirection.LTR,
    scale: 1,
    fonts: []
  } as unknown as DeepRequired<IEditorOption>
}

function stubControl(): Control {
  return new Control({
    getOptions: () => ({ scale: 1, control: {} }),
    getRange: () => ({}),
    getListener: () => ({}),
    getEventBus: () => ({})
  } as any)
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

  it('VALUE right edge should meet postfix underline start (no gap)', async () => {
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
    stubControl().applyEngineRowsMinWidth(rows!, 500)

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

    expect(postfix.left).toBeGreaterThan(0)
    expect(Math.abs(underlineStart - valueRight)).toBeLessThan(1.5)
  })

  it('applyEngineRowsMinWidth must not poison layout cache glyphs', async () => {
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
    const control = stubControl()

    const rows1 = adapter.layoutParagraphToRows(
      paragraph,
      elementList,
      500,
      0,
      'main'
    )!
    const cachedGlyphLeft = rows1[0].engineLine!.glyphs.map(g => g.left)
    control.applyEngineRowsMinWidth(rows1, 500)

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
    control.applyEngineRowsMinWidth(rows2, 500)

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
