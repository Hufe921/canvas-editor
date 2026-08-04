import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { ControlComponent } from '../../../src/editor/dataset/enum/Control'
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
})
