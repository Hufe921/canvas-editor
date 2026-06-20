import { describe, it, expect, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { createTestEditor } from '../../factories/editor'

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
})
