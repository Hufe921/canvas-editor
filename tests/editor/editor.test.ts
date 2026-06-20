import { describe, it, expect, afterEach, vi } from 'vitest'
import { createTestEditor } from '../factories/editor'

describe('Editor 入口', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('实例化后基础属性存在', () => {
    ctx = createTestEditor()
    expect(ctx.editor.command).toBeTruthy()
    expect(ctx.editor.listener).toBeTruthy()
    expect(ctx.editor.eventBus).toBeTruthy()
    expect(ctx.editor.register).toBeTruthy()
    expect(ctx.editor.version).toBeTruthy()
  })

  it('use(plugin) 调用插件', () => {
    ctx = createTestEditor()
    const plugin = vi.fn()
    ctx.editor.use(plugin)
    expect(plugin).toHaveBeenCalledTimes(1)
    expect(plugin).toHaveBeenCalledWith(ctx.editor, undefined)
  })

  it('destroy 不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.destroy()).not.toThrow()
  })

  it('重复 destroy 不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.destroy()
    expect(() => ctx.editor.destroy()).not.toThrow()
  })
})