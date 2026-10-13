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

  it('displayOnly 仅移除写入交互并保留 DSL 展示配置', () => {
    ctx = createTestEditor({
      options: {
        displayOnly: true,
        mode: 'readonly' as any,
        ruler: { disabled: false }
      }
    })
    expect(ctx.container.querySelector('.ce-inputarea')).toBeNull()
    expect(ctx.container.querySelector('.ce-cursor')).toBeNull()
    expect(ctx.editor.command.getOptions().ruler.disabled).toBe(false)
  })

  it('readonly 不注册编辑菜单和快捷键', () => {
    ctx = createTestEditor({ options: { mode: 'readonly' as any } })
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    ctx.container.querySelector('.ce-page-container')?.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(ctx.container.querySelector('.ce-contextmenu-container')).toBeNull()
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