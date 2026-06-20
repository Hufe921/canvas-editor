import { describe, it, expect, afterEach } from 'vitest'
import { EditorZone } from '../../../src/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'

describe('Zone 命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('默认 zone 配置存在', () => {
    ctx = createTestEditor()
    expect(ctx.editor.command.getOptions().zone).toBeDefined()
  })

  it('executeSetZone 切换 zone 不抛错', () => {
    ctx = createTestEditor()
    expect(() => {
      ctx.editor.command.executeSetZone(EditorZone.HEADER)
    }).not.toThrow()
    expect(() => {
      ctx.editor.command.executeSetZone(EditorZone.MAIN)
    }).not.toThrow()
    expect(() => {
      ctx.editor.command.executeSetZone(EditorZone.FOOTER)
    }).not.toThrow()
  })
})
