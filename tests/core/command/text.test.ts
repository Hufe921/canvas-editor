import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('文本与选区命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeInsertElementList 插入元素', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    expect(ctx.editor.command.getText().main).toContain('hello')
  })

  it('executeBackspace 从空状态开始能多次调用', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    expect(() => ctx.editor.command.executeBackspace()).not.toThrow()
    expect(() => ctx.editor.command.executeBackspace()).not.toThrow()
  })

  it('executeSelectAll + executeBackspace 清空 main', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeBackspace()
    const text = ctx.editor.command.getText().main
    expect(text).toBe('')
  })

  it('executeSetRange 后 getRangeText 返回正确文本', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([
      { value: 'hello world' }
    ])
    ctx.editor.command.executeSetRange(1, 6)
    const rangeText = ctx.editor.command.getRangeText()
    expect(rangeText).toBe('hello')
  })
})