import { describe, it, expect, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ZERO } from '@/editor/dataset/constant/Common'
import { IElement } from '@/editor/interface/Element'
import { ITr } from '@/editor/interface/table/Tr'

// 页面：1123 高，页边距 [100,120,100,120]，禁用页眉页脚 => 正文可用高度 923
// 表格行高 100 => 每页可放 9 行（预留行距 16）
const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}

function buildTrList(
  rowCount: number,
  rowHeight = 100,
  colCount = 2,
  customizeTr?: (tr: ITr, rowIndex: number) => void
): ITr[] {
  const trList: ITr[] = []
  for (let r = 0; r < rowCount; r++) {
    const tr: ITr = {
      height: rowHeight,
      minHeight: rowHeight,
      tdList: Array.from({ length: colCount }, () => ({
        colspan: 1,
        rowspan: 1,
        value: [{ value: '\n' }]
      }))
    }
    customizeTr?.(tr, r)
    trList.push(tr)
  }
  return trList
}

function buildTable(rowCount: number, rowHeight = 100): IElement {
  return {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 200 }, { width: 200 }],
    trList: buildTrList(rowCount, rowHeight)
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

describe('表格跨页渲染层拆分', () => {
  it('跨页表格在数据层保持单一表格', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableList = elementList.filter(
      element => element.type === ElementType.TABLE
    )
    expect(tableList.length).toBe(1)
    // 不产生分页拆分标记
    expect(elementList.some(element => 'pagingId' in element)).toBe(false)
    // 行数完整
    expect(tableList[0].trList!.length).toBe(20)
    // 保存数据仍为单一完整表格
    const value = draw.getValue()
    const savedTableList = value.data.main!.filter(
      element => element.type === ElementType.TABLE
    )
    expect(savedTableList.length).toBe(1)
    expect(savedTableList[0].trList!.length).toBe(20)
  })

  it('跨页表格行记录拆分为按页片段', () => {
    const draw = renderMain([buildTable(20)])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    // 首页含补偿换行可放 8 行，续页可放 9 行 => [0,8) [8,17) [17,20)
    expect(fragmentRows.length).toBe(3)
    expect(
      fragmentRows.map(row => [
        row.tableFragment!.startTrIndex,
        row.tableFragment!.endTrIndex
      ])
    ).toEqual([
      [0, 8],
      [8, 17],
      [17, 20]
    ])
    // skipHeight 累计片段之前所有行高
    expect(fragmentRows.map(row => row.tableFragment!.skipHeight)).toEqual([
      0, 800, 1700
    ])
    // 片段行各按其页分布
    const pageRowList = draw.getPageRowList()
    expect(
      pageRowList[0].some(row => row.tableFragment?.startTrIndex === 0)
    ).toBe(true)
    expect(
      pageRowList[1].some(row => row.tableFragment?.startTrIndex === 8)
    ).toBe(true)
    expect(
      pageRowList[2].some(row => row.tableFragment?.startTrIndex === 17)
    ).toBe(true)
    // 主位置列表与元素列表保持一一对应（仅首片段入主列表）
    const positionList = draw.getPosition().getOriginalMainPositionList()
    const elementList = draw.getOriginalElementList()
    expect(positionList.length).toBe(elementList.length)
    // 侧边列表包含全部片段
    expect(draw.getPosition().getTablePagingPositionList().length).toBe(3)
  })

  it('不足一页的表格不拆分', () => {
    const draw = renderMain([buildTable(5)])
    expect(draw.getRowList().some(row => row.tableFragment)).toBe(false)
  })

  it('分页重复表头在续页片段回显', () => {
    const table = buildTable(20)
    table.trList![0].pagingRepeat = true
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    // 首页无回显
    expect(fragmentRows[0].tableFragment!.repeatTrIndexes).toBeUndefined()
    expect(fragmentRows[0].tableFragment!.repeatHeight).toBe(0)
    // 续页回显表头
    for (let f = 1; f < fragmentRows.length; f++) {
      expect(fragmentRows[f].tableFragment!.repeatTrIndexes).toEqual([0])
      expect(fragmentRows[f].tableFragment!.repeatHeight).toBe(100)
    }
    // 数据层表头行不产生克隆
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    expect(tableElement.trList!.length).toBe(20)
  })

  it('跨行合并单元格覆盖切分点时按窗口续排', () => {
    const table = buildTable(10)
    // 第 8 行（索引 7）首列向下合并 3 行，覆盖自然切分点
    table.trList![7].tdList[0].rowspan = 3
    table.trList![8].tdList.shift()
    table.trList![9].tdList.shift()
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    // 按自然切分点拆分（不再整段推至下一页）
    expect(
      fragmentRows.map(row => [
        row.tableFragment!.startTrIndex,
        row.tableFragment!.endTrIndex
      ])
    ).toEqual([
      [0, 8],
      [8, 10]
    ])
    // 合并单元格内容完整且位置不丢
    const spanTd = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!.trList![7].tdList[0]
    expect(spanTd.positionList!.length).toBe(spanTd.value.length)
    // 位置列表与元素列表一一对应
    const positionList = draw.getPosition().getOriginalMainPositionList()
    const elementList = draw.getOriginalElementList()
    expect(positionList.length).toBe(elementList.length)
  })

  it('跨行合并单元格横跨整页时按窗口续排', () => {
    const table = buildTable(10)
    // 首行首列向下合并 10 行，合并范围横跨整表
    table.trList![0].tdList[0].rowspan = 10
    for (let r = 1; r < 10; r++) {
      table.trList![r].tdList.shift()
    }
    const draw = renderMain([table])
    // 整表仍按页拆分（合并单元格进位渲染，不再整表跳页）
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    // 数据层仍为单一表格且行数完整
    const elementList = draw.getOriginalElementList()
    const tableList = elementList.filter(
      element => element.type === ElementType.TABLE
    )
    expect(tableList.length).toBe(1)
    expect(tableList[0].trList!.length).toBe(10)
    // 位置列表与元素列表一一对应
    const positionList = draw.getPosition().getOriginalMainPositionList()
    expect(positionList.length).toBe(elementList.length)
  })

  it('修改列宽后重渲染仍为单一表格（列宽天然同步）', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const table = elementList.find(
      element => element.type === ElementType.TABLE
    )!
    table.colgroup![0].width = 300
    draw.render()
    expect(
      elementList.filter(element => element.type === ElementType.TABLE).length
    ).toBe(1)
    expect(table.trList!.length).toBe(20)
    // 片段重新计算且边界连续完整
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    let expectStart = 0
    for (const row of fragmentRows) {
      expect(row.tableFragment!.startTrIndex).toBe(expectStart)
      expectStart = row.tableFragment!.endTrIndex
    }
    expect(expectStart).toBe(20)
  })

  it('删除跨页表格的行后仍为单一表格', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    // 光标定位于最后一行
    draw.getPosition().setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 19,
      tdIndex: 0
    })
    draw.getTableOperate().deleteTableRow()
    const table = elementList[tableIndex]
    expect(table.type).toBe(ElementType.TABLE)
    expect(table.trList!.length).toBe(19)
    // 行记录片段边界连续完整
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    let expectStart = 0
    for (const row of fragmentRows) {
      expect(row.tableFragment!.startTrIndex).toBe(expectStart)
      expectStart = row.tableFragment!.endTrIndex
    }
    expect(expectStart).toBe(19)
  })

  it('删除跨页表格直接移除单一元素', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const preLength = elementList.length
    draw.getPosition().setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 10,
      tdIndex: 0
    })
    draw.getTableOperate().deleteTable()
    expect(elementList.length).toBe(preLength - 1)
    expect(
      elementList.some(element => element.type === ElementType.TABLE)
    ).toBe(false)
  })

  it('续页片段内可命中单元格', () => {
    const draw = renderMain([buildTable(20)])
    const table = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    // 第二页片段首行（索引 8）单元格
    const td = table.trList![8].tdList[0]
    const tdPosition = td.positionList![0]
    expect(tdPosition.pageNo).toBe(1)
    const [x, y] = tdPosition.coordinate.leftTop
    const hit = draw.getPosition().getPositionByXY({
      x: x + 1,
      y: y + 1,
      pageNo: 1
    })
    expect(hit.isTable).toBe(true)
    expect(hit.trIndex).toBe(8)
    expect(hit.tdIndex).toBe(0)
  })

  it('超高单元格按内容行行内拆分', () => {
    // 5 行普通行 + 1 行含约 40 行文本的超高行
    const table = buildTable(6)
    const tallText = Array.from({ length: 40 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![5].tdList[1].value = [{ value: tallText }]
    const draw = renderMain([table])
    const elementList = draw.getOriginalElementList()
    // 数据层仍为单一表格且行数完整
    expect(
      elementList.filter(element => element.type === ElementType.TABLE).length
    ).toBe(1)
    const tableElement = elementList.find(
      element => element.type === ElementType.TABLE
    )!
    expect(tableElement.trList!.length).toBe(6)
    const tallTrHeight = tableElement.trList![5].height!
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBe(2)
    const [firstFragment, secondFragment] = fragmentRows.map(
      row => row.tableFragment!
    )
    // 首页片段以超高行结束（行内拆分）
    expect(firstFragment.startTrIndex).toBe(0)
    expect(firstFragment.endTrIndex).toBe(6)
    expect(firstFragment.endSplitTrHeight).toBeGreaterThan(0)
    expect(firstFragment.endSplitTrHeight!).toBeLessThan(tallTrHeight)
    // 续页片段从同一行继续（偏移衔接）
    expect(secondFragment.startTrIndex).toBe(5)
    expect(secondFragment.endTrIndex).toBe(6)
    expect(secondFragment.startSplitTrOffset).toBe(
      firstFragment.endSplitTrHeight
    )
    // 拆分单元格的位置跨两页且不丢不重
    const tallTd = tableElement.trList![5].tdList[1]
    const positionList = tallTd.positionList!
    expect(positionList.length).toBe(tallTd.value.length)
    const firstPageCount = positionList.filter(p => p.pageNo === 0).length
    const secondPageCount = positionList.filter(p => p.pageNo === 1).length
    expect(firstPageCount).toBeGreaterThan(0)
    expect(secondPageCount).toBeGreaterThan(0)
    expect(firstPageCount + secondPageCount).toBe(positionList.length)
    // 续页行盒不小于剩余内容（文字不超出表格下边框）
    const fragmentY = fragmentRows[1].fragmentPosition!.coordinate.leftTop[1]
    const visibleHeight = tallTrHeight - secondFragment.startSplitTrOffset!
    const lastPosition = positionList[positionList.length - 1]
    expect(lastPosition.coordinate.leftBottom[1]).toBeLessThanOrEqual(
      fragmentY + visibleHeight + 1
    )
    // 首页行盒内文字同样不超出（行盒底 = 片段顶部 + 行前高度 + 可见高度）
    const firstFragmentY =
      fragmentRows[0].fragmentPosition!.coordinate.leftTop[1]
    const firstVisibleHeight = firstFragment.endSplitTrHeight!
    const lastFirstPagePosition = positionList
      .filter(p => p.pageNo === 0)
      .at(-1)!
    expect(lastFirstPagePosition.coordinate.leftBottom[1]).toBeLessThanOrEqual(
      firstFragmentY + tallTd.y! + firstVisibleHeight + 1
    )
    // 续页片段内的续排内容可命中
    const continuePosition = positionList.find(p => p.pageNo === 1)!
    const [x, y] = continuePosition.coordinate.leftTop
    const hit = draw.getPosition().getPositionByXY({
      x: x + 1,
      y: y + 1,
      pageNo: 1
    })
    expect(hit.isTable).toBe(true)
    expect(hit.trIndex).toBe(5)
    expect(hit.tdIndex).toBe(1)
  })

  it('超高单元格跨三页连续行内拆分', () => {
    // 2 行普通行 + 1 行约 110 行文本的超高行（超过两页容量）
    const table = buildTable(3)
    const tallText = Array.from({ length: 110 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![2].tdList[1].value = [{ value: tallText }]
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThanOrEqual(3)
    const fragments = fragmentRows.map(row => row.tableFragment!)
    // 中间片段同时携带起始偏移与结束拆分高度
    const middle = fragments[1]
    expect(middle.startTrIndex).toBe(2)
    expect(middle.endTrIndex).toBe(3)
    expect(middle.startSplitTrOffset).toBeGreaterThan(0)
    expect(middle.endSplitTrHeight).toBeGreaterThan(middle.startSplitTrOffset!)
    // 拆分窗口连续衔接
    for (let f = 1; f < fragments.length; f++) {
      expect(fragments[f].startSplitTrOffset).toBe(
        fragments[f - 1].endSplitTrHeight ?? 0
      )
    }
    // 拆分单元格位置页码连续且不丢不重
    const tallTd = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!.trList![2].tdList[1]
    expect(tallTd.positionList!.length).toBe(tallTd.value.length)
    // 各页拆分窗口内文字均不超出本页行盒底部
    for (const fragRow of fragmentRows) {
      const fragmentPosition = fragRow.fragmentPosition!
      const pagePositions = tallTd.positionList!.filter(
        p => p.pageNo === fragmentPosition.pageNo
      )
      if (!pagePositions.length) continue
      const maxBottom = Math.max(
        ...pagePositions.map(p => p.coordinate.leftBottom[1])
      )
      expect(maxBottom).toBeLessThanOrEqual(
        fragmentPosition.coordinate.leftBottom[1] + 1
      )
    }
  })

  it('窗口容不下一行内容时整行移至下页', () => {
    // 8 行 111 高填满首页后剩余空间不足一行内容
    const table = buildTable(9, 111)
    const tallText = Array.from({ length: 12 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![8].tdList[1].value = [{ value: tallText }]
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    const fragments = fragmentRows.map(row => row.tableFragment!)
    // 首页片段在行边界切分，不做行内拆分
    expect(fragments[0].endTrIndex).toBe(8)
    expect(fragments[0].endSplitTrHeight).toBeUndefined()
    // 超高行完整移至下页
    expect(fragments[1].startTrIndex).toBe(8)
    expect(fragments[1].startSplitTrOffset).toBeUndefined()
  })

  it('含跨行合并单元格的行可窗口化行内拆分', () => {
    const table = buildTable(6)
    // 第 5 行（索引 4）为超高行且含向下合并单元格
    const tallText = Array.from({ length: 32 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![4].tdList[0].rowspan = 2
    table.trList![5].tdList.shift()
    table.trList![4].tdList[1].value = [{ value: tallText }]
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    // 超高行可窗口化行内拆分（合并单元格按窗口续排）
    expect(fragmentRows.length).toBeGreaterThan(1)
    const [firstFragment, secondFragment] = fragmentRows.map(
      row => row.tableFragment!
    )
    expect(firstFragment.endSplitTrHeight).toBeGreaterThan(0)
    expect(secondFragment.startSplitTrOffset).toBe(
      firstFragment.endSplitTrHeight
    )
    // 超高单元格内容两页衔接且不丢不重
    const tallTd = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!.trList![4].tdList[1]
    expect(tallTd.positionList!.length).toBe(tallTd.value.length)
  })

  it('行内拆分续排行之后的行位置正确', () => {
    // 5 行普通行 + 1 行含 30 行文本的超高行（页边界行内拆分）+ 4 行普通行
    const table = buildTable(10)
    const midText = Array.from({ length: 30 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![5].tdList[0].value = [{ value: midText }]
    const draw = renderMain([table])
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    const splitTrHeight = tableElement.trList![5].height!
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBe(2)
    const [firstFragment, secondFragment] = fragmentRows.map(
      row => row.tableFragment!
    )
    // 首页片段以第 6 行（索引 5）行内拆分结束
    expect(firstFragment.endTrIndex).toBe(6)
    expect(firstFragment.endSplitTrHeight).toBeGreaterThan(0)
    // 续页片段从第 6 行继续，其后还有完整行
    expect(secondFragment.startTrIndex).toBe(5)
    expect(secondFragment.endTrIndex).toBe(10)
    expect(secondFragment.startSplitTrOffset).toBe(
      firstFragment.endSplitTrHeight
    )
    // 拆分单元格内容两页衔接（不重不漏）
    const splitTd = tableElement.trList![5].tdList[0]
    expect(splitTd.positionList!.length).toBe(splitTd.value.length)
    const fragmentY = fragmentRows[1].fragmentPosition!.coordinate.leftTop[1]
    // 续排内容从片段顶部开始
    const splitTdContinueY = splitTd.positionList!.find(p => p.pageNo === 1)!
      .coordinate.leftTop[1]
    expect(splitTdContinueY).toBeCloseTo(fragmentY, 0)
    // 续排行之后的行（索引 6）内容应紧贴续排行可见区底部，
    // 而不是按整行高度偏移（回归：少减续排行已消耗高度导致的整体下移）
    const nextTd = tableElement.trList![6].tdList[0]
    const expectedNextY =
      fragmentY + (splitTrHeight - secondFragment.startSplitTrOffset!)
    expect(nextTd.positionList![0].coordinate.leftTop[1]).toBeCloseTo(
      expectedNextY,
      0
    )
  })

  it('跨页表格为列表项时列表标记仅绘制在首片段', () => {
    const table = buildTable(20)
    table.listId = 'list-1'
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    expect(fragmentRows[0].isList).toBe(true)
    for (let f = 1; f < fragmentRows.length; f++) {
      expect(fragmentRows[f].isList).toBe(false)
    }
  })

  it('分栏布局下跨页表格片段落位正确', () => {
    // 两栏布局：超高表格从第 1 页第 2 栏续到第 2 页第 1 栏，后续列表顺序跟随
    const table = buildTable(14, 100)
    ;(table.colgroup as { width: number }[]).splice(
      0,
      2,
      { width: 100 },
      { width: 100 }
    )
    const main: IElement[] = [
      { value: '处置治疗：' },
      { value: '\n' },
      table,
      { value: '后续列表文本' },
      { value: '\n' }
    ]
    const draw = renderMain(main, { column: { count: 2, gap: 40 } })
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    // 首片段占满第 1 页第 2 栏，续页片段从第 2 页第 1 栏开始
    expect(fragmentRows[0].columnIndex).toBe(1)
    expect(fragmentRows[1].columnIndex).toBe(0)
    const pageRowList = draw.getPageRowList()
    expect(
      pageRowList[0].some(row => row.tableFragment && row.columnIndex === 1)
    ).toBe(true)
    expect(
      pageRowList[1].some(row => row.tableFragment && row.columnIndex === 0)
    ).toBe(true)
    // 后续文本行与续页片段同栏且位于其下方
    const positionList = draw.getPosition().getOriginalMainPositionList()
    const fragBottom =
      fragmentRows[1].fragmentPosition!.coordinate.leftBottom[1]
    const lastRow = pageRowList[1][pageRowList[1].length - 1]
    const lastPos = positionList[lastRow.startIndex]
    expect(lastPos.coordinate.leftTop[0]).toBeCloseTo(
      fragmentRows[1].fragmentPosition!.coordinate.leftTop[0],
      0
    )
    expect(lastPos.coordinate.leftTop[1]).toBeGreaterThanOrEqual(fragBottom - 1)
  })

  it('拆分单元格续排位置行号为绝对序号（上下键不误判首行跳格）', () => {
    const table = buildTable(6)
    const tallText = Array.from({ length: 40 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![5].tdList[1].value = [{ value: tallText }]
    const draw = renderMain([table])
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    const tallTd = tableElement.trList![5].tdList[1]
    const positionList = tallTd.positionList!
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBe(2)
    // 续页首个内容位置的行号大于 0（非切片相对序号）
    const firstContinuePosition = positionList.find(p => p.pageNo === 1)!
    expect(firstContinuePosition.rowIndex).toBeGreaterThan(0)
    expect(firstContinuePosition.rowNo).toBeGreaterThan(0)
    // 行号在拆分单元格内全局递增且与内容行一一对应（不冲突）
    const rowNoList = positionList.map(p => p.rowNo)
    expect(new Set(rowNoList).size).toBe(tallTd.rowList!.length)
    // 行号随内容顺序连续递增
    for (let k = 1; k < rowNoList.length; k++) {
      expect(rowNoList[k]).toBeGreaterThanOrEqual(rowNoList[k - 1])
    }
    // 首页与续页行号连续衔接
    const lastFirstPageRowNo = positionList
      .filter(p => p.pageNo === 0)
      .at(-1)!.rowNo
    expect(firstContinuePosition.rowNo).toBeGreaterThanOrEqual(
      lastFirstPageRowNo
    )
  })

  it('续页拆分窗口外的下一行单元格可正确命中', () => {
    // 超高行拆分后，点击续页中后续行的单元格不应误命中续排单元格
    const table = buildTable(10)
    const tallText = Array.from({ length: 30 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![5].tdList[0].value = [{ value: tallText }]
    const draw = renderMain([table])
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    // 续页中第 7 行（索引 6，位于拆分窗口之后）的单元格
    const nextTd = tableElement.trList![6].tdList[0]
    const nextPosition = nextTd.positionList![0]
    expect(nextPosition.pageNo).toBe(1)
    const [x, y] = nextPosition.coordinate.leftTop
    const hit = draw.getPosition().getPositionByXY({
      x: x + 1,
      y: y + 1,
      pageNo: 1
    })
    expect(hit.isTable).toBe(true)
    expect(hit.trIndex).toBe(6)
    expect(hit.tdIndex).toBe(0)
  })

  it('表格工具锚定到光标所在片段', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const position = draw.getPosition()
    // 光标位于续页片段的单元格（索引 8）
    const td = tableElement.trList![8].tdList[0]
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 8,
      tdIndex: 0
    })
    position.setCursorPosition(td.positionList![0])
    const anchor = position.getTableElementPositionByContext(
      elementList,
      position.getOriginalMainPositionList(),
      position.getPositionContext()
    )
    expect(anchor?.pageNo).toBe(td.positionList![0].pageNo)
    // 首页片段锚定回退到主列表条目
    const firstTd = tableElement.trList![0].tdList[0]
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 0,
      tdIndex: 0
    })
    position.setCursorPosition(firstTd.positionList![0])
    const firstAnchor = position.getTableElementPositionByContext(
      elementList,
      position.getOriginalMainPositionList(),
      position.getPositionContext()
    )
    expect(firstAnchor?.pageNo).toBe(0)
  })

  it('行盒高但内容少时行盒按页边界拆分（不留大空隙）', () => {
    // 8 行空行 + 1 行含跨行合并长文本行 + 1 行高空行（合并单元格内容只在顶部）
    const longText = Array.from({ length: 22 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    const table: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 200 }, { width: 200 }],
      trList: [
        ...Array.from({ length: 8 }, () => ({
          height: 42,
          minHeight: 42,
          tdList: [
            { colspan: 1, rowspan: 1, value: [] },
            { colspan: 1, rowspan: 1, value: [] }
          ]
        })),
        {
          height: 42,
          minHeight: 42,
          tdList: [
            { colspan: 1, rowspan: 2, value: [{ value: longText }] },
            { colspan: 1, rowspan: 1, value: [] }
          ]
        },
        {
          height: 703,
          minHeight: 703,
          tdList: [{ colspan: 1, rowspan: 1, value: [] }]
        }
      ]
    } as IElement
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    const fragments = fragmentRows.map(row => row.tableFragment!)
    // 高行按页边界行内拆分（而非整行推至下一页）
    expect(fragments[0].endSplitTrHeight).toBeGreaterThan(0)
    expect(fragments[1].startSplitTrOffset).toBe(fragments[0].endSplitTrHeight)
    // 首片段底部贴近页底（不留大空隙）
    const firstFrag = fragmentRows[0]
    const firstBottom = firstFrag.fragmentPosition!.coordinate.leftBottom[1]
    const pageHeight = draw.getHeight()
    const margins = draw.getMargins()
    expect(pageHeight - margins[2] - firstBottom).toBeLessThan(30)
  })

  it('首行行内拆分时位置列表与元素列表保持一一对应', () => {
    // 首行即为超高行：文本行垫高页面，使首行在页边界行内拆分
    const table = buildTable(4)
    const tallText = Array.from({ length: 30 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![0].tdList[0].value = [{ value: tallText }]
    const filler = Array.from({ length: 40 }, () => ({
      value: '行\n'
    })) as IElement[]
    const draw = renderMain([...filler, table, { value: '表格之后的文本\n' }])
    const elementList = draw.getOriginalElementList()
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    // 首行行内拆分：首片段与续排片段的 startTrIndex 均为 0
    const [firstFragment, secondFragment] = fragmentRows.map(
      row => row.tableFragment!
    )
    expect(firstFragment.startTrIndex).toBe(0)
    expect(firstFragment.endSplitTrHeight).toBeGreaterThan(0)
    expect(secondFragment.startTrIndex).toBe(0)
    expect(secondFragment.startSplitTrOffset).toBe(
      firstFragment.endSplitTrHeight
    )
    // 主位置列表与元素列表一一对应（同一表格仅首个非续排片段入主列表）
    const positionList = draw.getPosition().getOriginalMainPositionList()
    expect(positionList.length).toBe(elementList.length)
    for (let k = 0; k < elementList.length; k++) {
      expect(positionList[k].index).toBe(k)
    }
    // 全部片段（含续排片段）均在侧边列表中
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const pagingPositions = draw
      .getPosition()
      .getTablePagingPositionList()
      .filter(position => position.index === tableIndex)
    expect(pagingPositions.length).toBe(fragmentRows.length)
    // 拆分单元格内容两页衔接且不丢不重
    const tableElement = elementList[tableIndex]
    const splitTd = tableElement.trList![0].tdList[0]
    expect(splitTd.positionList!.length).toBe(splitTd.value.length)
    // 表格之后的文本行位置位于片段下方（不错位）
    const lastFrag = fragmentRows[fragmentRows.length - 1]
    const lastFragBottom = lastFrag.fragmentPosition!.coordinate.leftBottom[1]
    const afterRow = draw.getRowList()[lastFrag.rowIndex + 1]
    const afterPos = positionList[afterRow.startIndex]
    expect(afterPos.coordinate.leftTop[1]).toBeGreaterThanOrEqual(
      lastFragBottom - 1
    )
  })

  it('同页多栏片段时位置索引与数据索引对齐', () => {
    // 两栏布局：表格从第 1 页第 1 栏续到同页第 2 栏，后续正文跟随
    const table = buildTable(9, 100)
    ;(table.colgroup as { width: number }[]).splice(
      0,
      2,
      { width: 100 },
      { width: 100 }
    )
    const main: IElement[] = [table, { value: '后续正文' }, { value: '\n' }]
    const draw = renderMain(main, { column: { count: 2, gap: 40 } })
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    // 两个片段落在同一页的不同栏
    const pageRowList = draw.getPageRowList()
    const firstPageFragments = pageRowList[0].filter(row => row.tableFragment)
    expect(firstPageFragments.length).toBe(2)
    expect(firstPageFragments[0].columnIndex).toBe(0)
    expect(firstPageFragments[1].columnIndex).toBe(1)
    // 主位置列表与元素列表一一对应（视觉片段不额外消耗数据索引）
    const elementList = draw.getOriginalElementList()
    const positionList = draw.getPosition().getOriginalMainPositionList()
    expect(positionList.length).toBe(elementList.length)
    for (let k = 0; k < elementList.length; k++) {
      expect(positionList[k].index).toBe(k)
    }
    // 同页全部片段的索引均为表格数据索引
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const pagingPositions = draw
      .getPosition()
      .getTablePagingPositionList()
      .filter(
        position => position.index === tableIndex && position.pageNo === 0
      )
    expect(pagingPositions.length).toBe(2)
  })

  it('第 2 页页顶空白区域点击命中该页首行', () => {
    const filler = Array.from({ length: 80 }, () => ({
      value: '行\n'
    })) as IElement[]
    const draw = renderMain(filler)
    const pageRowList = draw.getPageRowList()
    expect(pageRowList.length).toBeGreaterThan(1)
    const margins = draw.getMargins()
    const hit = draw.getPosition().getPositionByXY({
      x: margins[3] + 1,
      y: margins[0] - 1,
      pageNo: 1
    })
    // 命中第 2 页首行首个元素（而非错误落到页尾）
    expect(hit.index).toBe(pageRowList[1][0].startIndex)
  })

  it('缩放场景下行内拆分边界一致（scale=0.5/1/2）', () => {
    for (const scale of [0.5, 1, 2]) {
      const table = buildTable(3)
      const tallText = Array.from(
        { length: 110 },
        (_, i) => `内容${i + 1}`
      ).join('\n')
      table.trList![2].tdList[1].value = [{ value: tallText }]
      const draw = renderMain([table], { scale })
      const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
      const fragments = fragmentRows.map(row => row.tableFragment!)
      // 超高行拆分为少数有效片段（缩放不产生空盒碎页）
      expect(fragments.length).toBeGreaterThanOrEqual(3)
      expect(fragments.length).toBeLessThanOrEqual(6)
      // 拆分窗口连续衔接
      for (let f = 1; f < fragments.length; f++) {
        expect(fragments[f].startSplitTrOffset ?? 0).toBe(
          fragments[f - 1].endSplitTrHeight ?? 0
        )
      }
      // 拆分单元格内容不丢不重
      const tallTd = draw
        .getOriginalElementList()
        .find(element => element.type === ElementType.TABLE)!.trList![2]
        .tdList[1]
      expect(tallTd.positionList!.length).toBe(tallTd.value.length)
    }
  })

  it('重复表头占满续页可用高度时禁用回显并正常拆分', () => {
    // 换页符使表格从页顶开始：首页片段可容纳 9 行（全部标记为重复表头）
    const table = buildTable(20)
    for (let r = 0; r < 9; r++) {
      table.trList![r].pagingRepeat = true
    }
    const main: IElement[] = [
      { value: '前文\n' },
      { type: ElementType.PAGE_BREAK, value: '\n' },
      table
    ]
    const draw = renderMain(main)
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBeGreaterThan(1)
    // 回显表头（900 高）占满续页可用高度 => 禁用回显
    for (let f = 1; f < fragmentRows.length; f++) {
      expect(fragmentRows[f].tableFragment!.repeatTrIndexes).toBeUndefined()
      expect(fragmentRows[f].tableFragment!.repeatHeight).toBe(0)
    }
    // 所有行均被片段覆盖（拆分持续推进，不丢行）
    const covered = fragmentRows.reduce(
      (pre, row) =>
        pre + (row.tableFragment!.endTrIndex - row.tableFragment!.startTrIndex),
      0
    )
    expect(covered).toBe(20)
  })

  it('页面可用高度不足一行内容时放弃拆分（不产生无限循环）', () => {
    const table = buildTable(10)
    // 可用高度仅 40，不足一行内容 => 放弃拆分整表透出
    const draw = renderMain([table], {
      width: 400,
      height: 120,
      margins: [40, 40, 40, 40]
    })
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    expect(fragmentRows.length).toBe(0)
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    expect(tableElement.trList!.length).toBe(10)
  })

  it('超高单元格跨三页时中间续页应铺满（不留大空白）', () => {
    // 单个单元格填满文字：从第 1 页跨到第 3 页，第 2 页应接近整页
    const table = buildTable(1)
    ;(table.colgroup as { width: number }[]).splice(0, 2, { width: 554 })
    const tallText = Array.from({ length: 130 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![0].height = 1855
    table.trList![0].minHeight = 42
    table.trList![0].tdList = [
      { colspan: 1, rowspan: 1, value: [{ value: tallText }] }
    ]
    const draw = renderMain([table])
    const fragmentRows = draw.getRowList().filter(row => row.tableFragment)
    const fragments = fragmentRows.map(row => row.tableFragment!)
    expect(fragments.length).toBe(3)
    // 中间续页按内容行连续拆分，可见高度应接近整页可用高度（而非碎盒）
    const middle = fragments[1]
    expect(middle.startSplitTrOffset).toBe(fragments[0].endSplitTrHeight)
    const middleVisible = middle.endSplitTrHeight! - middle.startSplitTrOffset!
    expect(middleVisible).toBeGreaterThan(800)
    // 末页承接剩余内容，拆分单元格内容不丢不重
    expect(fragments[2].startSplitTrOffset).toBe(middle.endSplitTrHeight)
    const tallTd = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!.trList![0].tdList[0]
    expect(tallTd.positionList!.length).toBe(tallTd.value.length)
  })

  it('同一单元格重排后表格工具缓存失效并更新尺寸', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const position = draw.getPosition()
    // 光标位于第一行单元格
    const td = tableElement.trList![0].tdList[0]
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 0,
      tdIndex: 0
    })
    position.setCursorPosition(td.positionList![0])
    const tableTool = draw.getTableTool()
    tableTool.render()
    const container = draw.getContainer()
    const firstRowItem = container.querySelector(
      '.ce-table-tool__row__item'
    ) as HTMLDivElement
    expect(firstRowItem).toBeTruthy()
    expect(firstRowItem.style.height).toBe('100px')
    // 同一单元格编辑重排：第一行行高增大
    tableElement.trList![0].minHeight = 300
    draw.render()
    tableTool.render()
    const updatedRowItem = container.querySelector(
      '.ce-table-tool__row__item'
    ) as HTMLDivElement
    expect(updatedRowItem.style.height).toBe('300px')
  })

  it('maxPageNo 限制页数时按片段边界裁剪跨页表格', () => {
    const draw = renderMain([buildTable(20)], {
      pageNumber: { maxPageNo: 0 }
    })
    // 表格元素未因共享索引被整体删除，仅保留一页
    const elementList = draw.getOriginalElementList()
    const tableList = elementList.filter(
      element => element.type === ElementType.TABLE
    )
    expect(tableList.length).toBe(1)
    expect(draw.getPageRowList().length).toBe(1)
    // 首页展示 [0,8) 片段，后续未展示行被裁剪
    expect(tableList[0].trList!.length).toBe(8)
    // 保存数据同步为裁剪后的表格
    const value = draw.getValue()
    const savedTable = value.data.main!.find(
      element => element.type === ElementType.TABLE
    )!
    expect(savedTable.trList!.length).toBe(8)
  })

  it('maxPageNo=1 时保留两页片段内容', () => {
    const draw = renderMain([buildTable(20)], {
      pageNumber: { maxPageNo: 1 }
    })
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    expect(draw.getPageRowList().length).toBe(2)
    // 两页展示 [0,8) [8,17)，保留 17 行
    expect(tableElement.trList!.length).toBe(17)
  })

  it('光标位于同页第二栏片段时锚定到第二栏', () => {
    const table = buildTable(9, 100)
    ;(table.colgroup as { width: number }[]).splice(
      0,
      2,
      { width: 100 },
      { width: 100 }
    )
    const draw = renderMain([table, { value: '后续正文' }, { value: '\n' }], {
      column: { count: 2, gap: 40 }
    })
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const position = draw.getPosition()
    // 第二栏片段 [8,9)：光标置于第 8 行单元格
    const td = tableElement.trList![8].tdList[0]
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 8,
      tdIndex: 0
    })
    position.setCursorPosition(td.positionList![0])
    const anchor = position.getTableElementPositionByContext(
      elementList,
      position.getOriginalMainPositionList(),
      position.getPositionContext()
    )!
    // 锚定到第二栏片段而非第一个片段
    expect(anchor.tableFragment!.startTrIndex).toBe(8)
    const firstFragmentPosition = position
      .getTablePagingPositionList()
      .find(p => p.index === tableIndex && p.tableFragment!.startTrIndex === 0)!
    expect(anchor.coordinate.leftTop[0]).toBeGreaterThan(
      firstFragmentPosition.coordinate.leftTop[0]
    )
  })

  it('表格工具禁用后旧工具 DOM 被清理', () => {
    const draw = renderMain([buildTable(5)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const position = draw.getPosition()
    const td = tableElement.trList![0].tdList[0]
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 0,
      tdIndex: 0
    })
    position.setCursorPosition(td.positionList![0])
    const tableTool = draw.getTableTool()
    tableTool.render()
    const container = draw.getContainer()
    expect(container.querySelector('.ce-table-tool__row')).toBeTruthy()
    // 布局不变地禁用表格工具：缓存不应阻碍清理
    tableElement.tableToolDisabled = true
    tableTool.render()
    expect(container.querySelector('.ce-table-tool__row')).toBeFalsy()
    // 重新启用后工具恢复
    tableElement.tableToolDisabled = false
    tableTool.render()
    expect(container.querySelector('.ce-table-tool__row')).toBeTruthy()
  })

  it('缩放时表格工具尺寸不重复缩放（scale=0.5/2）', () => {
    for (const scale of [0.5, 2]) {
      const draw = renderMain([buildTable(2)], { scale })
      const elementList = draw.getOriginalElementList()
      const tableIndex = elementList.findIndex(
        element => element.type === ElementType.TABLE
      )
      const tableElement = elementList[tableIndex]
      const position = draw.getPosition()
      const td = tableElement.trList![0].tdList[0]
      position.setPositionContext({
        isTable: true,
        isControl: false,
        index: tableIndex,
        trIndex: 0,
        tdIndex: 0
      })
      position.setCursorPosition(td.positionList![0])
      draw.getTableTool().render()
      const container = draw.getContainer()
      // 边框容器高度 = 2 行 × 100 × scale（metrics 已含缩放，不重复乘）
      const borderContainer = container.querySelector(
        '.ce-table-tool__border'
      ) as HTMLDivElement
      expect(borderContainer.style.height).toBe(`${200 * scale}px`)
      // 选择/快捷按钮尺寸由 CSS 类固定，不写内联高度
      const selectBtn = container.querySelector(
        '.ce-table-tool__select'
      ) as HTMLDivElement
      expect(selectBtn.style.height).toBe('')
    }
  })

  it('maxPageNo 截断时保留首行跨页已展示内容', () => {
    // 超高首行跨三页：maxPageNo=0 时保留第 1 页已展示的拆分行内容
    const buildTallTable = () => {
      const table = buildTable(1)
      ;(table.colgroup as { width: number }[]).splice(0, 2, { width: 554 })
      const tallText = Array.from(
        { length: 130 },
        (_, i) => `内容${i + 1}`
      ).join('\n')
      table.trList![0].height = 1855
      table.trList![0].minHeight = 42
      table.trList![0].tdList = [
        { colspan: 1, rowspan: 1, value: [{ value: tallText }] }
      ]
      return table
    }
    // 未截断基线内容长度
    const baselineDraw = renderMain([buildTallTable()])
    const baselineTd = baselineDraw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!.trList![0].tdList[0]
    const baselineLength = baselineTd.value.length
    const draw = renderMain([buildTallTable()], {
      pageNumber: { maxPageNo: 0 }
    })
    // 表格未整体删除：保留拆分行及首页已展示的部分内容
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    expect(tableElement.trList!.length).toBe(1)
    const td = tableElement.trList![0].tdList[0]
    expect(td.value.length).toBeGreaterThan(0)
    expect(td.value.length).toBeLessThan(baselineLength)
    expect(draw.getPageRowList().length).toBe(1)
    // 重渲染后稳定：不再拆分也不再截断
    draw.render()
    expect(tableElement.trList!.length).toBe(1)
    expect(draw.getRowList().filter(row => row.tableFragment).length).toBe(0)
  })

  it('maxPageNo 截断时收缩跨越裁剪点的 rowspan', () => {
    const table = buildTable(20)
    // 第 7 行（索引 6）首列向下合并 5 行，跨越首页切分点 [0,8)
    table.trList![6].tdList[0].rowspan = 5
    for (let r = 7; r < 11; r++) {
      table.trList![r].tdList.shift()
    }
    const draw = renderMain([table], { pageNumber: { maxPageNo: 0 } })
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    // 保留首页展示的 8 行
    expect(tableElement.trList!.length).toBe(8)
    // 跨越裁剪点的合并单元格：跨度收缩为 2，高度同步收缩
    const spanTd = tableElement.trList![6].tdList[0]
    expect(spanTd.rowspan).toBe(2)
    expect(spanTd.height).toBe(200)
  })

  it('同页双栏表格跨表格选区绘制不漏绘', () => {
    const table = buildTable(9, 100)
    ;(table.colgroup as { width: number }[]).splice(
      0,
      2,
      { width: 100 },
      { width: 100 }
    )
    const draw = renderMain([table, { value: '后续正文' }, { value: '\n' }], {
      column: { count: 2, gap: 40 }
    })
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const range = draw.getRange()
    // 选区从表格到表格后的第一个文字
    range.setRange(tableIndex, tableIndex + 1)
    const rangeRenderSpy = vi.spyOn(range, 'render')
    // jsdom 下懒渲染观察器不触发，需立即渲染才能捕获选区绘制
    draw.render({
      isCompute: false,
      isLazy: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    // 表格后文字的选区应绘制在文字行位置（索引不漂移）
    const positionList = draw.getPosition().getOriginalMainPositionList()
    const textY = positionList[tableIndex + 1].coordinate.leftTop[1]
    const isTextRangeDrawn = rangeRenderSpy.mock.calls.some(
      ([, , y]) => Math.abs(y - textY) < 2
    )
    expect(isTextRangeDrawn).toBe(true)
    rangeRenderSpy.mockRestore()
  })

  it('续页重复表头时行工具起点下移回显高度', () => {
    const table = buildTable(20)
    table.trList![0].pagingRepeat = true
    const draw = renderMain([table])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const position = draw.getPosition()
    // 光标位于续页片段（第 8 行）
    const td = tableElement.trList![8].tdList[0]
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 8,
      tdIndex: 0
    })
    position.setCursorPosition(td.positionList![0])
    draw.getTableTool().render()
    const container = draw.getContainer()
    const rowContainer = container.querySelector(
      '.ce-table-tool__row'
    ) as HTMLDivElement
    const anchor = position.getTableElementPositionByContext(
      elementList,
      position.getOriginalMainPositionList(),
      position.getPositionContext()
    )!
    const tableY =
      anchor.coordinate.leftTop[1] +
      anchor.pageNo * (draw.getHeight() + draw.getPageGap())
    // 行工具容器起点 = 表格锚点 + 回显表头高度
    expect(rowContainer.style.top).toBe(
      `${tableY + anchor.tableFragment!.repeatHeight}px`
    )
    // 首个正文行工具对应片段起始行（而非回显表头行）
    const firstRowItem = rowContainer.querySelector(
      '.ce-table-tool__row__item'
    ) as HTMLDivElement
    ;(firstRowItem.onclick as () => void)()
    expect(position.getPositionContext().trIndex).toBe(
      anchor.tableFragment!.startTrIndex
    )
  })

  it('maxPageNo 截断后表格高度与保留行一致', () => {
    const draw = renderMain([buildTable(20)], {
      pageNumber: { maxPageNo: 0 }
    })
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    // 保留 8 行，高度同步为保留行总高（导出数据行高一致）
    expect(tableElement.trList!.length).toBe(8)
    const retainedHeight = tableElement.trList!.reduce(
      (pre, cur) => pre + cur.height!,
      0
    )
    expect(tableElement.height).toBe(retainedHeight)
    const value = draw.getValue()
    const savedTable = value.data.main!.find(
      element => element.type === ElementType.TABLE
    )!
    expect(savedTable.height).toBe(retainedHeight)
  })

  it('光标位于被裁剪行时完整迁移表格上下文', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const position = draw.getPosition()
    // 光标位于第 16 行（索引 15，会被 maxPageNo=0 裁剪）
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 15,
      tdIndex: 0
    })
    draw.getOptions().pageNumber.maxPageNo = 0
    draw.render()
    // 迁移到末尾保留行（索引 7）并完整重建上下文
    const newContext = position.getPositionContext()
    const newTr = tableElement.trList![7]
    const newTd = newTr.tdList[newTr.tdList.length - 1]
    expect(newContext.trIndex).toBe(7)
    expect(newContext.tdIndex).toBe(newTr.tdList.length - 1)
    expect(newContext.trId).toBe(newTr.id)
    expect(newContext.tdId).toBe(newTd.id)
    expect(newContext.tableId).toBe(tableElement.id)
  })

  it('被裁剪末行被合并单元格覆盖时迁移到实际可见单元格', () => {
    const table = buildTable(20)
    // 第 7 行（索引 6）两列均向下合并 2 行，使第 8 行（索引 7）无自身单元格
    table.trList![6].tdList[0].rowspan = 2
    table.trList![6].tdList[1].rowspan = 2
    table.trList![7].tdList = []
    const draw = renderMain([table])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const position = draw.getPosition()
    // 光标位于第 16 行（索引 15，会被裁剪）
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 15,
      tdIndex: 0
    })
    draw.getOptions().pageNumber.maxPageNo = 0
    draw.render()
    // 末行（索引 7）无自身单元格：迁移到覆盖它的合并单元格（索引 6 行次列）
    const newContext = position.getPositionContext()
    expect(newContext.trIndex).toBe(6)
    expect(newContext.tdIndex).toBe(1)
  })

  it('拆分行内容被裁剪后选区与光标索引同步收缩', () => {
    const table = buildTable(1)
    ;(table.colgroup as { width: number }[]).splice(0, 2, { width: 554 })
    const tallText = Array.from({ length: 130 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![0].height = 1855
    table.trList![0].minHeight = 42
    table.trList![0].tdList = [
      { colspan: 1, rowspan: 1, value: [{ value: tallText }] }
    ]
    const draw = renderMain([table])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const td = tableElement.trList![0].tdList[0]
    const position = draw.getPosition()
    const range = draw.getRange()
    // 光标与选区位于将被裁剪的内容尾部
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 0,
      tdIndex: 0
    })
    const outOfBoundsIndex = td.value.length - 1
    range.setRange(outOfBoundsIndex, outOfBoundsIndex)
    draw.getOptions().pageNumber.maxPageNo = 0
    draw.render({ curIndex: outOfBoundsIndex })
    // 内容已被裁剪：选区收缩到保留范围内
    const newRange = range.getRange()
    expect(newRange.endIndex).toBeLessThanOrEqual(td.value.length - 1)
    // 光标未丢失且落在保留内容末尾
    const cursorPosition = position.getCursorPosition()
    expect(cursorPosition).toBeTruthy()
    expect(cursorPosition!.index).toBeLessThanOrEqual(td.value.length - 1)
  })

  it('续页片段内进位合并单元格也有边框拖拽手柄', () => {
    const table = buildTable(20)
    // 第 7 行（索引 6）首列向下合并 5 行，跨越首页切分点
    table.trList![6].tdList[0].rowspan = 5
    for (let r = 7; r < 11; r++) {
      table.trList![r].tdList.shift()
    }
    const draw = renderMain([table])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const position = draw.getPosition()
    // 光标位于续页片段（第 8 行）
    const td = tableElement.trList![8].tdList[0]
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 8,
      tdIndex: 0
    })
    position.setCursorPosition(td.positionList![0])
    draw.getTableTool().render()
    const container = draw.getContainer()
    const anchor = position.getTableElementPositionByContext(
      elementList,
      position.getOriginalMainPositionList(),
      position.getPositionContext()
    )!
    expect(anchor.tableFragment!.startTrIndex).toBe(8)
    // 进位合并单元格（索引 6 首列，可见窗口 300 高）应生成列拖拽手柄
    const colBorders = [
      ...container.querySelectorAll('.ce-table-tool__border__col')
    ] as HTMLDivElement[]
    const hasCarriedTdHandle = colBorders.some(
      border => border.style.top === '0px' && border.style.height === '300px'
    )
    expect(hasCarriedTdHandle).toBe(true)
  })

  it('跨行列选区端点被截断时折叠为有效光标且不崩溃', () => {
    const table = buildTable(20)
    // 最后一条保留行同时含跨行覆盖单元格与自身单元格，不能按 tdIndex 猜测列位
    table.trList![6].tdList[0].rowspan = 2
    table.trList![7].tdList.shift()
    const draw = renderMain([table])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const tr = tableElement.trList![0]
    const td = tr.tdList[0]
    const position = draw.getPosition()
    position.setPositionContext({
      isTable: true,
      index: tableIndex,
      trIndex: 0,
      tdIndex: 0,
      tdId: td.id,
      trId: tr.id,
      tableId: tableElement.id
    })
    const range = draw.getRange()
    // 从保留行选到第 17 行（索引 16，端点会被 maxPageNo=0 裁剪）
    range.setRange(0, 0, tableElement.id, 0, 1, 0, 16)
    expect(range.getRange().isCrossRowCol).toBe(true)
    draw.getOptions().pageNumber.maxPageNo = 0
    // 立即渲染触发跨行列选区绘制，不应抛错
    draw.render({ isCompute: true, isLazy: false, isSubmitHistory: false })
    const newRange = range.getRange()
    expect(newRange.isCrossRowCol).toBeFalsy()
    expect(newRange.startTrIndex).toBeUndefined()
    expect(newRange.endTrIndex).toBeUndefined()
    expect(position.getCursorPosition()).toBeTruthy()
  })

  it('光标迁移后上下文不保留旧单元格命中状态', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const position = draw.getPosition()
    // 光标位于被裁剪行且携带图片/控件命中状态
    position.setPositionContext({
      isTable: true,
      isControl: true,
      isImage: true,
      isDirectHit: true,
      index: tableIndex,
      trIndex: 15,
      tdIndex: 0
    })
    draw.getOptions().pageNumber.maxPageNo = 0
    draw.render()
    const newContext = position.getPositionContext()
    expect(newContext.trIndex).toBe(7)
    // 迁移后构造干净上下文：旧单元格的命中状态被重置
    expect(newContext.isImage).toBeFalsy()
    expect(newContext.isDirectHit).toBeFalsy()
    expect(newContext.isControl).toBeFalsy()
  })

  it('嵌套表格路径失效时折叠到外层单元格', () => {
    const draw = renderMain([buildTable(20)])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const position = draw.getPosition()
    // 光标位于保留行，但嵌套表格路径指向不存在的内层结构
    position.setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 99,
      tdIndex: 99,
      tablePath: [
        { index: tableIndex, trIndex: 0, tdIndex: 0 },
        { index: 0, trIndex: 99, tdIndex: 99 }
      ]
    })
    draw.getOptions().pageNumber.maxPageNo = 0
    draw.render()
    const newContext = position.getPositionContext()
    // 路径失效：折叠到外层表格单元格
    expect(newContext.tablePath?.length).toBe(1)
    expect(newContext.trIndex).toBe(0)
    expect(newContext.tdIndex).toBe(0)
  })

  it('rowspan 恰好结束于拆分行时高度同步收缩', () => {
    const table = buildTable(10)
    // 第 8 行（索引 7）首列向下合并 2 行；第 9 行（索引 8）为超高行将被行内拆分
    const tallText = Array.from({ length: 30 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![7].tdList[0].rowspan = 2
    table.trList![8].tdList.shift()
    table.trList![8].tdList[0].value = [{ value: tallText }]
    const draw = renderMain([table], { pageNumber: { maxPageNo: 0 } })
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    // 拆分行被部分保留且行高缩短
    const keepTrCount = tableElement.trList!.length
    const splitTr = tableElement.trList![keepTrCount - 1]
    expect(splitTr.height).toBeLessThan(500)
    // 恰好结束于拆分行的合并单元格：高度按跨度重算（不包含被裁掉的高度）
    const spanTd = tableElement.trList![7].tdList[0]
    expect(spanTd.rowspan).toBe(2)
    expect(spanTd.height).toBe(
      tableElement.trList![7].height! + splitTr.height!
    )
  })

  it('单元格内容一行都放不下时保留补偿节点', () => {
    // 单个超高行：一个单元格为文本（可部分展示），另一个为超高图片（一行都放不下）
    const table = buildTable(1)
    const tallText = Array.from({ length: 30 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![0].height = 950
    table.trList![0].tdList = [
      { colspan: 1, rowspan: 1, value: [{ value: tallText }] },
      {
        colspan: 1,
        rowspan: 1,
        value: [{ type: ElementType.IMAGE, value: '', width: 100, height: 950 }]
      }
    ]
    const draw = renderMain([table], { pageNumber: { maxPageNo: 0 } })
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    const imageTd = tableElement.trList![0].tdList[1]
    // 图片一行都展示不下：单元格退化为补偿节点而非空数组
    expect(imageTd.value.length).toBe(1)
    expect(imageTd.value[0].value).toBe(ZERO)
    expect(imageTd.value[0].tdId).toBe(imageTd.id)
    expect(imageTd.value[0].trId).toBe(tableElement.trList![0].id)
    expect(imageTd.value[0].tableId).toBe(tableElement.id)
    // 内容行与位置数据同步重建
    expect(imageTd.rowList!.length).toBeGreaterThanOrEqual(1)
    expect(imageTd.positionList!.length).toBe(1)
  })

  it('保留单元格内的命中内容被裁剪后清理旧命中状态', () => {
    const table = buildTable(1)
    const tallText = Array.from({ length: 30 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    table.trList![0].height = 950
    table.trList![0].tdList = [
      { colspan: 1, rowspan: 1, value: [{ value: tallText }] },
      {
        colspan: 1,
        rowspan: 1,
        value: [{ type: ElementType.IMAGE, value: '', width: 100, height: 950 }]
      }
    ]
    const draw = renderMain([table])
    const elementList = draw.getOriginalElementList()
    const tableIndex = elementList.findIndex(
      element => element.type === ElementType.TABLE
    )
    const tableElement = elementList[tableIndex]
    const tr = tableElement.trList![0]
    const imageTd = tr.tdList[1]
    const imageIndex = imageTd.value.length - 1
    const position = draw.getPosition()
    position.setPositionContext({
      isTable: true,
      isControl: true,
      isImage: true,
      isDirectHit: true,
      index: tableIndex,
      trIndex: 0,
      tdIndex: 1,
      tdId: imageTd.id,
      trId: tr.id,
      tableId: tableElement.id
    })
    draw.getRange().setRange(imageIndex, imageIndex)
    draw.getOptions().pageNumber.maxPageNo = 0
    draw.render({ curIndex: imageIndex })

    const newContext = position.getPositionContext()
    expect(newContext.isImage).toBeFalsy()
    expect(newContext.isDirectHit).toBeFalsy()
    expect(newContext.isControl).toBeFalsy()
    expect(position.getCursorPosition()).toBeTruthy()
  })
})
