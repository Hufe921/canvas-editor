import { describe, expect, it } from 'vitest'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import {
  createDomFromElementList,
  getElementListByHTML,
  groupElementListByRowFlex
} from '../../../src/editor/utils/element'
import type { IElement } from '../../../src/editor/interface/Element'

describe('DEFER-019 HTML dir roundtrip', () => {
  it('exports element.direction as dir on wrapper', () => {
    const elementList: IElement[] = [
      { value: 'مرحبا', direction: TextDirection.RTL }
    ]
    const groups = groupElementListByRowFlex(elementList)
    expect(groups[0].data[0]?.value).toContain('م')
    const dom = createDomFromElementList(elementList, {})
    expect(dom.outerHTML).toContain('dir="rtl"')
    expect(dom.textContent).toContain('م')
  })

  it('imports dir=rtl into element.direction', () => {
    const html = '<div dir="rtl">مرحبا</div>'
    const list = getElementListByHTML(html, { innerWidth: 800 })
    expect(list.some(el => el.direction === TextDirection.RTL)).toBe(true)
  })

  it('roundtrips rtl paragraph direction', () => {
    const elementList: IElement[] = [
      { value: 'Hello', direction: TextDirection.LTR },
      { value: 'مرحبا', direction: TextDirection.RTL }
    ]
    const html = createDomFromElementList(elementList).innerHTML
    const back = getElementListByHTML(html, { innerWidth: 800 })
    expect(back.some(el => el.direction === TextDirection.RTL)).toBe(true)
  })
})
