import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Backspace debug', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('debug backspace after selectAll', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    console.log('after focus range:', JSON.stringify(ctx.editor.command.getRange()))
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    console.log('after insert range:', JSON.stringify(ctx.editor.command.getRange()))
    ctx.editor.command.executeSelectAll()
    console.log('after selectAll range:', JSON.stringify(ctx.editor.command.getRange()))
    ctx.editor.command.executeBackspace()
    console.log('after backspace range:', JSON.stringify(ctx.editor.command.getRange()))
    console.log('after backspace text:', JSON.stringify(ctx.editor.command.getText().main))
    console.log('after backspace value:', JSON.stringify(ctx.editor.command.getValue().data.main?.map((e: any) => e.value)))
    expect(true).toBe(true)
  })
})
