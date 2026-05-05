import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('样式命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeBold 设置选中文本粗体', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeBold()
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.bold)).toBe(true)
  })

  it('executeColor 设置颜色', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeColor('#f00')
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.color === '#f00')).toBe(true)
  })

  it('executeSize 设置字号', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeSize(24)
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.size === 24)).toBe(true)
  })

  it('cfa6ae0 回归:越界 endIndex 调用不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    expect(() => {
      ctx.editor.command.executeSetRange(0, 9999)
      ctx.editor.command.executeBold()
    }).not.toThrow()
  })
})