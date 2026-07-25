import { describe, it, expect, afterEach } from 'vitest'
import {
  createTestEditor,
  TestEditorContext,
  waitMacroTask
} from '../factories/editor'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'

function buildData(): IElement[] {
  return [
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'c1',
      control: {
        conceptId: 'flag',
        type: ControlType.SELECT,
        value: [{ value: '有', code: '1' } as IElement],
        code: '1',
        valueSets: [
          { value: '有', code: '1' },
          { value: '无', code: '0' }
        ],
        cascade: [
          {
            expression: "getValue(@self) == '1'",
            actions: [
              { conceptId: 'detail', effects: { hide: false, required: true } }
            ]
          }
        ]
      } as IElement['control']
    },
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'c2',
      control: {
        conceptId: 'detail',
        type: ControlType.SELECT,
        value: null,
        code: null,
        hide: true,
        valueSets: [
          { value: 'Ⅰ级', code: '1' },
          { value: 'Ⅱ级', code: '2' }
        ]
      } as IElement['control']
    },
    { value: '\n' }
  ]
}

describe('二次联动：目标选值后再还原', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('目标控件选值后，触发控件改"无"目标仍应隐藏', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildData(), footer: [] }
    })
    const findC2 = () =>
      ctx.editor.command.getControlList().find(el => el.controlId === 'c2')
    // 初始：有 → 显示
    expect(findC2()?.control?.hide).toBe(false)
    // 目标里选"Ⅰ级"
    ctx.editor.command.executeSetControlValue({ id: 'c2', value: '1' })
    await waitMacroTask()
    expect(findC2()?.control?.code).toBe('1')
    expect(findC2()?.control?.hide).toBe(false)
    // 触发改"无" → 应还原隐藏
    ctx.editor.command.executeSetControlValue({ id: 'c1', value: '0' })
    await waitMacroTask()
    expect(findC2()?.control?.hide).toBe(true)
  })
})
