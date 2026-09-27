import { describe, it, expect, afterEach } from 'vitest'
import { ListType } from '../../../src/editor/dataset/enum/List'
import { TitleLevel } from '../../../src/editor/dataset/enum/Title'
import { RowFlex } from '../../../src/editor/dataset/enum/Row'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { createTestEditor } from '../../factories/editor'

describe('列表与排版命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeList 设置无序列表', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'item' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeList(ListType.UL)
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.listType === 'ul')).toBe(true)
  })

  it('executeList 设置有序列表', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'item' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeList(ListType.OL)
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.listType === 'ol')).toBe(true)
  })

  it('executeTitle 设置标题级别', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'title' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeTitle(TitleLevel.FIRST)
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.level === 'first')).toBe(true)
  })

  it('executeRowFlex 设置对齐方式', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'text' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeRowFlex(RowFlex.CENTER)
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.rowFlex === 'center')).toBe(true)
  })

  it('executeRowFlex 按段落设置表格内自动换行内容', () => {
    const tableId = 'table'
    ctx = createTestEditor({
      data: [
        {
          id: tableId,
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 100 }],
          trList: [
            {
              height: 40,
              tdList: [
                {
                  id: 'td',
                  colspan: 1,
                  rowspan: 1,
                  value: [
                    {
                      value: '1234567890123456789012345678901234567890'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
    ctx.editor.command.executeSetPositionContext({
      startIndex: 20,
      endIndex: 20,
      tableId,
      startTrIndex: 0,
      startTdIndex: 0
    })
    ctx.editor.command.executeSetRange(20, 20)
    ctx.editor.command.executeRowFlex(RowFlex.RIGHT)
    ctx.editor.command.executeRowMargin(2)

    const data = ctx.editor.command.getValue().data.main
    const table = data.find(element => element.type === ElementType.TABLE)!
    const value = table.trList![0].tdList[0].value

    expect(value.every(element => element.rowFlex === RowFlex.RIGHT)).toBe(true)
    expect(value.every(element => element.rowMargin === 2)).toBe(true)
  })

  it('executeRowFlex 不影响未选中的段落', () => {
    ctx = createTestEditor({
      data: [{ value: 'first' }, { value: '\n' }, { value: 'second' }]
    })
    ctx.editor.command.executeSetRange(8, 8)
    ctx.editor.command.executeRowFlex(RowFlex.RIGHT)

    const data = ctx.editor.command.getValue().data.main
    const first = data.find(element => element.value.includes('first'))!
    const second = data.find(element => element.value.includes('second'))!

    expect(first.rowFlex).toBeUndefined()
    expect(second.rowFlex).toBe(RowFlex.RIGHT)
  })
})
