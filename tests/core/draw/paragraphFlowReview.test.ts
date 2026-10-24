import { afterEach, describe, expect, it } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ElementType } from '@/editor/dataset/enum/Element'
import {
  PaperDirection,
  PageMode,
  EditorMode
} from '@/editor/dataset/enum/Editor'
import { TraceType } from '@/editor/dataset/enum/Trace'
import type { IElement } from '@/editor/interface/Element'
import type { IEditorOption } from '@/editor/interface/Editor'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

const draws: Draw[] = []
function layout(
  main: IElement[],
  override: IEditorOption = {},
  header: IElement[] = []
) {
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
  formatElementList(header, {
    editorOptions: options,
    isForceCompensation: true
  })
  const host = document.createElement('div')
  document.body.appendChild(host)
  const draw = new Draw(
    host,
    options,
    { main, header, footer: [] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  draw.render()
  return draw
}
const prefix = (n: number): IElement[] =>
  Array.from({ length: n }, () => ({
    value: '\npre',
    lineHeight: { rule: 'exact', value: 20 }
  }))
const p = (n: number, style: Partial<IElement> = {}): IElement => ({
  value: '\n' + 'x'.repeat(n * 80 - 1),
  lineHeight: { rule: 'exact', value: 20 },
  ...style
})
const summary = (draw: Draw) =>
  draw.getPageRowList().map(rows =>
    rows.map(row => ({
      start: row.startIndex,
      height: row.height,
      column: row.columnIndex
    }))
  )

afterEach(() => {
  for (const draw of draws.splice(0)) draw.destroy()
  document.body.replaceChildren()
})

describe('paragraph flow independent edge review', () => {
  it('keeps a marker-owned paragraph with wrapped hyperlink text intact', () => {
    const draw = layout([
      ...prefix(5),
      {
        value: '\n',
        keepTogether: true,
        lineHeight: { rule: 'exact', value: 20 }
      },
      {
        type: ElementType.HYPERLINK,
        value: '',
        valueList: [
          { value: 'x'.repeat(319), lineHeight: { rule: 'exact', value: 20 } }
        ],
        url: 'https://example.test',
        lineHeight: { rule: 'exact', value: 20 }
      }
    ])
    const pages = draw.getPageRowList()
    expect(
      draw
        .getOriginalElementList()
        .filter(element => element.type === ElementType.HYPERLINK)
    ).toHaveLength(319)
    expect(pages[0].every(row => row.startIndex < 20)).toBe(true)
    expect(pages[1]).toHaveLength(4)
  })
  it('retains the inherited overflow fallback for an indivisible oversized row', () => {
    const draw = layout([
      {
        value: '\nTall',
        keepTogether: true,
        lineHeight: { rule: 'exact', value: 180 }
      }
    ])
    // This exact overflow/blank-page fallback also occurs on the parent.
    // Multi-line oversized paragraphs use the separately tested flow behavior.
    expect(draw.getPageRowList().map(rows => rows.length)).toEqual([0, 1])
    expect(draw.getRowList()[0].height).toBe(180)
    expect(draw.getPosition().getPositionList()).toHaveLength(
      draw.getOriginalElementList().length
    )
  })
  it('keeps a paragraph across a direction-changing page break', () => {
    const draw = layout(
      [
        ...prefix(1),
        {
          type: ElementType.PAGE_BREAK,
          value: '\n',
          paperDirection: PaperDirection.HORIZONTAL
        },
        ...prefix(3),
        p(4, { keepTogether: true })
      ],
      { width: 120, height: 200 }
    )
    const kept = draw
      .getPageRowList()
      .map(
        rows =>
          rows.filter(row =>
            row.elementList.some(element => element.keepTogether)
          ).length
      )
    expect(kept.filter(n => n > 0)).toHaveLength(1)
  })
  it('retains default layout when every flow property is false', () => {
    const baseline = layout([...prefix(5), p(4)])
    const disabled = layout([
      ...prefix(5),
      p(4, {
        keepTogether: false,
        keepWithNext: false,
        widowControl: false,
        pageBreakBefore: false
      })
    ])
    expect(summary(disabled)).toEqual(summary(baseline))
  })
  it('matches fresh layout after removing the final enabled flow property', () => {
    const draw = layout([...prefix(5), p(4, { keepTogether: true })], {
      lab: { incrementalCompute: true }
    })
    const elements = draw.getOriginalElementList()
    for (const element of elements) element.keepTogether = false
    draw.spliceElementList(elements, elements.length - 1, 0, [{ value: 'y' }])
    draw.render()
    const saved = draw.getValue()
    const fresh = layout(saved.data.main, saved.options)
    expect(summary(draw)).toEqual(summary(fresh))
  })
  it.each([2, 3, 4])('retains widow pairs for %i-line paragraphs', n => {
    const draw = layout([...prefix(7), p(n, { widowControl: true })])
    expect(draw.getPageRowList()[0]).toHaveLength(7)
    expect(draw.getPageRowList()[1]).toHaveLength(n)
  })
  it('does not repeat breaks or mutate row placement on repeated layout', () => {
    const draw = layout([
      ...prefix(1),
      p(1, { pageBreakBefore: true }),
      p(4, { widowControl: true })
    ])
    const initial = summary(draw)
    for (let i = 0; i < 3; i++) {
      draw.render()
      expect(summary(draw)).toEqual(initial)
    }
  })
  it('lets an explicit paragraph break terminate a kept chain', () => {
    const draw = layout([
      ...prefix(1),
      p(1, { keepWithNext: true }),
      p(1, { pageBreakBefore: true })
    ])
    expect(draw.getPageRowList()).toHaveLength(2)
    const boundary = draw
      .getOriginalElementList()
      .findIndex(element => element.pageBreakBefore)
    expect(
      draw.getPageRowList()[0].every(row => row.startIndex < boundary)
    ).toBe(true)
    expect(draw.getPageRowList()[1][0].startIndex).toBe(boundary)
  })
  it('rejects enabled flow in continuous mode', () => {
    expect(() =>
      layout([p(1, { keepTogether: true })], {
        pageMode: PageMode.CONTINUITY
      })
    ).toThrow(/paged main story/)
  })
  it('rejects enabled header flow', () => {
    expect(() =>
      layout(prefix(1), { header: { disabled: false } }, [
        p(1, { widowControl: true })
      ])
    ).toThrow(/main story/)
  })
  it('retains keeps when a paragraph includes a leading tab', () => {
    const draw = layout([
      ...prefix(5),
      {
        value: '\n',
        keepTogether: true,
        lineHeight: { rule: 'exact', value: 20 }
      },
      {
        type: ElementType.TAB,
        value: '\t',
        lineHeight: { rule: 'exact', value: 20 }
      },
      { value: 'x'.repeat(279), lineHeight: { rule: 'exact', value: 20 } }
    ])
    expect(draw.getPageRowList()[0]).toHaveLength(5)
    expect(draw.getPageRowList()[1].length).toBeGreaterThanOrEqual(4)
  })
  it('does not change unrelated minimum-height area padding', () => {
    const source = (enabled: boolean): IElement[] => [
      {
        value: '\npre',
        keepTogether: enabled,
        lineHeight: { rule: 'exact', value: 20 }
      },
      ...prefix(2),
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'panel',
        area: { minHeight: 200 },
        valueList: [
          { value: '\narea', lineHeight: { rule: 'exact', value: 20 } }
        ]
      },
      ...prefix(1)
    ]
    const baseline = layout(source(false))
    const enabled = layout(source(true))
    const pageOfArea = (draw: Draw) =>
      draw
        .getPageRowList()
        .findIndex(rows =>
          rows.some(row => row.elementList.some(element => element.areaId))
        )
    expect(pageOfArea(enabled)).toBe(pageOfArea(baseline))
  })
  it('ignores a fully hidden keep before a following table', () => {
    expect(() =>
      layout([
        ...prefix(1),
        { ...p(1, { keepWithNext: true }), hide: true },
        {
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 80 }],
          trList: [
            {
              height: 0,
              tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }]
            }
          ]
        }
      ])
    ).not.toThrow()
  })
  it('keeps an internally wrapped list item together', () => {
    const draw = layout([
      ...prefix(5),
      {
        type: ElementType.LIST,
        value: '',
        listId: 'list',
        valueList: [p(4, { keepTogether: true })]
      }
    ])
    const pages = draw
      .getPageRowList()
      .map(
        rows =>
          rows.filter(row =>
            row.elementList.some(element => element.listId === 'list')
          ).length
      )
    expect(pages.filter(n => n > 0)).toHaveLength(1)
  })

  it.each([5, 7])(
    'uses paragraph widow control through hyperlink rows after %i lines',
    n => {
      const draw = layout([
        ...prefix(n),
        {
          value: '\n',
          widowControl: true,
          lineHeight: { rule: 'exact', value: 20 }
        },
        {
          type: ElementType.HYPERLINK,
          value: '',
          url: 'https://example.test',
          valueList: [
            { value: 'x'.repeat(319), lineHeight: { rule: 'exact', value: 20 } }
          ]
        }
      ])
      const linked = draw
        .getPageRowList()
        .map(
          rows =>
            rows.filter(row =>
              row.elementList.some(el => el.type === ElementType.HYPERLINK)
            ).length
        )
      expect(linked).toEqual(n === 5 ? [2, 2] : [0, 4])
      const saved = draw.getValue()
      const reopened = layout(saved.data.main, saved.options)
      expect(summary(reopened)).toEqual(summary(draw))
    }
  )

  it('keeps a heading with a following linked paragraph', () => {
    const draw = layout([
      ...prefix(5),
      {
        value: '\nHeading',
        keepWithNext: true,
        lineHeight: { rule: 'exact', value: 20 }
      },
      { value: '\n', lineHeight: { rule: 'exact', value: 20 } },
      {
        type: ElementType.HYPERLINK,
        value: '',
        url: 'https://example.test',
        valueList: [
          { value: 'x'.repeat(319), lineHeight: { rule: 'exact', value: 20 } }
        ]
      }
    ])
    expect(draw.getPageRowList()[0]).toHaveLength(5)
    expect(draw.getPageRowList()[1]).toHaveLength(5)
  })

  it.each(['hidden', 'trace', 'empty'] as const)(
    'ignores %s paragraph keeps before objects',
    variant => {
      const hidden =
        variant === 'trace'
          ? { trace: [{ type: TraceType.DELETED }] }
          : { hide: true }
      const draw = layout([
        ...prefix(1),
        {
          value: variant === 'empty' ? '\n' : '\nhidden',
          keepWithNext: true,
          pageBreakBefore: true,
          ...hidden,
          lineHeight: { rule: 'exact', value: 20 }
        },
        {
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 80 }],
          trList: [
            {
              height: 0,
              tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }]
            }
          ]
        }
      ])
      expect(draw.getPageRowList()).toHaveLength(1)
    }
  )

  it.each([EditorMode.TRACE, EditorMode.DESIGN])(
    'rejects a visible kept object target in %s mode',
    mode => {
      expect(() =>
        layout(
          [
            ...prefix(1),
            {
              value: '\nhidden',
              keepWithNext: true,
              hide: mode === EditorMode.DESIGN,
              trace: [{ type: TraceType.DELETED }],
              lineHeight: { rule: 'exact', value: 20 }
            },
            {
              type: ElementType.TABLE,
              value: '',
              colgroup: [{ width: 80 }],
              trList: [
                {
                  height: 0,
                  tdList: [
                    { colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }
                  ]
                }
              ]
            }
          ],
          { mode }
        )
      ).toThrow(/following object/)
    }
  )

  it('does not let a hidden false keep interrupt a visible kept chain', () => {
    const draw = layout([
      ...prefix(5),
      {
        value: '\nHeading',
        keepWithNext: true,
        lineHeight: { rule: 'exact', value: 20 }
      },
      {
        value: '\nhidden',
        hide: true,
        keepWithNext: false,
        lineHeight: { rule: 'exact', value: 20 }
      },
      p(4)
    ])
    expect(draw.getPageRowList()[0]).toHaveLength(5)
    expect(draw.getPageRowList()[1].filter(row => row.height > 0)).toHaveLength(
      5
    )
  })

  it('still rejects a visible keep when its object target follows hidden text', () => {
    expect(() =>
      layout([
        ...prefix(1),
        {
          value: '\nHeading',
          keepWithNext: true,
          lineHeight: { rule: 'exact', value: 20 }
        },
        {
          value: '\nhidden',
          hide: true,
          keepWithNext: false,
          lineHeight: { rule: 'exact', value: 20 }
        },
        {
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 80 }],
          trList: [
            {
              height: 0,
              tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }]
            }
          ]
        }
      ])
    ).toThrow(/following object/)
  })

  it.each([false, true])(
    'preserves unrelated area padding and following rows with columns=%s',
    columns => {
      const source = (enabled: boolean): IElement[] => [
        {
          value: '\npre',
          keepTogether: enabled,
          lineHeight: { rule: 'exact', value: 20 }
        },
        ...prefix(2),
        {
          type: ElementType.AREA,
          value: '',
          areaId: 'panel',
          area: { minHeight: 200 },
          valueList: [
            { value: '\narea', lineHeight: { rule: 'exact', value: 20 } }
          ]
        },
        ...prefix(3)
      ]
      const options: IEditorOption = columns
        ? { width: 240, column: { count: 2, gap: 40 } }
        : {}
      const baseline = layout(source(false), options)
      const enabled = layout(source(true), options)
      expect(summary(enabled)).toEqual(summary(baseline))
    }
  )

  it.each([0.5, 1, 2])(
    'preserves unrelated area layouts across the zoom %s matrix',
    scale => {
      for (const columns of [false, true]) {
        for (const minHeight of [20, 100, 200, 400]) {
          for (const following of ['end', 'text', 'table'] as const) {
            const source = (enabled: boolean): IElement[] => [
              {
                value: '\npre',
                keepTogether: enabled,
                lineHeight: { rule: 'exact', value: 20 }
              },
              ...prefix(2),
              {
                type: ElementType.AREA,
                value: '',
                areaId: 'matrix-area',
                area: { minHeight },
                valueList: [
                  { value: '\narea', lineHeight: { rule: 'exact', value: 20 } }
                ]
              },
              ...(following === 'text'
                ? prefix(6)
                : following === 'table'
                  ? [
                      {
                        type: ElementType.TABLE,
                        value: '',
                        colgroup: [{ width: 80 }],
                        trList: Array.from({ length: 6 }, () => ({
                          height: 30,
                          minHeight: 30,
                          tdList: [
                            {
                              colspan: 1,
                              rowspan: 1,
                              value: [{ value: 'cell' }]
                            }
                          ]
                        }))
                      }
                    ]
                  : [])
            ]
            const options: IEditorOption = {
              scale,
              ...(columns ? { width: 240, column: { count: 2, gap: 40 } } : {})
            }
            const baseline = layout(source(false), options)
            const enabled = layout(source(true), options)
            expect(
              summary(enabled),
              JSON.stringify({ scale, columns, minHeight, following })
            ).toEqual(summary(baseline))
          }
        }
      }
    }
  )

  it.each([false, true])(
    'keeps area content in its slot after an actual keep move, columns=%s',
    columns => {
      for (const following of ['text', 'table'] as const) {
        const draw = layout(
          [
            ...prefix(5),
            p(4, { keepTogether: true }),
            {
              type: ElementType.AREA,
              value: '',
              areaId: 'after-keep',
              area: { minHeight: following === 'table' ? 160 : 200 },
              valueList: [
                { value: '\narea', lineHeight: { rule: 'exact', value: 20 } }
              ]
            },
            ...(following === 'text'
              ? prefix(6)
              : [
                  {
                    type: ElementType.TABLE,
                    value: '',
                    colgroup: [{ width: 80 }],
                    trList: Array.from({ length: 8 }, () => ({
                      height: 30,
                      minHeight: 30,
                      tdList: [
                        { colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }
                      ]
                    }))
                  }
                ])
          ],
          columns ? { width: 240, column: { count: 2, gap: 40 } } : {}
        )
        const pageOfArea = draw
          .getPageRowList()
          .findIndex(rows =>
            rows.some(row =>
              row.elementList.some(element => element.areaId === 'after-keep')
            )
          )
        expect(pageOfArea).toBe(columns ? 0 : 1)
        const areaPage = draw.getPageRowList()[pageOfArea]
        const areaRow = areaPage.find(row =>
          row.elementList.some(element => element.areaId === 'after-keep')
        )
        expect(areaRow?.columnIndex).toBe(columns ? 1 : undefined)
        expect(draw.getPosition().getPositionList()).toHaveLength(
          draw.getOriginalElementList().length
        )
        for (const position of draw.getPosition().getPositionList()) {
          if (
            draw.getOriginalElementList()[position.index]?.type ===
            ElementType.TABLE
          )
            continue
          expect(position.coordinate.leftTop[1]).toBeGreaterThanOrEqual(20)
          expect(position.coordinate.leftBottom[1]).toBeLessThanOrEqual(180)
        }
        for (const fragment of draw
          .getPosition()
          .getTablePagingPositionList()) {
          expect(fragment.coordinate.leftTop[1]).toBeGreaterThanOrEqual(20)
          expect(fragment.coordinate.leftBottom[1]).toBeLessThanOrEqual(180)
        }
        if (following === 'table') {
          const fragments = draw.getPosition().getTablePagingPositionList()
          expect(fragments.length).toBeGreaterThan(1)
          expect(fragments[0].tableFragment?.startTrIndex).toBe(0)
          expect(fragments.at(-1)?.tableFragment?.endTrIndex).toBe(8)
        }
      }
    }
  )

  it.each([160, 200])(
    'reserves or rejects a kept group after area height %i',
    minHeight => {
      const render = () =>
        layout([
          ...prefix(5),
          p(4, { keepTogether: true }),
          {
            type: ElementType.AREA,
            value: '',
            areaId: 'carried',
            area: { minHeight },
            valueList: [
              { value: '\narea', lineHeight: { rule: 'exact', value: 20 } }
            ]
          },
          p(4, { keepTogether: true })
        ])
      if (minHeight === 200) {
        expect(render).toThrow(/carried area padding/)
      } else {
        const draw = render()
        const counts = draw
          .getPageRowList()
          .map(
            rows =>
              rows.filter(row =>
                row.elementList.some(element => element.keepTogether)
              ).length
          )
        expect(counts).toEqual([0, 4, 4])
      }
    }
  )
  it('rejects carried padding that leaves no room for a table fragment', () => {
    expect(() =>
      layout([
        ...prefix(5),
        p(4, { keepTogether: true }),
        {
          type: ElementType.AREA,
          value: '',
          areaId: 'carried-table',
          area: { minHeight: 220 },
          valueList: [
            { value: '\narea', lineHeight: { rule: 'exact', value: 20 } }
          ]
        },
        {
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 80 }],
          trList: Array.from({ length: 8 }, () => ({
            height: 30,
            minHeight: 30,
            tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }]
          }))
        }
      ])
    ).toThrow(/Table flow.*carried area padding/)
  })
})
