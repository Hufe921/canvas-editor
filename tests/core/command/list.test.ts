import { describe, it, expect, afterEach } from 'vitest'
import { ListType } from '../../../src/editor/dataset/enum/List'
import { TitleLevel } from '../../../src/editor/dataset/enum/Title'
import { RowFlex } from '../../../src/editor/dataset/enum/Row'
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
})
