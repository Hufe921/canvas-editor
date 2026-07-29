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

const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}

function buildTable(rowCount = 3, colCount = 3): IElement {
  return {
    type: ElementType.TABLE,
    value: '',
    colgroup: Array.from({ length: colCount }, () => ({ width: 150 })),
    trList: Array.from({ length: rowCount }, () => ({
      height: 42,
      minHeight: 42,
      tdList: Array.from({ length: colCount }, (_, d) => ({
        colspan: 1,
        rowspan: 1,
        value: [{ value: `格${d}` }, { value: ZERO }]
      }))
    }))
  } as IElement
}

// 文本 + 表格 + 文本 + 表格 + 文本
function buildMixedElementList(): IElement[] {
  const text = (prefix: string): IElement[] =>
    prefix.split('').map(value => ({ value }))
  return [
    ...text('表格前的正文内容'),
    { value: ZERO },
    buildTable(),
    { value: ZERO },
    ...text('两个表格之间的正文内容'),
    { value: ZERO },
    buildTable(),
    { value: ZERO },
    ...text('表格后的正文内容'),
    { value: ZERO }
  ]
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
  return new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
}

function getTableList(draw: Draw): IElement[] {
  return draw
    .getOriginalElementList()
    .filter(element => element.type === ElementType.TABLE)
}

function getTdRowListRefs(table: IElement) {
  return table.trList!.flatMap(tr => tr.tdList.map(td => td.rowList))
}

describe('表格计算缓存', () => {
  // 统计单元格行计算的调用（isFromTable 为 true 的 computeRowList 调用）
  function spyTdCompute(draw: Draw) {
    const spy = vi.spyOn(draw, 'computeRowList')
    return {
      spy,
      getTdCallCount: () =>
        spy.mock.calls.filter(call => call[0]?.isFromTable).length,
      getTdCallValues: () =>
        spy.mock.calls
          .filter(call => call[0]?.isFromTable)
          .map(call => call[0].elementList)
    }
  }

  it('表外输入：全部单元格跳过重算且行信息引用不变', () => {
    const draw = renderMain(buildMixedElementList())
    const [table1, table2] = getTableList(draw)
    const table1Refs = getTdRowListRefs(table1)
    const table2Refs = getTdRowListRefs(table2)
    const table1Height = table1.height
    const table2Height = table2.height
    const { spy, getTdCallCount } = spyTdCompute(draw)
    spy.mockClear()
    // 在表格前的正文中输入
    const elementList = draw.getElementList()
    draw.spliceElementList(
      elementList,
      3,
      0,
      '插入'.split('').map(value => ({ value }))
    )
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    // 所有单元格命中缓存：不再计算单元格行信息
    expect(getTdCallCount()).toBe(0)
    // 单元格行信息与表格尺寸复用
    expect(getTdRowListRefs(table1)).toEqual(table1Refs)
    expect(getTdRowListRefs(table2)).toEqual(table2Refs)
    expect(table1.height).toBe(table1Height)
    expect(table2.height).toBe(table2Height)
  })

  it('单元格内输入：仅该单元格重算，其余单元格复用', () => {
    const draw = renderMain(buildMixedElementList())
    const [table1, table2] = getTableList(draw)
    const table1Refs = getTdRowListRefs(table1)
    const table2Refs = getTdRowListRefs(table2)
    const { spy, getTdCallCount, getTdCallValues } = spyTdCompute(draw)
    spy.mockClear()
    // 在第一个表格的首个单元格内输入
    const td = table1.trList![0].tdList[0]
    draw.spliceElementList(td.value, 1, 0, [{ value: '新' }])
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    // 仅编辑过的单元格重新计算行信息
    expect(getTdCallCount()).toBe(1)
    expect(getTdCallValues()[0]).toBe(td.value)
    // 变更单元格行信息更新，其余单元格复用
    const table1RefsAfter = getTdRowListRefs(table1)
    expect(table1RefsAfter[0]).not.toBe(table1Refs[0])
    expect(table1RefsAfter.slice(1)).toEqual(table1Refs.slice(1))
    // 第二个表格完全复用
    expect(getTdRowListRefs(table2)).toEqual(table2Refs)
  })

  it('修改行最小高度：行高回填始终执行', () => {
    const draw = renderMain(buildMixedElementList())
    const [table1] = getTableList(draw)
    table1.trList![0].minHeight = 200
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    expect(table1.trList![0].height).toBe(200)
  })

  it('修改列宽：列宽变化的单元格缓存失效并重新计算', () => {
    const draw = renderMain(buildMixedElementList())
    const [table1, table2] = getTableList(draw)
    const table2Refs = getTdRowListRefs(table2)
    const { spy, getTdCallCount } = spyTdCompute(draw)
    spy.mockClear()
    table1.colgroup![0].width = 300
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    // 列宽变化表格的全部单元格重算（3x3 = 9 个单元格）
    expect(getTdCallCount()).toBe(9)
    // 第二个表格完全复用
    expect(getTdRowListRefs(table2)).toEqual(table2Refs)
  })

  it('新增表格行：结构性变更自动重算', () => {
    const draw = renderMain(buildMixedElementList())
    const [table1] = getTableList(draw)
    const { spy, getTdCallCount } = spyTdCompute(draw)
    spy.mockClear()
    table1.trList!.push({
      height: 42,
      minHeight: 42,
      tdList: Array.from({ length: 3 }, (_, d) => ({
        colspan: 1,
        rowspan: 1,
        value: [{ value: `新${d}` }, { value: ZERO }]
      }))
    })
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    // 新增行的 3 个单元格重算
    expect(getTdCallCount()).toBe(3)
    expect(table1.trList!.length).toBe(4)
  })
})
