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

  it.each([
    ['\\S+', 'alpha 123 beta', 3, '_ _ _'],
    ['\\D+', 'ab12cd34', 2, '_12_34'],
    ['b\\W+', 'ab!12?cd', 1, 'a_12?cd']
  ] as const)('忽略大小写保留正则 %s 的含义', (pattern, text, count, expected) => {
    ctx = createTestEditor({ data: [{ value: text }] })

    ctx.editor.command.executeSearch(pattern, { isRegEnable: true })

    expect(ctx.editor.command.getSearchNavigateInfo()).toEqual({
      index: 0,
      count
    })

    ctx.editor.command.executeReplace('_')

    expect(ctx.editor.command.getText().main).toBe(expected)
  })

  it.each([
    [true, true, 3, '_ _ _'],
    [true, false, 1, '_ alpha ALPHA'],
    [false, true, 3, '_ _ _'],
    [false, false, 1, '_ alpha ALPHA']
  ] as const)(
    '搜索大小写选项生效（正则 %s，忽略大小写 %s）',
    (isRegEnable, isIgnoreCase, count, expected) => {
      ctx = createTestEditor({ data: [{ value: 'Alpha alpha ALPHA' }] })

      ctx.editor.command.executeSearch('Alpha', { isRegEnable, isIgnoreCase })

      expect(ctx.editor.command.getSearchNavigateInfo()).toEqual({
        index: 0,
        count
      })

      ctx.editor.command.executeReplace('_')

      expect(ctx.editor.command.getText().main).toBe(expected)
    }
  )

  it('正则忽略大小写时保留原文的匹配位置', () => {
    ctx = createTestEditor({ data: [{ value: 'İabc' }] })

    ctx.editor.command.executeSearch('ABC', { isRegEnable: true })
    ctx.editor.command.executeReplace('_')

    expect(ctx.editor.command.getText().main).toBe('İ_')
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
