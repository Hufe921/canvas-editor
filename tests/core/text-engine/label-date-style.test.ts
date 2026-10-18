import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { defaultBadgeOption } from '../../../src/editor/dataset/constant/Badge'
import type { IElement } from '../../../src/editor/interface/Element'

describe('DEFER-023 LABEL / DATE engine style', () => {
  it('ElementBridge maps LABEL label.color onto the span without mutating source', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: ZERO },
      {
        value: '标签',
        type: ElementType.LABEL,
        label: { color: '#ff0000' }
      }
    ]
    const paragraphs = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000000',
      defaultLabelColor: '#1976d2',
      scale: 1
    })
    expect(paragraphs.length).toBe(1)
    expect(elementList[1].color).toBeUndefined()
    expect(paragraphs[0].spans[0].style.color).toBe('#ff0000')
  })

  it('ElementBridge uses defaultLabelColor when LABEL has no color', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: ZERO },
      { value: 'L', type: ElementType.LABEL }
    ]
    const paragraphs = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#111111',
      defaultLabelColor: '#1976d2',
      scale: 1
    })
    expect(elementList[1].color).toBeUndefined()
    expect(paragraphs[0].spans[0].style.color).toBe('#1976d2')
  })

  it('DATE remains text-like in paragraph scan', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: ZERO },
      { value: '2024', type: ElementType.DATE, dateId: 'd1' }
    ]
    const paragraphs = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000000',
      scale: 1
    })
    expect(paragraphs[0].spans.length).toBe(1)
    expect(paragraphs[0].text).toBe('2024')
  })
})

describe('DEFER-005 Badge right option', () => {
  it('default badge right sentinel is -1 (left anchoring)', () => {
    expect(defaultBadgeOption.right).toBe(-1)
    expect(defaultBadgeOption.left).toBe(5)
  })
})
