import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('HistoryManager', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('undo 后回到上一个快照', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    ctx.editor.command.executeInsertElementList([{ value: 'b' }])
    ctx.editor.command.executeUndo()
    const text = ctx.editor.command.getText().main
    expect(text).not.toContain('b')
  })

  it('redo 后恢复撤销的内容', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    ctx.editor.command.executeInsertElementList([{ value: 'b' }])
    ctx.editor.command.executeUndo()
    ctx.editor.command.executeRedo()
    const text = ctx.editor.command.getText().main
    expect(text).toContain('b')
  })

  it('空栈 undo 不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executeUndo()).not.toThrow()
  })

  it('空栈 redo 不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executeRedo()).not.toThrow()
  })

  it('多步 undo 逐步还原', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    ctx.editor.command.executeInsertElementList([{ value: 'b' }])
    ctx.editor.command.executeInsertElementList([{ value: 'c' }])
    ctx.editor.command.executeUndo()
    ctx.editor.command.executeUndo()
    const text = ctx.editor.command.getText().main
    expect(text).toContain('a')
    expect(text).not.toContain('b')
    expect(text).not.toContain('c')
  })
})