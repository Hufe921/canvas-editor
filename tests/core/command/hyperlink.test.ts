import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('超链接命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeHyperlink 插入超链接', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'link' }])
    ctx.editor.command.executeSelectAll()
    expect(() => {
      ctx.editor.command.executeHyperlink({
        url: 'https://example.com',
        valueList: [{ value: 'example' }]
      } as any)
    }).not.toThrow()
  })

  it('executeDeleteHyperlink 空操作不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executeDeleteHyperlink()).not.toThrow()
  })

  it('executeCancelHyperlink 空操作不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executeCancelHyperlink()).not.toThrow()
  })
})
