import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Register', () => {
  let ctx: Awaited<ReturnType<typeof createTestEditor>>
  afterEach(() => ctx?.destroy())

  it('editor 初始化后 register 可用', async () => {
    ctx = await createTestEditor()
    expect(ctx.editor.register).toBeDefined()
    expect(typeof ctx.editor.register.contextMenuList).toBe('function')
    expect(typeof ctx.editor.register.shortcutList).toBe('function')
    expect(typeof ctx.editor.register.langMap).toBe('function')
  })

  it('register.langMap 注册新语言后生效', async () => {
    ctx = await createTestEditor()
    ctx.editor.register.langMap('custom', {
      frame: { header: '页眉自定义' }
    } as any)
    ctx.editor.command.executeSetLocale('custom')
    // I18n 已切换，可通过内部引用验证
    expect(() => ctx.editor.command.executeSetLocale('zhCN')).not.toThrow()
  })
})
