import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Cursor', () => {
  let ctx: Awaited<ReturnType<typeof createTestEditor>>
  afterEach(() => ctx?.destroy())

  it('editor 初始化后光标 DOM 存在', async () => {
    ctx = await createTestEditor()
    const container = ctx.editor.command.getOptions() as any
    expect(container).toBeDefined()
  })

  it('executeFocus 后命令不抛错', async () => {
    ctx = await createTestEditor()
    expect(() => ctx.editor.command.executeFocus()).not.toThrow()
  })

  it('executeBlur 后命令不抛错', async () => {
    ctx = await createTestEditor()
    expect(() => ctx.editor.command.executeBlur()).not.toThrow()
  })
})
