import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ImageDisplay } from '@/editor/dataset/enum/Common'
import { EditorZone, PaperDirection } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ListStyle, ListType } from '@/editor/dataset/enum/List'
import type { IEditorOption } from '@/editor/interface/Editor'
import type { IElement } from '@/editor/interface/Element'
import type { LayoutNode } from '@/editor/interface/Layout'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
const data = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
const draws: Draw[] = []
afterEach(() => {
  draws.splice(0).forEach(draw => draw.destroy())
  document.body.replaceChildren()
})
async function setup(
  main: IElement[],
  extra: Partial<IEditorOption> = {},
  header: IElement[] = [{ value: ZERO }]
) {
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    width: 300,
    height: 500,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    ...extra
  })
  const content = { main, header, footer: [{ value: ZERO }] }
  Object.values(content).forEach(elements =>
    formatElementList(elements, {
      editorOptions: options,
      isForceCompensation: true
    })
  )
  const container = document.createElement('div')
  document.body.append(container)
  const draw = new Draw(
    container,
    options,
    content,
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  await draw.ready
  draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
  return draw
}
function verify(draw: Draw) {
  expect(draw.getLayoutRowList().map(row => row.rowIndex)).toEqual(
    draw.getLayoutRowList().map((_, index) => index)
  )
  const scale = draw.getOptions().scale
  for (const [pageNo, rows] of draw.getLayoutPages().entries())
    for (const row of rows) {
      expect(row.flow?.pageNo).toBe(pageNo)
      const direction = draw.getPageDirection(pageNo)
      const columns = draw.getColumnLayout(direction)
      const width = columns?.width || draw.getInnerWidth(direction)
      if (row.nativeLine?.glyphs.length) {
        expect(
          (row.nativeLine.rect.x + row.nativeLine.rect.width) * scale +
            (row.offsetX || 0)
        ).toBeLessThanOrEqual(width + 0.01)
      }
      const top =
        draw.getMargins(direction)[0] +
        draw.getHeader().getExtraHeight(pageNo, direction)
      const bottom =
        draw.getHeight(direction) -
        draw.getMargins(direction)[2] -
        draw.getFooter().getExtraHeight(pageNo, direction)
      expect(row.flow!.y * scale).toBeGreaterThanOrEqual(top - 0.01)
      expect(
        row.flow!.y * scale + row.height + (row.offsetY || 0)
      ).toBeLessThanOrEqual(bottom + 0.01)
    }
  expect(
    draw.getPosition().getOriginalMainPositionList().filter(Boolean).length
  ).toBe(draw.getOriginalMainElementList().length)
}
function table(): IElement {
  return {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 260 }],
    trList: Array.from({ length: 16 }, (_, index) => ({
      height: 48,
      pagingRepeat: index === 0,
      tdList: [
        {
          colspan: 1,
          rowspan: 1,
          value: [{ value: index === 0 ? 'HEADER' : 'row '.repeat(25) }]
        }
      ]
    }))
  }
}
function float(x: number, y: number, width: number, height: number): IElement {
  return {
    type: ElementType.IMAGE,
    value:
      'data:image/svg+xml,' +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    width,
    height,
    imgDisplay: ImageDisplay.SURROUND,
    imgFloatPosition: { x, y, pageNo: 0 }
  }
}

