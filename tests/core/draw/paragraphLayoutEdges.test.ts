import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { TextParticle } from '@/editor/core/draw/particle/TextParticle'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ElementType } from '@/editor/dataset/enum/Element'
import { EditorMode, PaperDirection } from '@/editor/dataset/enum/Editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'
import type { IEditorData, IEditorOption } from '@/editor/interface/Editor'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

const draws: Draw[] = []
function render(data: IEditorData, override: IEditorOption = {}): Draw {
  const options = mergeOption({
    width: 300,
    height: 200,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    preserveLeadingParagraph: true,
    ...override
  })
  for (const story of [data.main, data.header, data.footer]) {
    if (story)
      formatElementList(story, {
        editorOptions: options,
        isForceCompensation: true
      })
  }
  const container = document.createElement('div')
  document.body.appendChild(container)
  const draw = new Draw(
    container,
    options,
    data,
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  draw.render()
  return draw
}
function paragraph(value: string): IElement {
  return { value, lineHeight: { rule: 'exact', value: 20 }, spacingAfter: 7 }
}
afterEach(() => {
  for (const draw of draws.splice(0)) draw.destroy()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('paragraph layout boundary cases', () => {
  it.each([0.5, 1, 2])(
    'scales exact line boxes and paragraph spacing together at zoom %s',
    scale => {
      const draw = render(
        {
          main: [
            {
              ...paragraph('\nx'),
              spacingBefore: 3
            }
          ]
        },
        { scale }
      )
      expect(draw.getRowList()[0]?.height).toBeCloseTo(27 * scale)
      expect(draw.getRowList()[0]?.offsetY).toBeCloseTo(3 * scale)
    }
  )

  it('applies after-spacing only to the final soft-wrapped row, including a final character that wraps', () => {
    const draw = render({ main: [paragraph('\n'), paragraph('abc')] })
    const rows = draw.computeRowList({
      elementList: draw.getOriginalElementList(),
      innerWidth: 1
    })
    expect(rows.length).toBeGreaterThan(2)
    expect(rows.at(-1)?.height).toBe(27)
    expect(rows.at(-1)?.spacingAfter).toBe(7)
    expect(rows.slice(0, -1).every(row => !row.spacingAfter)).toBe(true)
    expect(rows.slice(0, -1).every(row => row.height === 20)).toBe(true)
  })

  it('preserves separate empty paragraphs rather than dropping or coalescing markers on reopen', () => {
    const draw = render({
      main: [paragraph('\n'), paragraph('\n'), paragraph('\n')]
    })
    const saved = draw.getValue()
    const reopened = render(saved.data, saved.options)
    expect(reopened.getRowList().map(row => row.height)).toEqual([27, 27, 27])
    expect(
      reopened.getOriginalElementList().map(element => element.value)
    ).toEqual([ZERO, ZERO, ZERO])
  })

  it('preserves marker identities and metrics in header, footer and nested table cells', () => {
    const marker = (id: string): IElement => ({
      ...paragraph('\n'),
      id,
      spacingBefore: 3
    })
    const table = (value: IElement[]): IElement => ({
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 120 }],
      trList: [{ height: 30, tdList: [{ colspan: 1, rowspan: 1, value }] }]
    })
    const draw = render({
      header: [marker('header')],
      footer: [marker('footer')],
      main: [marker('body'), table([marker('cell'), table([marker('nested')])])]
    })
    const saved = draw.getValue({ extraPickAttrs: ['id'] })
    const reopened = render(saved.data, saved.options)
    const collect = (elements: IElement[]): string[] =>
      elements.flatMap(element => [
        ...(element.id && element.value === '\n' ? [element.id] : []),
        ...(element.trList?.flatMap(tr =>
          tr.tdList.flatMap(td => collect(td.value))
        ) ?? [])
      ])
    const value = reopened.getValue({ extraPickAttrs: ['id'] })
    expect(collect(value.data.header ?? [])).toEqual(['header'])
    expect(collect(value.data.footer ?? [])).toEqual(['footer'])
    expect(collect(value.data.main)).toEqual(['body', 'cell', 'nested'])
    expect(value.data.header?.[0]?.lineHeight).toEqual({
      rule: 'exact',
      value: 20
    })
  })

  it('rejects unavailable browser font metrics instead of substituting ink bounds', () => {
    vi.spyOn(TextParticle.prototype, 'measureText').mockReturnValue({
      width: 10,
      actualBoundingBoxAscent: 7,
      actualBoundingBoxDescent: 2,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 10,
      fontBoundingBoxAscent: NaN,
      fontBoundingBoxDescent: NaN
    })
    expect(() => render({ main: [paragraph('\nx')] })).toThrow(
      /Font line-box metrics/
    )
  })

  it('keeps hidden text in the natural line box when design mode displays it', () => {
    vi.spyOn(TextParticle.prototype, 'measureText').mockReturnValue({
      width: 10,
      actualBoundingBoxAscent: 7,
      actualBoundingBoxDescent: 2,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 10,
      fontBoundingBoxAscent: 15,
      fontBoundingBoxDescent: 5
    })
    const draw = render(
      {
        main: [
          {
            value: '\nx',
            hide: true,
            lineHeight: { rule: 'multiple', value: 1 }
          }
        ]
      },
      { mode: EditorMode.DESIGN }
    )
    expect(draw.getRowList()[0]?.height).toBe(20)
  })

  it.each([0.5, 1, 2])(
    'uses the active landscape width without double-scaling at zoom %s',
    scale => {
      const draw = render(
        {
          main: [
            { value: 'portrait' },
            {
              type: ElementType.PAGE_BREAK,
              value: '\n',
              paperDirection: PaperDirection.HORIZONTAL
            },
            { value: 'landscape' }
          ]
        },
        { width: 300, height: 500, scale, margins: [10, 20, 30, 40] }
      )
      draw.setPageNo(1)
      expect(draw.getPageDirection(1)).toBe(PaperDirection.HORIZONTAL)
      expect(draw.getContextInnerWidth()).toBe(
        draw.getOriginalInnerWidth(PaperDirection.HORIZONTAL)
      )
      draw.setPageNo(0)
      expect(draw.getContextInnerWidth()).toBe(
        draw.getOriginalInnerWidth(PaperDirection.VERTICAL)
      )
    }
  )

  it.each([0.5, 1, 2])(
    'hit-tests landscape column whitespace using that page geometry at zoom %s',
    scale => {
      const draw = render(
        {
          main: [
            { value: 'portrait' },
            {
              type: ElementType.PAGE_BREAK,
              value: '\n',
              paperDirection: PaperDirection.HORIZONTAL
            },
            ...Array.from(
              { length: 24 },
              (_, i) =>
                ({
                  value: `\nrow ${i}`,
                  lineHeight: { rule: 'exact', value: 20 }
                }) satisfies IElement
            )
          ]
        },
        {
          width: 300,
          height: 500,
          scale,
          margins: [10, 20, 30, 40],
          column: { count: 2, gap: 20 }
        }
      )
      const portrait = draw.getColumnLayout(PaperDirection.VERTICAL)
      const landscape = draw.getColumnLayout(PaperDirection.HORIZONTAL)
      if (!portrait || !landscape)
        throw new Error('Expected two-column geometry')
      const rows = draw.getPosition().getPositionList()
      expect(draw.getPageRowList()).toHaveLength(2)
      expect(draw.getPageRowList()[1].filter(row => row.columnIndex === 0)).toHaveLength(12)
      expect(draw.getPageRowList()[1].filter(row => row.columnIndex === 1)).toHaveLength(12)
      const left = rows.find(
        p => p.pageNo === 1 && p.columnIndex === 0 && p.isLastLetter
      )
      const right = rows.find(
        p => p.pageNo === 1 && p.columnIndex === 1 && p.isLastLetter
      )
      if (!left || !right) throw new Error('Expected both landscape columns')
      const x =
        draw.getMargins(PaperDirection.HORIZONTAL)[3] +
        (portrait.offsets[1] + landscape.offsets[1]) / 2
      const hit = draw.getPosition().getPositionByXY({
        x,
        y: (left.coordinate.leftTop[1] + left.coordinate.leftBottom[1]) / 2,
        pageNo: 1
      })
      expect(hit.index).toBe(left.index)
      draw.setPageNo(1)
      expect(draw.getContextInnerWidth()).toBeCloseTo(landscape.width / scale)
    }
  )
})
