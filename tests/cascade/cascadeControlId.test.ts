import { describe, it, expect, afterEach } from 'vitest'
import {
  createTestEditor,
  TestEditorContext,
  waitMacroTask
} from '../factories/editor'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'

// 两个 conceptId 相同的备注控件，级联按 controlId 精确控制第一个
function buildData(lockCode: string | null): IElement[] {
  return [
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'c1',
      control: {
        conceptId: 'lockFirst',
        type: ControlType.SELECT,
        value: lockCode ? [{ value: '是', code: lockCode } as IElement] : null,
        code: lockCode,
        valueSets: [
          { value: '是', code: '1' },
          { value: '否', code: '0' }
        ],
        cascade: [
          {
            expression: "getValue(@self) == '1'",
            actions: [
              {
                controlId: 'firstNote',
                effects: { disabled: true }
              }
            ]
          }
        ]
      } as IElement['control']
    },
    { value: '备注一：' },
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'firstNote',
      control: {
        conceptId: 'note',
        type: ControlType.TEXT,
        value: null,
        placeholder: '备注一'
      } as IElement['control']
    },
    { value: '备注二：' },
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'secondNote',
      control: {
        conceptId: 'note',
        type: ControlType.TEXT,
        value: null,
        placeholder: '备注二'
      } as IElement['control']
    }
  ]
}

describe('级联按 controlId 精确控制', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('仅禁用 controlId 命中的控件，同 conceptId 控件不受影响', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildData('1'), footer: [] }
    })
    const list = ctx.editor.command.getControlList()
    const first = list.find(el => el.controlId === 'firstNote')
    const second = list.find(el => el.controlId === 'secondNote')
    expect(first?.control?.disabled).toBe(true)
    expect(second?.control?.disabled).toBeFalsy()
  })

  it('表达式不成立：还原基线（可编辑）', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildData('1'), footer: [] }
    })
    ctx.editor.command.executeSetControlValue({ id: 'c1', value: '0' })
    await waitMacroTask()
    const list = ctx.editor.command.getControlList()
    expect(
      list.find(el => el.controlId === 'firstNote')?.control?.disabled
    ).toBeFalsy()
  })
})
