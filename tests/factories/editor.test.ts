import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from './editor'

describe('createTestEditor 工厂', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('返回可用 editor 实例', () => {
    ctx = createTestEditor()
    expect(ctx.editor).toBeTruthy()
    expect(ctx.editor.command).toBeTruthy()
    expect(typeof ctx.editor.command.executeInsertElementList).toBe('function')
  })

  it('container 自动挂载到 body', () => {
    ctx = createTestEditor()
    expect(document.body.contains(ctx.container)).toBe(true)
  })

  it('destroy 后 container 从 body 移除', () => {
    ctx = createTestEditor()
    ctx.destroy()
    expect(document.body.contains(ctx.container)).toBe(false)
  })

  it('能接受自定义 data', () => {
    ctx = createTestEditor({
      data: { header: [], main: [{ value: 'hello' }, { value: '\n' }], footer: [] }
    })
    const text = ctx.editor.command.getText().main
    expect(text).toContain('hello')
  })
})
