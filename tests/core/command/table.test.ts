import { describe, it, expect, afterEach } from 'vitest'
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
})
