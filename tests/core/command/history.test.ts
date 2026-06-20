import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('历史命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeUndo 撤销插入', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    const before = ctx.editor.command.getText().main
    expect(before).toContain('a')
    ctx.editor.command.executeUndo()
    const after = ctx.editor.command.getText().main
    expect(after).not.toContain('a')
  })

  it('executeRedo 恢复撤销', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    ctx.editor.command.executeUndo()
    ctx.editor.command.executeRedo()
    expect(ctx.editor.command.getText().main).toContain('a')
  })

  it('空 editor 调用 undo / redo 不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executeUndo()).not.toThrow()
    expect(() => ctx.editor.command.executeRedo()).not.toThrow()
  })
})
