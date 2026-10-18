import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('Getter 命令', () => {
  let ctx: Awaited<ReturnType<typeof createTestEditor>>
  afterEach(() => ctx?.destroy())

  it('getValue 返回数据结构', async () => {
    ctx = await createTestEditor()
    const value = ctx.editor.command.getValue()
    expect(value).toHaveProperty('data')
    expect(value.data).toHaveProperty('main')
  })

  it('getText 返回纯文本', async () => {
    ctx = await createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    const text = ctx.editor.command.getText()
    expect(text.main).toContain('hello')
  })

  it('getHTML 返回 HTML 对象', async () => {
    ctx = await createTestEditor()
    const html = ctx.editor.command.getHTML()
    expect(html).toHaveProperty('header')
    expect(html).toHaveProperty('main')
    expect(html).toHaveProperty('footer')
  })

  it('getOptions 返回配置对象', async () => {
    ctx = await createTestEditor()
    const options = ctx.editor.command.getOptions()
    expect(options).toBeTruthy()
    expect(options).toHaveProperty('width')
  })

  it('getCursorPosition 返回位置对象', async () => {
    ctx = await createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSetRange(3, 3)
    const pos = ctx.editor.command.getCursorPosition()
    expect(pos).toBeTruthy()
  })

  it('getPaperMargin 返回 4 长度数组', async () => {
    ctx = await createTestEditor()
    const margin = ctx.editor.command.getPaperMargin()
    expect(Array.isArray(margin)).toBe(true)
    expect(margin.length).toBe(4)
  })

  it('getRemainingContentHeight 返回数字', async () => {
    ctx = await createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    const height = ctx.editor.command.getRemainingContentHeight()
    expect(typeof height).toBe('number')
  })

  it('getContainer 返回 DOM', async () => {
    ctx = await createTestEditor()
    const container = ctx.editor.command.getContainer()
    expect(container).toBeTruthy()
  })
})
