import { afterEach, describe, expect, it } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import { IElement } from '@/editor/interface/Element'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

function createTableDraw(direction?: TextDirection) {
  const container = document.createElement('div')
  document.body.append(container)
  const options = mergeOption({ width: 794, height: 1123 })
  const main: IElement[] = [
    {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 100 }, { width: 100 }],
      trList: [
        {
          height: 40,
          tdList: [
            {
              colspan: 1,
              rowspan: 1,
              value: [{ value: 'abc', direction }]
            },
            {
              colspan: 1,
              rowspan: 1,
              value: [{ value: 'def' }]
            }
          ]
        }
      ]
    }
  ]
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    options,
    {
      header: [{ value: '\n' }],
      main,
      footer: [{ value: '\n' }]
    },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render({ isLazy: false, isSubmitHistory: false })
  const tableIndex = draw
    .getOriginalMainElementList()
    .findIndex(element => element.type === ElementType.TABLE)
  const table = draw.getOriginalMainElementList()[tableIndex]
  const range = {
    startIndex: 1,
    endIndex: 1,
    tableId: table.id,
    startTrIndex: 0,
    startTdIndex: 0,
    endTrIndex: 0,
    endTdIndex: 0
  }
  draw.getPosition().setPositionContext({
    isTable: true,
    index: tableIndex,
    trIndex: 0,
    tdIndex: 0,
    tableId: table.id
  })
  draw.getRange().setRange(1, 1, table.id, 0, 0, 0, 0)
  draw.render({
    curIndex: range.startIndex,
    isCompute: false,
    isSubmitHistory: false
  })
  draw.getTableTool().render()
  return { container, draw, table }
}

describe('TableTool direction', () => {
  let draw: Draw | null = null
  afterEach(() => {
    draw?.destroy()
    draw = null
    document.body.innerHTML = ''
  })

  it('RTL 单元格将行工具和全选按钮镜像到表格右侧', () => {
    const context = createTableDraw(TextDirection.RTL)
    draw = context.draw
    const tablePosition = draw
      .getPosition()
      .getOriginalMainPositionList()
      .find(position => position.value === '')!
    const tableX =
      tablePosition.coordinate.leftTop[0] +
      draw.getPageOffset(tablePosition.pageNo).x
    const tableRight = tableX + context.table.width!
    const rowTool = context.container.querySelector<HTMLDivElement>(
      '.ce-table-tool__row'
    )!
    const selectTool = context.container.querySelector<HTMLDivElement>(
      '.ce-table-tool__select'
    )!
    const colTool = context.container.querySelector<HTMLDivElement>(
      '.ce-table-tool__col'
    )!

    expect(parseFloat(rowTool.style.left)).toBe(tableRight)
    expect(rowTool.style.transform).toContain('translateX(18px)')
    expect(parseFloat(selectTool.style.left)).toBe(tableRight)
    expect(parseFloat(colTool.style.left)).toBe(tableX)
  })

  it('方向变化会刷新缓存并恢复 LTR 工具位置', () => {
    const context = createTableDraw(TextDirection.RTL)
    draw = context.draw
    const td = context.table.trList![0].tdList[0]
    td.value.forEach(element => {
      element.direction = TextDirection.LTR
    })
    draw.render({ isSubmitHistory: false })
    draw.getTableTool().render()

    const tablePosition = draw
      .getPosition()
      .getOriginalMainPositionList()
      .find(position => position.value === '')!
    const tableX =
      tablePosition.coordinate.leftTop[0] +
      draw.getPageOffset(tablePosition.pageNo).x
    const rowTool = context.container.querySelector<HTMLDivElement>(
      '.ce-table-tool__row'
    )!
    expect(parseFloat(rowTool.style.left)).toBe(tableX)
    expect(rowTool.style.transform).toContain('translateX(-18px)')
  })
})

describe('Table RTL pointer affinity', () => {
  let draw: Draw | null = null
  afterEach(() => {
    draw?.destroy()
    draw = null
    document.body.innerHTML = ''
  })

  it('单元格内点击保留 before/after 亲和性', () => {
    const context = createTableDraw(TextDirection.RTL)
    draw = context.draw
    const td = context.table.trList![0].tdList[0]
    td.value.forEach(element => {
      if (element.value !== '\u200B') element.value = 'ב'
    })
    draw.render({ isSubmitHistory: false })
    const target = td.positionList!.find(position => position.value === 'ב')!
    const { leftTop, rightTop, leftBottom } = target.coordinate

    const result = draw.getPosition().adjustPositionContext({
      x: leftTop[0] + (rightTop[0] - leftTop[0]) * 0.75,
      y: (leftTop[1] + leftBottom[1]) / 2,
      pageNo: target.pageNo
    })!

    expect(result.isTable).toBe(true)
    expect(result.bidiAffinity).toBe('before')
    expect(result.tdValueIndex).toBe(target.index - 1)
  })
})
