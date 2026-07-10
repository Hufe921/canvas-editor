import { describe, it, expect, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { createTestEditor } from '../../factories/editor'

function createComplexTableDraw() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({ width: 794, height: 1123 })
  const main = [
    {
      type: 'table' as any,
      value: '',
      colgroup: [
        { width: 100 },
        { width: 100 },
        { width: 100 },
        { width: 100 }
      ],
      trList: [
        {
          height: 40,
          tdList: [
            {
              colspan: 3,
              rowspan: 1,
              value: [{ value: 'header' }]
            },
            {
              colspan: 1,
              rowspan: 3,
              value: [{ value: 'detail' }]
            }
          ]
        },
        {
          height: 40,
          tdList: [
            {
              colspan: 1,
              rowspan: 2,
              value: [{ value: 'anchor' }]
            },
            {
              colspan: 2,
              rowspan: 1,
              value: [{ value: 'group' }]
            }
          ]
        },
        {
          height: 40,
          tdList: [
            {
              colspan: 1,
              rowspan: 1,
              value: [{ value: 'child-b' }]
            },
            {
              colspan: 1,
              rowspan: 1,
              value: [{ value: 'child-c' }]
            }
          ]
        },
        {
          height: 40,
          tdList: ['body-a', 'body-b', 'body-c', 'body-d'].map(value => ({
            colspan: 1,
            rowspan: 1,
            value: [{ value }]
          }))
        }
      ]
    },
    { value: '\n' }
  ]
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
  const originalElementList = draw.getOriginalElementList()
  const tableIndex = originalElementList.findIndex(
    element => element.type === 'table'
  )
  const table = originalElementList[tableIndex] as any

  return {
    draw,
    table,
    tableIndex,
    destroy: () => {
      draw.destroy()
      container.remove()
    }
  }
}

function getTdText(td: any) {
  return td.value.map((element: any) => element.value).join('')
}

function getTdByText(table: any, value: string) {
  for (const tr of table.trList) {
    const td = tr.tdList.find((item: any) => getTdText(item).includes(value))
    if (td) return td
  }
  throw new Error(`Table cell not found: ${value}`)
}

function selectTableCell(
  draw: Draw,
  table: any,
  tableIndex: number,
  value: string
) {
  for (let trIndex = 0; trIndex < table.trList.length; trIndex++) {
    const tr = table.trList[trIndex]
    const tdIndex = tr.tdList.findIndex((td: any) =>
      getTdText(td).includes(value)
    )
    if (~tdIndex) {
      const td = tr.tdList[tdIndex]
      draw.getPosition().setPositionContext({
        isTable: true,
        index: tableIndex,
        trIndex,
        tdIndex,
        tdId: td.id,
        trId: tr.id,
        tableId: table.id
      })
      return
    }
  }
  throw new Error(`Table cell not found: ${value}`)
}

