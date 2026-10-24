import { afterEach, describe, expect, it } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import type { IEditorOption } from '@/editor/interface/Editor'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

const draws: Draw[] = []
function render(main: IElement[], override: IEditorOption = {}) {
  const options = mergeOption({
    width: 120,
    height: 200,
    margins: [20, 20, 20, 20],
    preserveLeadingParagraph: true,
    header: { disabled: true },
    footer: { disabled: true },
    defaultRowMargin: 0,
    defaultBasicRowMarginHeight: 0,
    ...override
  })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const host = document.createElement('div')
  document.body.appendChild(host)
  const draw = new Draw(
    host,
    options,
    { main, header: [], footer: [] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  draw.render()
  return draw
}
const prefix = (count: number): IElement[] =>
  Array.from({ length: count }, () => ({
    value: '\nprefix',
    lineHeight: { rule: 'exact', value: 20 }
  }))
const paragraph = (lines: number, style: Partial<IElement> = {}): IElement => ({
  value: '\n' + 'x'.repeat(80 * lines - 1),
  lineHeight: { rule: 'exact', value: 20 },
  ...style
})
const count = (
  draw: Draw,
  property: 'keepTogether' | 'keepWithNext' | 'widowControl'
) =>
  draw
    .getPageRowList()
    .map(
      rows =>
        rows.filter(row => row.elementList.some(el => el[property] === true))
          .length
    )

afterEach(() => {
  for (const draw of draws.splice(0)) draw.destroy()
  document.body.replaceChildren()
})

describe('opt-in main-story paragraph flow', () => {
  it.each([0.5, 1, 2])('keeps a fitting paragraph intact at zoom %s', scale => {
    const draw = render([...prefix(5), paragraph(4, { keepTogether: true })], {
      scale
    })
    expect(count(draw, 'keepTogether')).toEqual([0, 4])
  })
  it('prevents an orphan first line', () => {
    const draw = render([...prefix(7), paragraph(4, { widowControl: true })])
    expect(count(draw, 'widowControl')).toEqual([0, 4])
  })
  it('moves two final lines together instead of leaving one on the next page', () => {
    const draw = render([...prefix(5), paragraph(4, { widowControl: true })])
    expect(count(draw, 'widowControl')).toEqual([2, 2])
  })
  it('retains the old placement when widow control is explicitly false', () => {
    const draw = render([...prefix(5), paragraph(4, { widowControl: false })])
    const main = draw.getOriginalElementList()
    const pages = draw
      .getPageRowList()
      .map(
        rows =>
          rows.filter(row => main[row.startIndex]?.widowControl === false)
            .length
      )
    expect(pages).toEqual([3, 1])
  })
  it('keeps a heading with its following paragraph', () => {
    const draw = render([
      ...prefix(5),
      {
        value: '\nHeading',
        lineHeight: { rule: 'exact', value: 20 },
        keepWithNext: true
      },
      paragraph(4, { widowControl: true })
    ])
    expect(count(draw, 'keepWithNext')).toEqual([0, 1])
    expect(count(draw, 'widowControl')).toEqual([0, 4])
  })
  it('starts oversized kept paragraphs on a fresh slot and retains every line', () => {
    const draw = render([...prefix(1), paragraph(20, { keepTogether: true })])
    expect(count(draw, 'keepTogether')).toEqual([0, 8, 8, 4])
    const original = draw.getOriginalElementList()
    expect(draw.getPosition().getPositionList()).toHaveLength(original.length)
  })
  it('starts an oversized keep chain on a fresh slot and still progresses', () => {
    const draw = render([
      ...prefix(1),
      paragraph(8, { keepWithNext: true }),
      paragraph(8, { widowControl: true })
    ])
    expect(count(draw, 'keepWithNext')).toEqual([0, 8, 0])
    expect(count(draw, 'widowControl')).toEqual([0, 0, 8])
  })
  it('uses the next column without advancing a page', () => {
    const draw = render([...prefix(5), paragraph(4, { keepTogether: true })], {
      width: 240,
      column: { count: 2, gap: 40 }
    })
    expect(draw.getPageRowList()).toHaveLength(1)
    expect(
      draw
        .getRowList()
        .filter(row => row.elementList.some(el => el.keepTogether))
        .map(row => row.columnIndex)
    ).toEqual([1, 1, 1, 1])
  })
  it('page-break-before advances a page even when columns have room', () => {
    const draw = render(
      [...prefix(1), paragraph(1, { pageBreakBefore: true })],
      { width: 240, column: { count: 2, gap: 40 } }
    )
    expect(draw.getPageRowList()).toHaveLength(2)
    const rows = draw.getPageRowList()[1]
    expect(rows[0]?.columnIndex).toBe(0)
  })
  it('does not insert a blank page for page-break-before at the document start', () => {
    expect(
      render([paragraph(1, { pageBreakBefore: true })]).getPageRowList()
    ).toHaveLength(1)
  })
  it('does not duplicate an explicit page break', () => {
    const draw = render([
      ...prefix(1),
      { type: ElementType.PAGE_BREAK, value: '\n' },
      paragraph(1, { pageBreakBefore: true })
    ])
    expect(draw.getPageRowList()).toHaveLength(2)
  })
  it('retains styles and pagination through save/reopen', () => {
    const draw = render([
      ...prefix(5),
      paragraph(4, { keepTogether: true, widowControl: true })
    ])
    const saved = draw.getValue()
    const reopened = render(saved.data.main, saved.options)
    expect(count(reopened, 'keepTogether')).toEqual([0, 4])
    expect(count(reopened, 'widowControl')).toEqual([0, 4])
  })
  it('rejects flow in table cells rather than ignoring it', () => {
    expect(() =>
      render([
        {
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 80 }],
          trList: [
            {
              height: 0,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: [paragraph(1, { widowControl: true })]
                }
              ]
            }
          ]
        }
      ])
    ).toThrow(/main story/)
  })
  it('does not let a fully hidden paragraph create a page break', () => {
    const draw = render([
      ...prefix(1),
      { ...paragraph(1, { pageBreakBefore: true }), hide: true },
      ...prefix(1)
    ])
    expect(draw.getPageRowList()).toHaveLength(1)
  })
  it('retains complete characters after editing a kept paragraph', () => {
    const draw = render([...prefix(5), paragraph(4, { keepTogether: true })], {
      lab: { incrementalCompute: true }
    })
    const elements = draw.getOriginalElementList()
    const first = elements.find(element => element.keepTogether)
    if (!first) throw new Error('Missing kept text')
    draw.spliceElementList(elements, elements.indexOf(first) + 1, 0, [
      {
        value: 'y',
        keepTogether: true,
        lineHeight: { rule: 'exact', value: 20 }
      }
    ])
    draw.render()
    expect(draw.getPosition().getPositionList()).toHaveLength(elements.length)
    const saved = draw.getValue()
    expect(
      count(render(saved.data.main, saved.options), 'keepTogether')
    ).toEqual(count(draw, 'keepTogether'))
  })
  it('rejects keeping text with a following table explicitly', () => {
    expect(() =>
      render([
        paragraph(1, { keepWithNext: true }),
        {
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 80 }],
          trList: [
            {
              height: 0,
              tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'x' }] }]
            }
          ]
        }
      ])
    ).toThrow(/following object/)
  })
})
