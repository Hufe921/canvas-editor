import { describe, it, expect, afterEach } from 'vitest'
import { EditorMode } from '../../../src/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'

describe('边界命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('空 editor 调用 executeBackspace 不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    expect(() => ctx.editor.command.executeBackspace()).not.toThrow()
  })

  it('空 editor 调用 executeBold 不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    expect(() => ctx.editor.command.executeBold()).not.toThrow()
  })

  it('越界 setRange 被 clamp 或忽略', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'a' }])
    expect(() => ctx.editor.command.executeSetRange(0, 9999)).not.toThrow()
  })

  it('mode 切换后 getter 不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeMode(EditorMode.READONLY)
    expect(() => ctx.editor.command.getValue()).not.toThrow()
    expect(() => ctx.editor.command.getText()).not.toThrow()
    expect(() => ctx.editor.command.getOptions()).not.toThrow()
  })

  it('重复 destroy 幂等', () => {
    ctx = createTestEditor()
    ctx.editor.destroy()
    expect(() => ctx.editor.destroy()).not.toThrow()
  })
})
