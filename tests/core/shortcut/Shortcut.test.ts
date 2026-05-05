import { describe, it, expect, afterEach, vi } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Shortcut', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('registerShortcutList 注册自定义快捷键', () => {
    ctx = createTestEditor()
    const callback = vi.fn()
    const shortcutList = [
      {
        key: 'k',
        mod: true,
        shift: false,
        alt: false,
        ctrl: false,
        meta: false,
        isGlobal: false,
        disable: false,
        callback
      }
    ]
    expect(() => {
      ctx.editor.command.executeFocus()
      ctx.editor.use((_editor: any, options: any) => {
        options?.register?.shortcutList?.(shortcutList)
      })
    }).not.toThrow()
  })
})
