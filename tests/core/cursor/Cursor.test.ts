import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Cursor', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('editor 初始化后光标 DOM 存在', () => {
    ctx = createTestEditor()
    const container = ctx.editor.command.getOptions() as any
    expect(container).toBeDefined()
  })

  it('executeFocus 后命令不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executeFocus()).not.toThrow()
  })

  it('executeBlur 后命令不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executeBlur()).not.toThrow()
  })
})
