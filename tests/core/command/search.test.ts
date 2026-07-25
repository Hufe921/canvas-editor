import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('搜索替换命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeSearch 不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello world' }])
    expect(() => {
      ctx.editor.command.executeSearch('world')
    }).not.toThrow()
  })

  it('正则搜索导航按实际匹配长度计算', () => {
    ctx = createTestEditor({
      data: {
        header: [],
        main: [{ value: 'hi hello hey' }, { value: '\n' }],
        footer: []
      }
    })

    ctx.editor.command.executeSearch('h\\w+', { isRegEnable: true })
    ctx.editor.command.executeSearchNavigateNext()

    expect(ctx.editor.command.getSearchNavigateInfo()).toEqual({
      index: 1,
      count: 3
    })

    ctx.editor.command.executeSearchNavigatePre()

    expect(ctx.editor.command.getSearchNavigateInfo()).toEqual({
      index: 3,
      count: 3
    })
  })

  it('executeReplace 不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello world' }])
    expect(() => {
      ctx.editor.command.executeReplace('planet')
    }).not.toThrow()
  })

  it('留痕开启时替换为空字符串不产生非法光标', () => {
    ctx = createTestEditor({
      data: {
        header: [],
        main: [{ value: 'hello' }, { value: '\n' }],
        footer: []
      },
      options: { trace: { disabled: false } }
    })

    ctx.editor.command.executeSearch('hello')

    expect(() => {
      ctx.editor.command.executeReplace('')
    }).not.toThrow()

    const range = ctx.editor.command.getRange()
    expect(range.startIndex).toBeGreaterThanOrEqual(0)
    expect(range.endIndex).toBeGreaterThanOrEqual(0)
  })
})
