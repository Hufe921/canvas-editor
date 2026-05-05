import { describe, it, expect, afterEach } from 'vitest'
import { ControlType } from '../../../src/editor/dataset/enum/Control'
import { createTestEditor } from '../../factories/editor'

describe('控件命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeInsertControl 插入文本控件不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    expect(() => {
      ctx.editor.command.executeInsertControl({
        value: '',
        control: {
          type: ControlType.TEXT,
          value: null
        }
      })
    }).not.toThrow()
  })

  it('executeInsertControl 插入带值的文本控件', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    expect(() => {
      ctx.editor.command.executeInsertControl({
        value: '',
        control: {
          type: ControlType.TEXT,
          value: [{ value: '控件值' }]
        }
      })
    }).not.toThrow()
  })

  it('executeSetControlValue 空操作不抛错', () => {
    ctx = createTestEditor()
    expect(() => {
      ctx.editor.command.executeSetControlValue({
        id: 'nonexistent',
        value: 'val'
      })
    }).not.toThrow()
  })

  it('executeSetControlHighlight 空操作不抛错', () => {
    ctx = createTestEditor()
    expect(() => {
      ctx.editor.command.executeSetControlHighlight([
        { ruleList: [{ keyword: 'test' }] }
      ])
    }).not.toThrow()
  })
})
