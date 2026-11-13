import { afterEach, describe, expect, it, vi } from 'vitest'
import * as elements from '../../../src/editor/utils/element'
import { createTestEditor, waitMacroTask } from '../../factories/editor'

describe('disabled history snapshots', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => { ctx?.destroy(); vi.restoreAllMocks() })

  it('keeps edits and content events without cloning body or stories', async () => {
    const clone = vi.spyOn(elements, 'getSlimCloneElementList')
    ctx = createTestEditor({
      options: { historyMaxRecordCount: 0 },
      data: {
        main: [{ value: 'body' }],
        header: [{ value: 'header' }],
        footer: [{ value: 'footer' }]
      }
    })
    const changed = vi.fn()
    ctx.editor.listener.contentChange = changed
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'new' }])
    await waitMacroTask()
    expect(changed).toHaveBeenCalled()
    expect(clone).not.toHaveBeenCalled()
    const before = ctx.editor.command.getValue().data
    ctx.editor.command.executeUndo()
    ctx.editor.command.executeRedo()
    expect(ctx.editor.command.getValue().data).toEqual(before)
    expect(ctx.editor.command.getText().main).toContain('new')
    expect(ctx.editor.command.getText().header).toBe('header')
    expect(ctx.editor.command.getText().footer).toBe('footer')
  })

  it('retains snapshots and working undo when the limit is positive', () => {
    const clone = vi.spyOn(elements, 'getSlimCloneElementList')
    ctx = createTestEditor({options: {historyMaxRecordCount: 2}})
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{value: 'new'}])
    expect(clone).toHaveBeenCalled()
    ctx.editor.command.executeUndo()
    expect(ctx.editor.command.getText().main).not.toContain('new')
    ctx.editor.command.executeRedo()
    expect(ctx.editor.command.getText().main).toContain('new')
  })
})
