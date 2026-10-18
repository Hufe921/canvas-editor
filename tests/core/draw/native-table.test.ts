import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import { VerticalAlign } from '@/editor/dataset/enum/VerticalAlign'
import type { IEditorOption } from '@/editor/interface/Editor'
import type { IElement } from '@/editor/interface/Element'
import type { LayoutNode, TableFragment } from '@/editor/interface/Layout'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const font = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
const draws: Draw[] = []
afterEach(() => {
  draws.splice(0).forEach(draw => draw.destroy())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
function table(
  values: IElement[][] = [[{ value: 'مرحبا Hello' }]],
  widths = [160]
): IElement {
  return {
    type: ElementType.TABLE,
    value: '',
    colgroup: widths.map(width => ({ width })),
    trList: [
      {
        height: 42,
        tdList: values.map(value => ({ value, colspan: 1, rowspan: 1 }))
      }
    ]
  }
}
async function setup(main: IElement[], extra: Partial<IEditorOption> = {}) {
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data: font }],
    width: 420,
    height: 1200,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    table: { overflow: false, tdPadding: [3, 5, 7, 11] },
    ...extra
  })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const container = document.createElement('div')
  document.body.append(container)
  const draw = new Draw(
    container,
    options,
    { main, header: [{ value: ZERO }], footer: [{ value: ZERO }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  await draw.ready
  draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
  return draw
}
function context(
  draw: Draw,
  element: IElement,
  path?: { index: number; trIndex: number; tdIndex: number }[]
) {
  const index = draw.getOriginalMainElementList().indexOf(element)
  draw.getPosition().setPositionContext({
    isTable: true,
    index,
    trIndex: 0,
    tdIndex: 0,
    tablePath: path
  })
  draw.getRange().setRange(0, 0)
}
function native(draw: Draw) {
  const nodes: LayoutNode[] = []
  draw.computeRowList({
    elementList: draw.getOriginalMainElementList(),
    innerWidth: 380 * draw.getOptions().scale,
    nativeNodes: nodes
  })
  return nodes.filter(node => node.kind === 'tableFragment') as TableFragment[]
}

describe('T12 HarfBuzz table integration', () => {
  it('lays out nested tables in their parent cell and emits native scope children without legacy calls', async () => {
    const nested = table(
      [[{ value: 'مرحبا بالعالم Hello' }], [{ value: ZERO }]],
      [300, 300]
    )
    const outer = table([[nested]], [180])
    const draw = await setup([outer], { scale: 2 })
    expect(nested.width).toBeCloseTo(164)
    expect(draw.getTableContainerWidth(nested)).toBeCloseTo(164)
    expect(
      nested.trList![0].tdList.every(td =>
        td.rowList!.every(row => row.nativeLine)
      )
    ).toBe(true)
    const fragment = native(draw)[0]
    const child = fragment.cells[0].children.find(
      node => node.kind === 'tableFragment'
    ) as TableFragment
    expect(child).toBeTruthy()
    expect(child.rect.width).toBeCloseTo(164)
    expect(child.cells[0].children[0].kind).toBe('textLine')
    expect(child.cells[0].scope).not.toBe(fragment.cells[0].scope)
  })

  it('counts paragraph spacing in cell height, vertical alignment and split windows once', async () => {
    const element = table([
      [
        { value: 'first', spacingAfter: 9 },
        { value: '\n', spacingBefore: 17 },
        { value: 'second', spacingBefore: 17 }
      ]
    ])
    element.trList![0].minHeight = 220
    element.trList![0].tdList[0].verticalAlign = VerticalAlign.BOTTOM
    const draw = await setup([element])
    const td = element.trList![0].tdList[0]
    const rows = td.rowList!
    const flow = rows.reduce(
      (sum, row) => sum + row.height + (row.offsetY || 0),
      0
    )
    expect(rows.some(row => row.offsetY === 17)).toBe(true)
    expect(td.mainHeight).toBeCloseTo(flow + 10)
    const fragment = native(draw)[0]
    expect(fragment.cells[0].contentRect.y - fragment.rect.y).toBeCloseTo(
      220 - 7 - flow
    )
    const prefixWithoutOffset = rows.reduce((sum, row) => sum + row.height, 0)
    expect(
      draw
        .getTableParticle()
        .getTdLineRangeBySplitWindow(td, 0, 3 + prefixWithoutOffset)[1]
    ).toBeLessThan(rows.length)
    const last = td.positionList!.at(-1)!
    const tablePosition = draw.getPosition().getOriginalMainPositionList()[
      draw.getOriginalMainElementList().indexOf(element)
    ]
    expect(last.coordinate.leftTop[1] + rows.at(-1)!.height).toBeCloseTo(
      tablePosition.coordinate.leftTop[1] + td.y! + td.height! - 7
    )
  })

  it('solves overlapping merged-cell height constraints and covered empty rows consistently', async () => {
    const element: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 100 }, { width: 100 }],
      trList: [
        {
          height: 42,
          tdList: [
            {
              rowspan: 3,
              colspan: 1,
              value: [{ value: 'مرحبا\n'.repeat(10) }]
            },
            { rowspan: 1, colspan: 1, value: [{ value: 'short' }] }
          ]
        },
        {
          height: 42,
          tdList: [
            { rowspan: 2, colspan: 1, value: [{ value: 'Hello\n'.repeat(8) }] }
          ]
        },
        { height: 42, tdList: [] }
      ]
    }
    const draw = await setup([element])
    for (const row of element.trList!)
      for (const td of row.tdList)
        expect(td.height!).toBeGreaterThanOrEqual(td.mainHeight!)
    expect(element.trList![1].tdList[0].y).toBeCloseTo(
      element.trList![0].height
    )
    const heights = element.trList!.map(row => row.height)
    native(draw)
    expect(element.trList!.map(row => row.height)).toEqual(heights)
    expect(element.height).toBeCloseTo(heights.reduce((a, b) => a + b, 0))
  })

  it('uses shaped intrinsic widths for autofit, including tracking, tabs, images and colspan', async () => {
    const element = table(
      [
        [{ value: 'مرحبا بالعالم', letterSpacing: 2 }],
        [
          { value: '', type: ElementType.TAB },
          { value: '', type: ElementType.IMAGE, width: 75, height: 30 }
        ]
      ],
      [160, 160]
    )
    const draw = await setup([element])
    context(draw, element)
    const host = draw.getLayoutHostAdapter()
    const intrinsic = element.trList![0].tdList.map(
      td =>
        Math.max(
          ...host
            .scanParagraphs(td.value)
            .map(p => host.measureParagraph(p).width)
        ) + 16
    )
    draw.getTableOperate().tableAutoFitToContent()
    element.colgroup!.forEach((col, i) =>
      expect(col.width).toBeCloseTo(Math.max(40, intrinsic[i]))
    )
    expect(element.colgroup![1].width).toBeCloseTo(32 + 75 + 16)
  })

  it('targets the nested table for autofit-to-page and respects the parent width', async () => {
    const nested = table([[{ value: 'a' }]], [80])
    const outer = table([[nested]], [200])
    const draw = await setup([outer])
    const parent = outer.trList![0].tdList[0]
    const outerIndex = draw.getOriginalMainElementList().indexOf(outer)
    const nestedIndex = parent.value.indexOf(nested)
    context(draw, outer, [
      { index: outerIndex, trIndex: 0, tdIndex: 0 },
      { index: nestedIndex, trIndex: 0, tdIndex: 0 }
    ])
    draw.getTableOperate().tableAutoFitToPage()
    expect(nested.width).toBeCloseTo(184)
    expect(outer.width).toBeCloseTo(200)
  })

  it('uses the actual column container for both outer and nested tables', async () => {
    const nested = table([[{ value: 'inside' }]], [500])
    const outer = table([[nested]], [500])
    const draw = await setup([outer], { column: { count: 2, gap: 16 } })
    expect(outer.width).toBeCloseTo(182)
    expect(nested.width).toBeCloseTo(166)
    expect(draw.getTableContainerWidth(outer)).toBeCloseTo(182)
    context(draw, outer)
    draw.getTableOperate().tableAutoFitToPage()
    expect(outer.width).toBeCloseTo(182)
  })

  it('applies intrinsic constraints from merged cells during autofit', async () => {
    const element = table([[{ value: 'a' }], [{ value: 'b' }]], [120, 120])
    element.trList!.push({
      height: 42,
      tdList: [
        {
          rowspan: 1,
          colspan: 2,
          value: [{ value: 'مرحبا '.repeat(8), letterSpacing: 1 }]
        }
      ]
    })
    const draw = await setup([element])
    const merged = element.trList![1].tdList[0]
    const expected =
      Math.max(
        ...draw
          .getLayoutHostAdapter()
          .scanParagraphs(merged.value)
          .map(p => draw.getLayoutHostAdapter().measureParagraph(p).width)
      ) + 16
    context(draw, element)
    draw.getTableOperate().tableAutoFitToContent()
    expect(element.width).toBeGreaterThanOrEqual(expected - 0.00001)
    expect(element.colgroup!.every(col => col.width >= 40)).toBe(true)
  })

  it('collapses hidden nested tables and excludes them from intrinsic widths', async () => {
    const nested = table([[{ value: 'مرحبا '.repeat(50) }]], [300])
    nested.hide = true
    const outer = table([[nested]], [200])
    const draw = await setup([outer])
    expect(nested.height).toBe(0)
    context(draw, outer)
    draw.getTableOperate().tableAutoFitToContent()
    expect(outer.width).toBe(40)
  })

  it('preserves RTL logical columns and cell/table border settings', async () => {
    const element = table(
      [[{ value: 'يمين' }], [{ value: 'يسار' }]],
      [100, 140]
    )
    element.direction = TextDirection.RTL
    element.borderColor = '#123456'
    element.borderWidth = 2
    element.trList![0].tdList[0].borderColor = '#ff0000'
    element.trList![0].tdList[0].borderWidth = 3
    const draw = await setup([element])
    const cells = element.trList![0].tdList
    expect(cells.map(td => td.colIndex)).toEqual([0, 1])
    expect(cells.map(td => td.x)).toEqual([140, 0])
    expect(native(draw)[0]).toMatchObject({
      borderColor: '#123456',
      borderWidth: 2,
      cells: [{ borderColor: '#ff0000', borderWidth: 3 }, {}]
    })
  })
})