describe('T15 native document flow', () => {
  it('breaks at actual column widths after section direction changes and skips remaining columns on explicit breaks', async () => {
    const draw = await setup(
      [
        { value: 'first' },
        {
          value: '',
          type: ElementType.PAGE_BREAK,
          paperDirection: PaperDirection.HORIZONTAL
        },
        { value: 'words مرحبا '.repeat(180) }
      ],
      { column: { count: 2, gap: 20 }, scale: 1.5 }
    )
    expect(draw.getPageDirection(1)).toBe(PaperDirection.HORIZONTAL)
    expect(
      draw.getLayoutPages()[0].every(row => row.flow?.columnIndex === 0)
    ).toBe(true)
    expect(
      draw
        .getLayoutPages()
        .slice(1)
        .some(rows => rows.some(row => row.columnIndex === 1))
    ).toBe(true)
    verify(draw)
    const obstacle = float(20, 20, 460, 320)
    obstacle.imgFloatPosition!.pageNo = 1
    const blocked = await setup([
      obstacle,
      { value: 'first' },
      {
        value: '',
        type: ElementType.PAGE_BREAK,
        paperDirection: PaperDirection.HORIZONTAL
      },
      { value: 'tail '.repeat(50) }
    ])
    expect(blocked.getLayoutPages()[1]).toHaveLength(0)
    expect(blocked.getPageDirection(1)).toBe(PaperDirection.HORIZONTAL)
  })
  it('rebreaks around multiple overlapping exclusions and restores width below the objects', async () => {
    const draw = await setup([
      float(20, 20, 100, 100),
      float(105, 20, 70, 140),
      { value: 'word '.repeat(180) }
    ])
    const rows = draw.getLayoutRowList().filter(row => !!row.nativeLine)
    expect(rows[0].flow!.x).toBeCloseTo(155)
    expect(rows[0].width).toBeLessThanOrEqual(105)
    expect(
      rows.some(
        row => row.flow!.pageNo === 0 && row.flow!.y >= 160 && row.width > 180
      )
    ).toBe(true)
    const positions = draw.getPosition().getOriginalMainPositionList()
    for (const row of rows.filter(
      row => row.flow!.pageNo === 0 && row.flow!.y < 120
    )) {
      const sourceIndex = row.sourceIndices?.find(
        index => positions[index]?.metrics.width > 0
      )
      if (sourceIndex === undefined) continue
      expect(
        positions[sourceIndex].coordinate.leftTop[0]
      ).toBeGreaterThanOrEqual(175)
    }
    verify(draw)
  })
  it('moves text below a fully blocked interval without losing source characters', async () => {
    const draw = await setup([
      float(20, 20, 260, 120),
      { value: 'blocked words '.repeat(40) }
    ])
    const line = draw.getLayoutRowList().find(row => !!row.nativeLine)!
    expect(line.flow!.y).toBeGreaterThanOrEqual(140)
    expect(
      draw.getPosition().getOriginalMainPositionList()[line.sourceIndices![0]]
        .coordinate.leftTop[1]
    ).toBeGreaterThanOrEqual(140)
    verify(draw)
  })
  it('shares the table fragment cursor with text, repeated headers and subsequent columns', async () => {
    const draw = await setup([table(), { value: 'after table '.repeat(80) }], {
      column: { count: 2, gap: 20 }
    })
    const fragments = draw.getLayoutRowList().filter(row => row.tableFragment)
    expect(fragments.length).toBeGreaterThan(2)
    expect(
      fragments
        .slice(1)
        .every(row => row.tableFragment!.repeatTrIndexes?.includes(0))
    ).toBe(true)
    const page = fragments[0].flow!.pageNo
    const exported = draw.getOriginValue({ pageNo: page }).main
    expect(
      exported.filter(element => element.type === ElementType.TABLE)
    ).toHaveLength(1)
    const last = fragments.at(-1)!.flow!
    const after = draw
      .getLayoutRowList()
      .find(
        row => row.nativeLine && row.startIndex > fragments[0].startIndex
      )!.flow!
    expect(after.pageNo * 2 + after.columnIndex).toBeGreaterThanOrEqual(
      last.pageNo * 2 + last.columnIndex
    )
    verify(draw)
  })
  it('clips maxPageNo at a fragment boundary and remains stable on rerender', async () => {
    const draw = await setup([table(), { value: 'removed tail' }], {
      pageNumber: { maxPageNo: 0 }
    })
    expect(draw.getLayoutPages()).toHaveLength(1)
    const first = JSON.stringify(
      draw
        .getOriginalMainElementList()
        .map(e =>
          e.trList?.map(r =>
            r.tdList.map(td => td.value.map(v => v.value).join(''))
          )
        )
    )
    draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
    expect(draw.getLayoutPages()).toHaveLength(1)
    expect(
      JSON.stringify(
        draw
          .getOriginalMainElementList()
          .map(e =>
            e.trList?.map(r =>
              r.tdList.map(td => td.value.map(v => v.value).join(''))
            )
          )
      )
    ).toBe(first)
    expect(
      draw.getOriginalMainElementList().some(e => e.value.includes('removed'))
    ).toBe(false)
  })
  it('isolates header orientation caches and native cell scopes from body flow', async () => {
    const draw = await setup(
      [
        { value: 'body' },
        {
          value: '',
          type: ElementType.PAGE_BREAK,
          paperDirection: PaperDirection.HORIZONTAL
        },
        { value: 'tail' }
      ],
      { header: { disabled: false } },
      [{ value: 'header '.repeat(15) }]
    )
    const adapter = draw.getLayoutHostAdapter()
    draw.getHeader().getPositionList(PaperDirection.VERTICAL)
    draw.getHeader().getPositionList(PaperDirection.HORIZONTAL)
    const vertical = adapter.findLayoutByElementIndex(1, 'header:vertical')
    const horizontal = adapter.findLayoutByElementIndex(1, 'header:horizontal')
    expect(vertical).toBeTruthy()
    expect(horizontal).toBeTruthy()
    expect(vertical!.layout.lines.length).toBeGreaterThan(
      horizontal!.layout.lines.length
    )
    const nodes: LayoutNode[] = []
    draw.computeRowList({
      elementList: draw.getOriginalMainElementList(),
      innerWidth: 260,
      isPagingMode: true,
      nativeNodes: nodes
    })
    expect(nodes.some(node => node.placement?.pageNo === 1)).toBe(true)
  })
  it('retains independent header table geometry when activating different paper variants', async () => {
    const frameTable = table()
    frameTable.trList = frameTable.trList!.slice(0, 1)
    frameTable.trList[0].tdList[0].value = [{ value: 'frame text '.repeat(30) }]
    const draw = await setup(
      [
        { value: 'body' },
        {
          value: '',
          type: ElementType.PAGE_BREAK,
          paperDirection: PaperDirection.HORIZONTAL
        },
        { value: 'tail' }
      ],
      { header: { disabled: false } },
      [frameTable]
    )
    const header = draw.getHeader()
    header.getPositionList(PaperDirection.VERTICAL)
    const model = header
      .getElementList()
      .find(element => element.type === ElementType.TABLE)!
    const cell = model.trList![0].tdList[0]
    const vertical = JSON.stringify(cell.positionList)
    header.getPositionList(PaperDirection.HORIZONTAL)
    header.getPositionList(PaperDirection.VERTICAL)
    expect(JSON.stringify(cell.positionList)).toBe(vertical)
    draw.getZone().setZone(EditorZone.HEADER)
    draw.getPosition().setPositionContext({
      isTable: true,
      index: header.getElementList().indexOf(model),
      trIndex: 0,
      tdIndex: 0,
      tdId: cell.id
    })
    expect(draw.getPosition().getPositionList().length).toBe(cell.value.length)
  })

  it('starts table windows after float exclusions and applies Area.top once', async () => {
    const block = table()
    block.areaId = 'area'
    block.area = { top: 24 }
    const draw = await setup([float(20, 20, 100, 100), block])
    const rows = draw.getLayoutRowList().filter(row => row.tableFragment)
    expect(rows[0].flow!.y).toBeGreaterThanOrEqual(120)
    expect(rows[0].offsetY).toBe(24)
    expect(rows.slice(1).every(row => !row.offsetY)).toBe(true)
    verify(draw)
  })
  it('bounds nested list indents by the actual column width', async () => {
    const meta = {
      listId: 'nested',
      listType: ListType.OL,
      listStyle: ListStyle.DECIMAL,
      listLevel: 7
    }
    const draw = await setup(
      [
        { value: ZERO, ...meta },
        { value: 'words '.repeat(70), ...meta }
      ],
      { column: { count: 2, gap: 20 } }
    )
    verify(draw)
  })
  it('keeps header float/table flow local and independent of body columns', async () => {
    const frame = table()
    frame.trList = frame.trList!.slice(0, 1)
    const draw = await setup(
      [{ value: 'body '.repeat(40) }],
      { column: { count: 2, gap: 20 }, header: { disabled: false } },
      [float(20, 5, 80, 60), frame]
    )
    const rows = draw.getHeader().getLayoutRowList()
    expect(rows.every(row => row.columnIndex === undefined)).toBe(true)
    expect(
      rows.filter(row => row.elementList[0]?.type === ElementType.TABLE)
    ).toHaveLength(1)
    expect(rows.every(row => !row.flow || row.flow.pageNo === 0)).toBe(true)
  })
})
