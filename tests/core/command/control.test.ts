import { describe, it, expect, afterEach, vi } from 'vitest'
import { ControlType } from '../../../src/editor/dataset/enum/Control'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
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

  it('control.minWidth 大于行宽时按多行计算高度', () => {
    ctx = createTestEditor({
      options: {
        width: 240,
        margins: [20, 20, 20, 20]
      }
    })
    const createControl = (minWidth: number): IElement[] => [
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.TEXT,
          value: null,
          prefix: '\u200c',
          postfix: '\u200c',
          minWidth,
          underline: true
        }
      }
    ]

    const oneLineHeight = ctx.editor.command.executeComputeElementListHeight(
      createControl(120)
    )
    const wrappedHeight = ctx.editor.command.executeComputeElementListHeight(
      createControl(1000)
    )

    expect(wrappedHeight).toBeGreaterThan(oneLineHeight)
  })

  it('control.minWidth 跨行占位不写入控件值', () => {
    ctx = createTestEditor({
      data: [
        {
          type: ElementType.CONTROL,
          value: '',
          control: {
            type: ControlType.TEXT,
            value: [{ value: 'A' }],
            prefix: '\u200c',
            postfix: '\u200c',
            minWidth: 1000,
            underline: true
          }
        }
      ],
      options: {
        width: 240,
        margins: [20, 20, 20, 20]
      }
    })

    const control = ctx.editor.command.getValue().data.main[0].control

    expect(control?.value?.map(element => element.value)).toEqual(['A'])
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

  it('留痕开启时日期控件连续改值不残留旧值字符', () => {
    ctx = createTestEditor({
      data: [
        {
          type: ElementType.CONTROL,
          value: '',
          control: {
            conceptId: 'date-trace',
            type: ControlType.DATE,
            value: [{ value: '2024-01-01' }]
          }
        }
      ],
      options: { trace: { disabled: false } }
    })

    ctx.editor.command.executeSetControlValue({
      conceptId: 'date-trace',
      value: '2025-02-02'
    })
    ctx.editor.command.executeSetControlValue({
      conceptId: 'date-trace',
      value: '2026-03-03'
    })

    const [controlValue] = ctx.editor.command.getControlValue({
      conceptId: 'date-trace'
    })!

    expect(controlValue.value).toBe('2026-03-03')
  })
})
