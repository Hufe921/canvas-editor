import { describe, it, expect, afterEach, vi } from 'vitest'
import { ControlType } from '../../../src/editor/dataset/enum/Control'
import { createTestEditor } from '../../factories/editor'
import { CheckboxControl } from '../../../src/editor/core/draw/control/checkbox/CheckboxControl'
import { hitCheckbox } from '../../../src/editor/core/event/handlers/mousedown'
import { IElement } from '../../../src/editor/interface/Element'

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

  it('hitCheckbox 取消不存在的 code 时不误删最后一个已选 code', () => {
    const element: IElement = {
      value: '',
      control: {
        type: ControlType.CHECKBOX,
        value: null,
        code: 'a,b'
      },
      checkbox: {
        value: true,
        code: 'x'
      }
    }
    const activeControl = new CheckboxControl(element, {} as any)
    const setSelect = vi
      .spyOn(activeControl, 'setSelect')
      .mockImplementation(() => undefined)
    const draw = {
      getControl: () => ({
        getActiveControl: () => activeControl
      })
    }

    hitCheckbox(element, draw as any)

    expect(setSelect).toHaveBeenCalledWith(['a', 'b'])
  })
})
