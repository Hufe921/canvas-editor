import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('格式化命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeFormat 清除样式', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello', bold: true, italic: true }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeFormat()
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.bold || e.italic)).toBe(false)
  })

  it('executeFont 改变字体', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeFont('Arial')
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.font === 'Arial')).toBe(true)
  })

  it('executeSize 改变字号', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeSize(20)
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.size === 20)).toBe(true)
  })

  it('executeColor 改变颜色', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeColor('#ff0000')
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.color === '#ff0000')).toBe(true)
  })

  it('executeHighlight 改变高亮', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeHighlight('#ffff00')
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.highlight === '#ffff00')).toBe(true)
  })
})
