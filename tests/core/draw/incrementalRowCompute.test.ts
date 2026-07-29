import { describe, it, expect, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { PageMode } from '@/editor/dataset/enum/Editor'
import { ImageDisplay } from '@/editor/dataset/enum/Common'
import { ZERO } from '@/editor/dataset/constant/Common'
import { IElement } from '@/editor/interface/Element'
import { INCREMENTAL_COMPUTE_MIN_ELEMENT_COUNT } from '@/editor/dataset/constant/Editor'

const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}

// 构造超过增量阈值的纯文本文档（每段以换行符结尾）
function buildLargeTextElementList(paragraphCount = 450): IElement[] {
  const elementList: IElement[] = []
  for (let p = 0; p < paragraphCount; p++) {
    const text = `第${p}段：这是一段用于性能测试的普通文本内容abc123。`
    for (const ch of text) {
      elementList.push({ value: ch })
    }
    elementList.push({ value: ZERO })
  }
  return elementList
}

function buildTable(): IElement {
  return {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 200 }, { width: 200 }],
    trList: [
      {
        height: 42,
        minHeight: 42,
        tdList: [
          {
            colspan: 1,
            rowspan: 1,
            value: [{ value: '单元格' }, { value: ZERO }]
          },
          { colspan: 1, rowspan: 1, value: [{ value: ZERO }] }
        ]
      }
    ]
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
  return new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
}

// 布局快照：行信息、页面信息、位置信息（用于增量与全量结果逐项对比）
function snapshotLayout(draw: Draw) {
  const rowList = draw.getRowList()
  const pageRowList = draw.getPageRowList()
  const positionList = draw.getPosition().getPositionList()
  return {
    rows: rowList.map(row => ({
      startIndex: row.startIndex,
      rowIndex: row.rowIndex,
      width: row.width,
      height: row.height,
      ascent: row.ascent,
      elementCount: row.elementList.length,
      firstElement: row.elementList[0]
    })),
    pages: pageRowList.map(page => page.length),
    positions: positionList.map(p => ({
      index: p.index,
      pageNo: p.pageNo,
      rowNo: p.rowNo,
      rowIndex: p.rowIndex,
      value: p.value,
      leftTop: p.coordinate.leftTop,
      leftBottom: p.coordinate.leftBottom
    }))
  }
}

function insertText(draw: Draw, start: number, text: string) {
  const elementList = draw.getElementList()
  const items = text.split('').map(value => ({ value }))
  draw.spliceElementList(elementList, start, 0, items)
  draw.render({ isSetCursor: false, isSubmitHistory: false })
}

function deleteText(draw: Draw, start: number, count: number) {
  const elementList = draw.getElementList()
  draw.spliceElementList(elementList, start, count)
  draw.render({ isSetCursor: false, isSubmitHistory: false })
}

// 强制全量重算（无变更记录时 render 回退全量路径）
function forceFullCompute(draw: Draw) {
  draw.render({ isSetCursor: false, isSubmitHistory: false })
}

function spyIncremental(draw: Draw) {
  return vi.spyOn((draw as any).incrementalRowCompute, 'computeRowList')
}

// 获取最近一次增量计算的返回值（null 表示回退全量）
function lastIncrementalResult(spy: ReturnType<typeof vi.spyOn>) {
  const results = spy.mock.results
  return results.length ? results[results.length - 1].value : null
}

