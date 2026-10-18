import { describe, it, expect, afterEach, vi } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Plugin', () => {
  let ctx: Awaited<ReturnType<typeof createTestEditor>>
  afterEach(() => ctx?.destroy())

  it('use(plugin) 调用插件并传入 editor', async () => {
    ctx = await createTestEditor()
    const plugin = vi.fn()
    ctx.editor.use(plugin)
    expect(plugin).toHaveBeenCalledTimes(1)
    expect(plugin).toHaveBeenCalledWith(ctx.editor, undefined)
  })

  it('plugin 中可调用 command', async () => {
    ctx = await createTestEditor()
    let called = false
    const plugin = (editor: any) => {
      editor.command.executeFocus()
      called = true
    }
    ctx.editor.use(plugin)
    expect(called).toBe(true)
  })
})
