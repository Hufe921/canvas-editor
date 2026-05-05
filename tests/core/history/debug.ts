import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Backspace debug', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('debug backspace', () => {
    ctx = createTestEditor()
    console.log('range:', JSON.stringify(ctx.editor.command.getRange()))
    console.log('text:', JSON.stringify(ctx.editor.command.getText().main))
    console.log('value main:', JSON.stringify(ctx.editor.command.getValue().data.main?.map((e: any) => e.value)))
    expect(() => ctx.editor.command.executeBackspace()).not.toThrow()
  })
})