describe('增量行计算', () => {
  it('文中插入文本：增量生效且与全量计算结果一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const preRowList = draw.getRowList()
    const spy = spyIncremental(draw)
    insertText(draw, 5000, '插入的测试文本')
    expect(lastIncrementalResult(spy)).not.toBeNull()
    // 变更点之后的行复用旧行对象引用（证明复用而非重算）
    const postRowList = draw.getRowList()
    expect(postRowList[postRowList.length - 1]).toBe(
      preRowList[preRowList.length - 1]
    )
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('文末输入文本：增量生效且与全量计算结果一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const elementList = draw.getElementList()
    const spy = spyIncremental(draw)
    insertText(draw, elementList.length - 1, '末尾追加')
    expect(lastIncrementalResult(spy)).not.toBeNull()
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('文首插入文本：从头重算并再同步，结果与全量一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const spy = spyIncremental(draw)
    insertText(draw, 0, '文首插入内容')
    expect(lastIncrementalResult(spy)).not.toBeNull()
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('文中删除文本：增量生效且与全量计算结果一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const spy = spyIncremental(draw)
    deleteText(draw, 8000, 5)
    expect(lastIncrementalResult(spy)).not.toBeNull()
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('删除段落换行符合并段落：增量生效且与全量计算结果一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const elementList = draw.getElementList()
    // 找到第 100 段结尾的换行符位置
    let index = -1
    let count = 0
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].value === ZERO && ++count === 100) {
        index = i
        break
      }
    }
    expect(index).toBeGreaterThan(0)
    const spy = spyIncremental(draw)
    deleteText(draw, index, 1)
    expect(lastIncrementalResult(spy)).not.toBeNull()
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('选区替换（先删后插同起点合并）：增量生效且与全量一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const elementList = draw.getElementList()
    const spy = spyIncremental(draw)
    draw.spliceElementList(elementList, 6000, 10)
    draw.spliceElementList(
      elementList,
      6000,
      0,
      '替换内容'.split('').map(value => ({ value }))
    )
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    expect(lastIncrementalResult(spy)).not.toBeNull()
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('文中插入换行（行高变化）：与全量计算结果一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    insertText(draw, 5000, ZERO)
    // 分页模式下后续行 y 偏移，可能重算至文末，但结果必须一致
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('连续模式：插入与删除均与全量计算结果一致', () => {
    const draw = renderMain(buildLargeTextElementList(), {
      pageMode: PageMode.CONTINUITY
    })
    const spy = spyIncremental(draw)
    insertText(draw, 5000, '连续模式插入')
    expect(lastIncrementalResult(spy)).not.toBeNull()
    let incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
    // 连续模式下行组成与 y 无关，插入换行后应快速再同步
    insertText(draw, 3000, ZERO)
    expect(lastIncrementalResult(spy)).not.toBeNull()
    incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
    deleteText(draw, 9000, 3)
    expect(lastIncrementalResult(spy)).not.toBeNull()
    incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('非计算渲染不消费变更记录，后续计算渲染结果与全量一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const elementList = draw.getElementList()
    draw.spliceElementList(
      elementList,
      5000,
      0,
      '延迟渲染'.split('').map(value => ({ value }))
    )
    draw.render({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    const incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('多处变更（不同起点）：回退全量计算且结果一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    const elementList = draw.getElementList()
    const spy = spyIncremental(draw)
    draw.spliceElementList(elementList, 1000, 0, [{ value: '甲' }])
    draw.spliceElementList(elementList, 5000, 0, [{ value: '乙' }])
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    expect(lastIncrementalResult(spy)).toBeNull()
    const fullSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(fullSnapshot)
  })

  it('阈值以下文档：回退全量计算', () => {
    const draw = renderMain(buildLargeTextElementList(50))
    expect(draw.getElementList().length).toBeLessThan(
      INCREMENTAL_COMPUTE_MIN_ELEMENT_COUNT
    )
    const spy = spyIncremental(draw)
    insertText(draw, 100, '小文档插入')
    expect(lastIncrementalResult(spy)).toBeNull()
  })

  it('含表格文档：表外文本编辑增量生效且与全量计算结果一致', () => {
    const elementList = buildLargeTextElementList()
    // 文档中部插入一个表格
    const table = buildTable()
    elementList.splice(6000, 0, table)
    const draw = renderMain(elementList)
    const tableIndex = draw.getElementList().indexOf(table)
    expect(tableIndex).toBeGreaterThan(0)
    const spy = spyIncremental(draw)
    // 表格前的文本编辑
    insertText(draw, 5000, '表格前插入')
    expect(lastIncrementalResult(spy)).not.toBeNull()
    let incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
    // 恢复行即表格行（干净表格复用尺寸快照）
    insertText(draw, tableIndex + 5, '表格后插入')
    expect(lastIncrementalResult(spy)).not.toBeNull()
    incrementalSnapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
  })

  it('恢复行为脏表格时回退全量计算', () => {
    const elementList = buildLargeTextElementList()
    const table = buildTable()
    elementList.splice(6000, 0, table)
    const draw = renderMain(elementList)
    // 先在表格单元格内编辑使表格变脏
    const td = table.trList![0].tdList[0]
    draw.spliceElementList(td.value, 0, 0, [{ value: '脏' }])
    // 紧接着在表格行内（表格后一个元素位置）编辑主文档
    const tableIndex = draw.getElementList().indexOf(table)
    expect(tableIndex).toBeGreaterThan(0)
    const spy = spyIncremental(draw)
    insertText(draw, tableIndex + 1, '表格后插入')
    // 恢复行为脏表格：回退全量
    expect(lastIncrementalResult(spy)).toBeNull()
    const snapshot = snapshotLayout(draw)
    forceFullCompute(draw)
    expect(snapshotLayout(draw)).toEqual(snapshot)
  })

  it('含列表文档：回退全量计算', () => {
    const elementList = buildLargeTextElementList()
    elementList[6000].listId = 'test-list-id'
    const draw = renderMain(elementList)
    const spy = spyIncremental(draw)
    insertText(draw, 5000, '含列表插入')
    expect(lastIncrementalResult(spy)).toBeNull()
  })

  it('含环绕图片文档：回退全量计算', () => {
    const elementList = buildLargeTextElementList()
    elementList.splice(4000, 0, {
      type: ElementType.IMAGE,
      value: '',
      width: 100,
      height: 100,
      imgDisplay: ImageDisplay.SURROUND,
      imgFloatPosition: { pageNo: 0, x: 10, y: 10 }
    } as IElement)
    const draw = renderMain(elementList)
    const spy = spyIncremental(draw)
    insertText(draw, 5000, '含环绕图插入')
    expect(lastIncrementalResult(spy)).toBeNull()
  })

  it('插入段包含表格：回退全量计算', () => {
    const draw = renderMain(buildLargeTextElementList())
    const elementList = draw.getElementList()
    const spy = spyIncremental(draw)
    draw.spliceElementList(elementList, 5000, 0, [buildTable()])
    draw.render({ isSetCursor: false, isSubmitHistory: false })
    expect(lastIncrementalResult(spy)).toBeNull()
  })

  it('种子随机编辑模糊测试：每轮结果均与全量计算一致', () => {
    const draw = renderMain(buildLargeTextElementList())
    // 线性同余伪随机，保证用例可复现
    let seed = 42
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const words = '性能优化增量计算测试abcXYZ'
    for (let round = 0; round < 30; round++) {
      const elementList = draw.getElementList()
      const isInsert = random() > 0.4
      if (isInsert) {
        const start = Math.floor(random() * (elementList.length - 1))
        const length = 1 + Math.floor(random() * 5)
        let text = ''
        for (let w = 0; w < length; w++) {
          text += words[Math.floor(random() * words.length)]
        }
        // 偶发插入换行符触发行高变化
        if (random() > 0.85) text += ZERO
        insertText(draw, start, text)
      } else {
        const start = Math.floor(random() * (elementList.length - 6))
        deleteText(draw, start, 1 + Math.floor(random() * 5))
      }
      const incrementalSnapshot = snapshotLayout(draw)
      forceFullCompute(draw)
      expect(snapshotLayout(draw)).toEqual(incrementalSnapshot)
    }
    // 文档规模保持在阈值附近以上
    expect(draw.getElementList().length).toBeGreaterThanOrEqual(
      INCREMENTAL_COMPUTE_MIN_ELEMENT_COUNT
    )
  }, 60000)
})
