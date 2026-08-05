import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import {
  ControlComponent,
  ControlType
} from '../../../src/editor/dataset/enum/Control'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { BrowserTextShaper } from '../../../src/editor/core/text-engine/shape/BrowserTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'
import { mapLayoutToRows } from '../../../src/editor/core/text-engine-host/mapToLegacyRow'
import type { IElement } from '../../../src/editor/interface/Element'

describe('DEFER-024 inline control slots', () => {
  it('inserts object-replacement span for checkbox between arabic', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: 'م' },
      {
        value: '',
        type: ElementType.CHECKBOX,
        controlComponent: ControlComponent.CHECKBOX
      },
      { value: 'ر' }
    ]
    const paras = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.RTL,
      uiDirection: TextDirection.RTL,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000',
      checkboxWidth: 14,
      checkboxGap: 5,
      radioWidth: 14,
      radioGap: 5
    })
    expect(paras).toHaveLength(1)
    expect(paras[0].text.includes('\uFFFC')).toBe(true)
    const obj = paras[0].spans.find(s => s.style.objectWidth != null)
    expect(obj).toBeTruthy()
    expect(obj!.style.objectWidth).toBe(14 + 5 * 2)
    expect(obj!.logicalIndex).toBe(2)
  })

  it('maps checkbox metrics into legacy row without neighbor width steal', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: 'ab' },
      {
        value: '',
        type: ElementType.CHECKBOX,
        controlComponent: ControlComponent.CHECKBOX
      },
      { value: 'cd' }
    ]
    const para = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000',
      checkboxWidth: 14,
      checkboxGap: 5
    })[0]
    const engine = new TextLayoutEngine(new BidiResolver(), new BrowserTextShaper())
    const layout = engine.layoutParagraph({
      spans: para.spans,
      availableWidth: 500,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const rows = mapLayoutToRows({
      layout,
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    expect(rows[0].elementList.some(el => el.type === ElementType.CHECKBOX)).toBe(
      true
    )
    const cb = rows[0].elementList.find(el => el.type === ElementType.CHECKBOX)!
    expect(cb.metrics.width).toBe(24)
  })

  it('RTL checkbox: box sits on the right of its value text (opposite of LTR)', () => {
    const bridge = new ElementBridge()
    const checkboxMeta = {
      type: ControlType.CHECKBOX,
      value: null,
      valueSets: [{ value: 'موافق', code: '1' }]
    }
    const elementList: IElement[] = [
      { value: '\u200B', direction: TextDirection.RTL },
      { value: 'نعم', direction: TextDirection.RTL },
      {
        value: '{',
        type: ElementType.CONTROL,
        control: checkboxMeta,
        controlId: 'cb',
        controlComponent: ControlComponent.PREFIX,
        direction: TextDirection.RTL
      },
      {
        value: '',
        type: ElementType.CHECKBOX,
        controlComponent: ControlComponent.CHECKBOX,
        controlId: 'cb',
        control: checkboxMeta,
        direction: TextDirection.RTL
      },
      ...'موافق'.split('').map((value, vi2) => ({
        value,
        type: ElementType.CONTROL,
        control: checkboxMeta,
        controlId: 'cb',
        controlComponent: ControlComponent.VALUE,
        direction: TextDirection.RTL,
        color: vi2 === 0 ? '#123456' : '#000'
      })),
      {
        value: '}',
        type: ElementType.CONTROL,
        control: checkboxMeta,
        controlId: 'cb',
        controlComponent: ControlComponent.POSTFIX,
        direction: TextDirection.RTL
      }
    ]
    const para = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.RTL,
      uiDirection: TextDirection.RTL,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000',
      checkboxWidth: 14,
      checkboxGap: 5,
      radioWidth: 14,
      radioGap: 5
    })[0]
    // RTL checkbox：不包 LRI/PDI，让盒与值按 RTL 排列（盒在值右侧）
    expect(para.text).not.toContain('\u2066')
    expect(para.text).not.toContain('\u2069')

    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: para.spans,
      availableWidth: 500,
      direction: para.direction,
      align: 'right',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const rows = mapLayoutToRows({
      layout,
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    const cbEl = rows[0].elementList.find(
      el => el.controlComponent === ControlComponent.CHECKBOX
    )!
    const valueEls = rows[0].elementList.filter(
      el => el.controlComponent === ControlComponent.VALUE
    )
    const lastValue = valueEls[valueEls.length - 1]
    // RTL：盒在值文本右侧（visualLeft 更大）
    expect((cbEl.visualLeft || 0) + (cbEl.metrics?.width || 0)).toBeGreaterThan(
      (lastValue.visualLeft || 0) + (lastValue.metrics?.width || 0) - 1
    )
  })
})
