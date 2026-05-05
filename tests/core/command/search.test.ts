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

  it('executeReplace 不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello world' }])
    expect(() => {
      ctx.editor.command.executeReplace('planet')
    }).not.toThrow()
  })
})
