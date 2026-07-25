import { describe, it, expect } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IElement } from '@/editor/interface/Element'
import { ITr } from '@/editor/interface/table/Tr'

// 页面：794 宽，页边距 [100,120,100,120] => 正文可用宽度 554
const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}
const INNER_WIDTH = 554

function buildTable(colWidthList: number[]): IElement {
  const tr: ITr = {
    height: 100,
    tdList: colWidthList.map(() => ({
      colspan: 1,
      rowspan: 1,
      value: [{ value: '\n' }]
    }))
  }
  return {
    type: ElementType.TABLE,
    value: '',
    colgroup: colWidthList.map(width => ({ width })),
    trList: [tr]
  } as IElement
}

function renderMain(
  main: IElement[],
  optionOverrides: Record<string, unknown> = {}
): Draw {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({ ...PAGE_OPTION, ...optionOverrides })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render()
  return draw
}

describe('表格宽度布局', () => {
  const getTable = (draw: Draw) =>
    draw.getOriginalElementList().find(el => el.type === ElementType.TABLE)!

  const setTableContext = (draw: Draw) => {
    const elementList = draw.getOriginalElementList()
    const index = elementList.findIndex(el => el.type === ElementType.TABLE)
    draw.getPosition().setPositionContext({
      isTable: true,
      index,
      trIndex: 0,
      tdIndex: 0
    })
    draw.getRange().setRange(0, 0)
  }

  it('overflow 为 true 时表格可超出正文区域', () => {
    const draw = renderMain([buildTable([400, 400])], {
      table: { overflow: true }
    })
    const table = getTable(draw)
    expect(table.width).toBe(800)
  })

  it('overflow 为 false 时表格总宽被等比例压缩至正文区域内', () => {
    const draw = renderMain([buildTable([400, 400])], {
      table: { overflow: false }
    })
    const table = getTable(draw)
    expect(table.width!).toBeLessThanOrEqual(INNER_WIDTH)
    expect(table.colgroup!.map(col => col.width)).toEqual([277, 277])
  })

  it('overflow 为 false 时低于最小列宽的列保持，可压缩列继续分摊', () => {
    const draw = renderMain([buildTable([1000, 30])], {
      table: { overflow: false }
    })
    const table = getTable(draw)
    expect(table.colgroup![1].width).toBe(30)
    expect(table.colgroup![0].width).toBe(524)
    expect(table.width!).toBeLessThanOrEqual(INNER_WIDTH)
  })

  it('overflow 为 false 时清除表格横向偏移', () => {
    const table = buildTable([400, 400])
    table.translateX = 50
    const draw = renderMain([table], { table: { overflow: false } })
    expect(getTable(draw).translateX).toBe(0)
  })

  it('tableAutoFitToPage 表格总宽等比缩小至正文宽度', () => {
    const draw = renderMain([buildTable([400, 400])])
    setTableContext(draw)
    draw.getTableOperate().tableAutoFitToPage()
    const table = getTable(draw)
    expect(table.colgroup!.map(col => col.width)).toEqual([277, 277])
    expect(table.width).toBe(INNER_WIDTH)
  })

  it('tableAutoFitToPage 表格总宽等比放大至正文宽度并清除横向偏移', () => {
    const table = buildTable([100, 100])
    table.translateX = 20
    const draw = renderMain([table])
    setTableContext(draw)
    draw.getTableOperate().tableAutoFitToPage()
    const curTable = getTable(draw)
    expect(curTable.width).toBe(INNER_WIDTH)
    expect(curTable.translateX).toBe(0)
  })

  it('tableAutoFitToContent 按内容宽度调整列宽且不低于最小列宽', () => {
    const draw = renderMain([buildTable([400, 400])])
    setTableContext(draw)
    draw.getTableOperate().tableAutoFitToContent()
    const table = getTable(draw)
    // 空单元格内容宽度为 0：列宽回退至最小列宽
    expect(table.colgroup!.map(col => col.width)).toEqual([40, 40])
  })

  it('tableAutoFitToContent 在 overflow 为 false 时结果压缩至正文区域内', () => {
    const draw = renderMain([buildTable([400, 400])], {
      table: { overflow: false }
    })
    setTableContext(draw)
    draw.getTableOperate().tableAutoFitToContent()
    const table = getTable(draw)
    expect(table.width!).toBeLessThanOrEqual(INNER_WIDTH)
  })
})
