import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('历史命令', () => {
  let ctx: Awaited<ReturnType<typeof createTestEditor>>
  afterEach(() => ctx?.destroy())

  it('executeUndo 撤销插入', async () => {
    ctx = await createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    const before = ctx.editor.command.getText().main
    expect(before).toContain('a')
    ctx.editor.command.executeUndo()
    const after = ctx.editor.command.getText().main
    expect(after).not.toContain('a')
  })

  it('executeRedo 恢复撤销', async () => {
    ctx = await createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    ctx.editor.command.executeUndo()
    ctx.editor.command.executeRedo()
    expect(ctx.editor.command.getText().main).toContain('a')
  })

  it('undo restores the first range deletion after setValue without focus', async () => {
    ctx = await createTestEditor()
    ctx.editor.command.executeSetValue({ main: [{ value: 'A👨‍👩‍👧B' }] })
    ctx.editor.command.executeSetRange(1, 2)
    ctx.editor.command.executeBackspace()
    expect(ctx.editor.command.getText().main).toBe('AB')
    ctx.editor.command.executeUndo()
    expect(ctx.editor.command.getText().main).toBe('A👨‍👩‍👧B')
    ctx.editor.command.executeRedo()
    expect(ctx.editor.command.getText().main).toBe('AB')
  })

  it('空 editor 调用 undo / redo 不抛错', async () => {
    ctx = await createTestEditor()
    expect(() => ctx.editor.command.executeUndo()).not.toThrow()
    expect(() => ctx.editor.command.executeRedo()).not.toThrow()
  })
})