describe('表格与分隔命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeInsertTable 传入行列参数不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    expect(() => {
      ctx.editor.command.executeInsertTable(2, 2)
    }).not.toThrow()
  })

  it('executeSeparator 插入分隔符', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeSeparator([1, 1])
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.type === 'separator')).toBe(true)
  })

  it('executePageBreak 插入分页符', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executePageBreak()
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.type === 'pageBreak')).toBe(true)
  })

  it('嵌套表格点击可定位到最内层单元格', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const options = mergeOption({ width: 794, height: 1123 })
    const main = [
      {
        type: 'table' as any,
        value: '',
        colgroup: [{ width: 200 }],
        trList: [
          {
            height: 120,
            tdList: [
              {
                colspan: 1,
                rowspan: 1,
                value: [
                  {
                    type: 'table' as any,
                    value: '',
                    colgroup: [{ width: 120 }],
                    trList: [
                      {
                        height: 60,
                        tdList: [
                          {
                            colspan: 1,
                            rowspan: 1,
                            value: [{ value: '\n' }, { value: 'A' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      { value: '\n' }
    ]
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

    const originalElementList = draw.getOriginalElementList()
    const outerTableIndex = originalElementList.findIndex(
      (element: any) => element.type === 'table'
    )
    const outerTable = originalElementList[outerTableIndex]
    const innerTable = outerTable.trList![0].tdList[0].value.find(
      (element: any) => element.type === 'table'
    )!
    const innerTextPosition = innerTable.trList![0].tdList[0].positionList![1]
    const [x, y] = innerTextPosition.coordinate.leftTop

    const result = draw.getPosition().adjustPositionContext({ x, y })

    expect(result?.isTable).toBe(true)
    expect(draw.getPosition().getPositionContext().tableId).toBe(innerTable.id)
    expect(
      draw.getElementList().some((element: any) => element.value === 'A')
    ).toBe(true)

    draw.render({
      curIndex: result!.tdValueIndex,
      isCompute: false,
      isSubmitHistory: false
    })
    expect(draw.getPosition().getCursorPosition()).toBe(
      innerTable.trList![0].tdList[0].positionList![result!.tdValueIndex!]
    )

    draw.destroy()
    container.remove()
  })

  it('嵌套表格合并单元格只作用于当前内层表格', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const options = mergeOption({ width: 794, height: 1123 })
    const main = [
      {
        type: 'table' as any,
        value: '',
        colgroup: [{ width: 260 }],
        trList: [
          {
            height: 140,
            tdList: [
              {
                colspan: 1,
                rowspan: 1,
                value: [
                  {
                    type: 'table' as any,
                    value: '',
                    colgroup: [{ width: 100 }, { width: 100 }],
                    trList: [
                      {
                        height: 60,
                        tdList: [
                          {
                            colspan: 1,
                            rowspan: 1,
                            value: [{ value: '\n' }, { value: 'A' }]
                          },
                          {
                            colspan: 1,
                            rowspan: 1,
                            value: [{ value: '\n' }, { value: 'B' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      { value: '\n' }
    ]
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

    const originalElementList = draw.getOriginalElementList()
    const outerTableIndex = originalElementList.findIndex(
      (element: any) => element.type === 'table'
    )
    const outerTable = originalElementList[outerTableIndex]
    const outerTd = outerTable.trList![0].tdList[0]
    const innerTableIndex = outerTd.value.findIndex(
      (element: any) => element.type === 'table'
    )
    const innerTable = outerTd.value[innerTableIndex]
    const innerFirstTd = innerTable.trList![0].tdList[0]

    draw.getPosition().setPositionContext({
      isTable: true,
      index: outerTableIndex,
      trIndex: 0,
      tdIndex: 0,
      tdId: innerFirstTd.id,
      trId: innerTable.trList![0].id,
      tableId: innerTable.id,
      tablePath: [
        {
          index: outerTableIndex,
          trIndex: 0,
          tdIndex: 0,
          tdId: outerTd.id,
          trId: outerTable.trList![0].id,
          tableId: outerTable.id
        },
        {
          index: innerTableIndex,
          trIndex: 0,
          tdIndex: 0,
          tdId: innerFirstTd.id,
          trId: innerTable.trList![0].id,
          tableId: innerTable.id
        }
      ]
    })
    draw.getRange().setRange(0, 0, innerTable.id, 0, 1, 0, 0)

    draw.getTableOperate().mergeTableCell()

    expect(innerTable.trList![0].tdList).toHaveLength(1)
    expect(innerTable.trList![0].tdList[0].colspan).toBe(2)
    expect(
      innerTable.trList![0].tdList[0].value.some(
        (element: any) => element.value === 'B'
      )
    ).toBe(true)
    expect(outerTable.trList![0].tdList).toHaveLength(1)
    expect(outerTable.trList![0].tdList[0].colspan).toBe(1)
    expect(draw.getPosition().getPositionContext().tableId).toBe(innerTable.id)
    expect(
      draw.getPosition().getPositionContext().tablePath?.at(-1)?.tableId
    ).toBe(innerTable.id)

    draw.destroy()
    container.remove()
  })

  it('嵌套表格插列只修改内层表格并保留定位路径', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const options = mergeOption({ width: 794, height: 1123 })
    const main = [
      {
        type: 'table' as any,
        value: '',
        colgroup: [{ width: 260 }],
        trList: [
          {
            height: 140,
            tdList: [
              {
                colspan: 1,
                rowspan: 1,
                value: [
                  {
                    type: 'table' as any,
                    value: '',
                    colgroup: [{ width: 100 }, { width: 100 }],
                    trList: [
                      {
                        height: 60,
                        tdList: [
                          {
                            colspan: 1,
                            rowspan: 1,
                            value: [{ value: '\n' }, { value: 'A' }]
                          },
                          {
                            colspan: 1,
                            rowspan: 1,
                            value: [{ value: '\n' }, { value: 'B' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      { value: '\n' }
    ]
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

    const originalElementList = draw.getOriginalElementList()
    const outerTableIndex = originalElementList.findIndex(
      (element: any) => element.type === 'table'
    )
    const outerTable = originalElementList[outerTableIndex]
    const outerTd = outerTable.trList![0].tdList[0]
    const innerTableIndex = outerTd.value.findIndex(
      (element: any) => element.type === 'table'
    )
    const innerTable = outerTd.value[innerTableIndex]
    const innerFirstTd = innerTable.trList![0].tdList[0]
    draw.getPosition().setPositionContext({
      isTable: true,
      index: outerTableIndex,
      trIndex: 0,
      tdIndex: 0,
      tdId: innerFirstTd.id,
      trId: innerTable.trList![0].id,
      tableId: innerTable.id,
      tablePath: [
        {
          index: outerTableIndex,
          trIndex: 0,
          tdIndex: 0,
          tdId: outerTd.id,
          trId: outerTable.trList![0].id,
          tableId: outerTable.id
        },
        {
          index: innerTableIndex,
          trIndex: 0,
          tdIndex: 0,
          tdId: innerFirstTd.id,
          trId: innerTable.trList![0].id,
          tableId: innerTable.id
        }
      ]
    })

    draw.getTableOperate().insertTableRightCol()

    expect(innerTable.colgroup).toHaveLength(3)
    expect(outerTable.colgroup).toHaveLength(1)
    expect(draw.getPosition().getPositionContext().tableId).toBe(innerTable.id)
    expect(
      draw.getPosition().getPositionContext().tablePath?.at(-1)?.tableId
    ).toBe(innerTable.id)

    draw.destroy()
    container.remove()
  })

  it('复杂合并表头最右侧插列时保持原单元格逻辑列位置', () => {
    const { draw, table, tableIndex, destroy } = createComplexTableDraw()
    selectTableCell(draw, table, tableIndex, 'detail')

    draw.getTableOperate().insertTableRightCol()

    expect(table.colgroup).toHaveLength(5)
    expect(getTdByText(table, 'detail').colIndex).toBe(3)
    for (let colIndex = 0; colIndex < 4; colIndex++) {
      expect(getTdByText(table, `body-${'abcd'[colIndex]}`).colIndex).toBe(
        colIndex
      )
    }
    expect(table.trList[3].tdList).toHaveLength(5)
    expect(table.trList[3].tdList[4].colIndex).toBe(4)

    destroy()
  })

  it('插列边界穿过横向合并单元格时扩展 colspan', () => {
    const { draw, table, tableIndex, destroy } = createComplexTableDraw()
    selectTableCell(draw, table, tableIndex, 'anchor')

    draw.getTableOperate().insertTableRightCol()

    expect(table.colgroup).toHaveLength(5)
    expect(getTdByText(table, 'header').colspan).toBe(4)
    expect(getTdByText(table, 'detail').colIndex).toBe(4)
    expect(getTdByText(table, 'group').colIndex).toBe(2)
    expect(getTdByText(table, 'body-b').colIndex).toBe(2)

    destroy()
  })

  it('复杂合并表头左侧插列时使用逻辑列边界', () => {
    const { draw, table, tableIndex, destroy } = createComplexTableDraw()
    selectTableCell(draw, table, tableIndex, 'body-c')

    draw.getTableOperate().insertTableLeftCol()

    expect(table.colgroup).toHaveLength(5)
    expect(getTdByText(table, 'header').colspan).toBe(4)
    expect(getTdByText(table, 'group').colspan).toBe(3)
    expect(getTdByText(table, 'detail').colIndex).toBe(4)
    expect(getTdByText(table, 'child-c').colIndex).toBe(3)
    expect(getTdByText(table, 'body-d').colIndex).toBe(4)

    destroy()
  })

  it('纵向合并单元格下方插行时按实际行边界新增普通行', () => {
    const { draw, table, tableIndex, destroy } = createComplexTableDraw()
    selectTableCell(draw, table, tableIndex, 'detail')

    draw.getTableOperate().insertTableBottomRow()

    expect(table.trList).toHaveLength(5)
    expect(getTdByText(table, 'detail').rowspan).toBe(3)
    expect(getTdByText(table, 'body-a').rowIndex).toBe(4)
    expect(table.trList[3].tdList).toHaveLength(4)
    expect(
      table.trList[3].tdList.every(
        (td: any) => td.rowspan === 1 && td.colspan === 1
      )
    ).toBe(true)

    destroy()
  })

  it('复杂合并表头上方插行时新增由普通单元格组成的行', () => {
    const { draw, table, tableIndex, destroy } = createComplexTableDraw()
    selectTableCell(draw, table, tableIndex, 'header')

    draw.getTableOperate().insertTableTopRow()

    expect(table.trList).toHaveLength(5)
    expect(table.trList[0].tdList).toHaveLength(4)
    expect(
      table.trList[0].tdList.every(
        (td: any) => td.rowspan === 1 && td.colspan === 1
      )
    ).toBe(true)
    expect(getTdByText(table, 'header').rowIndex).toBe(1)

    destroy()
  })

  it('插行边界穿过纵向合并单元格时扩展 rowspan', () => {
    const { draw, table, tableIndex, destroy } = createComplexTableDraw()
    selectTableCell(draw, table, tableIndex, 'anchor')

    draw.getTableOperate().insertTableTopRow()

    expect(table.trList).toHaveLength(5)
    expect(getTdByText(table, 'detail').rowspan).toBe(4)
    expect(getTdByText(table, 'anchor').rowIndex).toBe(2)
    expect(table.trList[1].tdList).toHaveLength(3)
    expect(
      table.trList[1].tdList.every(
        (td: any) => td.rowspan === 1 && td.colspan === 1
      )
    ).toBe(true)

    destroy()
  })
})
