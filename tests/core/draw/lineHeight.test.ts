import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { TextParticle } from '@/editor/core/draw/particle/TextParticle'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { ElementType } from '@/editor/dataset/enum/Element'
import { formatElementList, zipElementList } from '@/editor/utils/element'
import type { IElement } from '@/editor/interface/Element'
import type { IRow } from '@/editor/interface/Row'
import { applyLineHeight } from '@/editor/utils/lineHeight'

function render(main: IElement[]): Draw {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    width: 300,
    height: 140,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    preserveLeadingParagraph: true,
    defaultRowMargin: 0,
    defaultBasicRowMarginHeight: 0
  })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const draw = new Draw(
    container,
    options,
    { header: [], main, footer: [] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render()
  return draw
}
function row(rule: 'multiple' | 'exact' | 'atLeast', value: number): IRow {
  return {
    width: 10,
    height: 9,
    ascent: 7,
    startIndex: 0,
    rowIndex: 0,
    elementList: [
      {
        value: 'x',
        lineHeight: { value, rule },
        style: '16px serif',
        metrics: {
          width: 10,
          height: 16,
          boundingBoxAscent: 15,
          boundingBoxDescent: 5
        }
      }
    ]
  }
}
afterEach(() => vi.restoreAllMocks())
describe('opt-in paragraph line metrics', () => {
  it('uses complete font line boxes for multiple/at-least and allows authored exact spacing smaller than glyphs', () => {
    const multiple = row('multiple', 1.5)
    applyLineHeight(multiple, 1)
    expect(multiple.height).toBe(30)
    expect(multiple.ascent).toBe(20)
    const minimum = row('atLeast', 12)
    applyLineHeight(minimum, 1)
    expect(minimum.height).toBe(20)
    const exact = row('exact', 2)
    applyLineHeight(exact, 2)
    expect(exact.height).toBe(4)
    expect(exact.ascent).toBe(7)
  })
  it('keeps legacy rowMargin layout untouched', () => {
    const legacy = row('multiple', 1)
    delete legacy.elementList[0]?.lineHeight
    applyLineHeight(legacy, 1)
    expect(legacy.height).toBe(9)
    expect(legacy.ascent).toBe(7)
  })
  it('rejects invalid metrics instead of producing a zero or NaN page', () => {
    for (const value of [0, -1, Infinity, NaN])
      expect(() => applyLineHeight(row('exact', value), 1)).toThrow(
        /finite and positive/
      )
  })
  it('retains the largest ascent and descent in mixed runs', () => {
    const mixed = row('atLeast', 24)
    mixed.elementList.push({
      value: 'X',
      style: '',
      metrics: {
        width: 20,
        height: 40,
        boundingBoxAscent: 38,
        boundingBoxDescent: 2
      }
    })
    applyLineHeight(mixed, 1)
    expect(mixed.height).toBe(43)
  })
  it('paginates by the actual font line box even when the sample glyph falls back', () => {
    const actual = {
      width: 10,
      actualBoundingBoxAscent: 7,
      actualBoundingBoxDescent: 2,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 10,
      fontBoundingBoxAscent: 15,
      fontBoundingBoxDescent: 5
    }
    vi.spyOn(TextParticle.prototype, 'measureText').mockReturnValue(actual)
    vi.spyOn(TextParticle.prototype, 'measureBasisWord').mockReturnValue({
      ...actual,
      fontBoundingBoxAscent: 75,
      fontBoundingBoxDescent: 25
    })
    const main: IElement[] = []
    for (let i = 0; i < 8; i++)
      main.push(
        { value: '\n', lineHeight: { rule: 'multiple', value: 1 } },
        { value: 'x', lineHeight: { rule: 'multiple', value: 1 } }
      )
    const draw = render(main)
    expect(draw.getRowList().every(row => row.height === 20)).toBe(true)
    expect(draw.getPageRowList().length).toBe(2)
    const legacy = render([{ value: '\nx\nx\nx\nx\nx\nx\nx\nx' }])
    expect(legacy.getPageRowList().length).toBe(1)
  })
  it('retains first before spacing, final after spacing, and exact blank spacer height', () => {
    const draw = render([
      {
        value: '\n',
        lineHeight: { rule: 'exact', value: 2 },
        spacingBefore: 3,
        spacingAfter: 7
      }
    ])
    const first = draw.getRowList()[0]
    expect(first?.offsetY).toBe(3)
    expect(first?.height).toBe(9)
    expect(first?.spacingAfter).toBe(7)
  })
  it('honors fractional line multiples and counts an inline image once above the baseline', () => {
    const short = row('multiple', 0.5)
    applyLineHeight(short, 1)
    expect(short.height).toBe(10)
    const mixed = row('atLeast', 24)
    mixed.elementList.push({
      value: 'asset',
      type: ElementType.IMAGE,
      style: '',
      metrics: {
        width: 80,
        height: 80,
        boundingBoxAscent: 0,
        boundingBoxDescent: 80
      }
    })
    applyLineHeight(mixed, 1)
    expect(mixed.height).toBe(85)
  })
  it('keeps an existing leading marker and its identity only when requested', () => {
    const options = mergeOption({ preserveLeadingParagraph: true })
    const data: IElement[] = [
      { id: 'paragraph', value: '\n', lineHeight: { rule: 'exact', value: 2 } }
    ]
    formatElementList(data, {
      editorOptions: options,
      isForceCompensation: true
    })
    expect(data).toHaveLength(1)
    expect(data[0]?.id).toBe('paragraph')
    const legacy: IElement[] = [{ id: 'paragraph', value: '\n' }]
    formatElementList(legacy, {
      editorOptions: mergeOption({}),
      isForceCompensation: true
    })
    expect(legacy).toHaveLength(2)
    const empty: IElement[] = []
    formatElementList(empty, {
      editorOptions: options,
      isForceCompensation: true
    })
    expect(empty).toHaveLength(1)
  })
  it('does not resurrect the height of a final hidden review row', () => {
    const draw = render([
      { value: '\n', lineHeight: { rule: 'exact', value: 20 } },
      { value: 'hidden', hide: true, lineHeight: { rule: 'exact', value: 20 } }
    ])
    expect(draw.getRowList().at(-1)?.height).toBe(0)
  })
  it('serializes metrics so reopen does not silently restore legacy ink height', () => {
    const draw = render([
      { value: '\n', lineHeight: { rule: 'atLeast', value: 24 } },
      { value: 'x', lineHeight: { rule: 'atLeast', value: 24 } }
    ])
    expect(
      draw
        .getValue()
        .data.main.some(
          element =>
            element.lineHeight?.rule === 'atLeast' &&
            element.lineHeight.value === 24
        )
    ).toBe(true)
  })
})

it('round-trips a lone blank paragraph with its exact spacing instead of dropping the adopted marker', () => {
  const first = render([
    {
      id: 'blank',
      value: '\n',
      lineHeight: { rule: 'exact', value: 2 },
      spacingBefore: 3,
      spacingAfter: 7
    }
  ])
  const saved = first.getValue({ extraPickAttrs: ['id'] })
  expect(saved.data.main).toHaveLength(1)
  expect(saved.data.main[0]?.id).toBe('blank')
  const second = render(saved.data.main)
  expect(second.getRowList()[0]?.height).toBe(9)
  expect(second.getRowList()[0]?.offsetY).toBe(3)
})
it('coalesces identical line-height values but retains a change in line rule', () => {
  const same = zipElementList([
    { value: 'a', lineHeight: { rule: 'exact', value: 20 } },
    { value: 'b', lineHeight: { rule: 'exact', value: 20 } },
    { value: 'c', lineHeight: { rule: 'atLeast', value: 20 } }
  ])
  expect(same.map(element => element.value)).toEqual(['ab', 'c'])
})

it('does not enlarge visible text for a hidden inline image', () => {
  const mixed = row('atLeast', 24)
  mixed.elementList.push({
    value: 'hidden image',
    type: ElementType.IMAGE,
    hide: true,
    style: '',
    metrics: {
      width: 80,
      height: 100,
      boundingBoxAscent: 0,
      boundingBoxDescent: 100
    }
  })
  applyLineHeight(mixed, 1, element => !!element.hide)
  expect(mixed.height).toBe(24)
})
