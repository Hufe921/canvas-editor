import { describe, expect, it } from 'vitest'
import {
  ControlComponent,
  ControlType,
  ElementType,
  TextDirection
} from '../../../src/editor'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import type { IElement } from '../../../src/editor/interface/Element'

describe('control bracket LRI isolate', () => {
  it('does not wrap LRI/PDI in LTR paragraphs (avoids wrap paint glitches)', () => {
    const control = {
      type: ControlType.TEXT,
      value: null,
      placeholder: '干预建议'
    }
    const elementList: IElement[] = [
      { value: '肥胖干预建议：' },
      {
        value: '{',
        type: ElementType.CONTROL,
        control,
        controlComponent: ControlComponent.PREFIX
      },
      ...('干预建议'.split('').map(value => ({
        value,
        type: ElementType.CONTROL,
        control,
        controlComponent: ControlComponent.PLACEHOLDER,
        color: '#ccc'
      }))),
      {
        value: '}',
        type: ElementType.CONTROL,
        control,
        controlComponent: ControlComponent.POSTFIX
      }
    ]
    const bridge = new ElementBridge()
    const [paragraph] = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.AUTO,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    expect(paragraph.direction).toBe('ltr')
    expect(paragraph.text).not.toContain('\u2066')
    expect(paragraph.text).not.toContain('\u2069')
    expect(paragraph.text).toContain('{干预建议}')
  })

  it('keeps {value} brace order inside RTL paragraph', () => {
    const control = {
      type: ControlType.TEXT,
      value: [{ value: '10-08-2022' }]
    }
    const elementList: IElement[] = [
      { value: 'توقيع: ', direction: TextDirection.RTL },
      {
        value: '{',
        direction: TextDirection.RTL,
        type: ElementType.CONTROL,
        control,
        controlComponent: ControlComponent.PREFIX
      },
      ...('10-08-2022'.split('').map(value => ({
        value,
        direction: TextDirection.RTL,
        type: ElementType.CONTROL,
        control,
        controlComponent: ControlComponent.VALUE
      }))),
      {
        value: '}',
        direction: TextDirection.RTL,
        type: ElementType.CONTROL,
        control,
        controlComponent: ControlComponent.POSTFIX
      }
    ]

    const bridge = new ElementBridge()
    const [paragraph] = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.RTL,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    expect(paragraph.direction).toBe('rtl')
    expect(paragraph.text.startsWith('توقيع: ')).toBe(true)
    expect(paragraph.text).toContain('\u2066{')
    expect(paragraph.text).toContain('}\u2069')

    const bidi = new BidiResolver()
    const visualIndices = bidi.getVisualIndices(
      paragraph.text,
      paragraph.direction
    )
    const visual = visualIndices.map(i => paragraph.text[i]).join('')
    // 花括号相对日期保持 {…}，而不是 }…{
    expect(visual).toContain('{10-08-2022}')
    expect(visual).not.toContain('}10-08-2022{')
  })
})
