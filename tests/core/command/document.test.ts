import { describe, it, expect, afterEach } from 'vitest'
import { EditorMode } from '../../../src/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'

describe('文档级命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeSetValue 替换全部内容', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSetValue({ main: [{ value: 'world' }] })
    expect(ctx.editor.command.getText().main).toContain('world')
  })

  it('executeMode readonly 后 executeBold 被忽略', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeMode(EditorMode.READONLY)
    ctx.editor.command.executeBold()
    const data = ctx.editor.command.getValue().data.main
    expect(data?.some((e: any) => e.bold)).toBe(false)
  })

  it('executePageScaleAdd / Recovery 改变 scale', () => {
    ctx = createTestEditor()
    const before = ctx.editor.command.getOptions().scale
    ctx.editor.command.executePageScaleAdd()
    const after = ctx.editor.command.getOptions().scale
    expect(after).toBeGreaterThan(before)
    ctx.editor.command.executePageScaleRecovery()
    expect(ctx.editor.command.getOptions().scale).toBe(before)
  })

  it('executePrint 不抛错', () => {
    ctx = createTestEditor()
    expect(() => ctx.editor.command.executePrint()).not.toThrow()
  })

  it('#1406 readonly 下 setGroup / deleteGroup 仍生效', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello' }])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeMode(EditorMode.READONLY)
    expect(() => {
      ctx.editor.command.executeSetGroup()
    }).not.toThrow()
    expect(() => {
      ctx.editor.command.executeDeleteGroup('g1')
    }).not.toThrow()
  })
})
