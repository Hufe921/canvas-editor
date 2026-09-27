import { describe, it, expect, afterEach } from 'vitest'
import {
  createTestEditor,
  TestEditorContext,
  waitMacroTask
} from '../factories/editor'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'

const num = (
  id: string,
  concept: string,
  val: string | null,
  extra: Record<string, unknown> = {}
): IElement => ({
  type: ElementType.CONTROL,
  value: '',
  controlId: id,
  control: {
    conceptId: concept,
    type: ControlType.NUMBER,
    value: val ? ([{ value: val } as IElement] as IElement[]) : null,
    ...extra
  } as IElement['control']
})

const getVal = (ctx: TestEditorContext, conceptId: string) =>
  ctx.editor.command.getControlValue({ conceptId })?.[0]?.value ?? null

// 回归：带 postText 的 compute 控件，二次回写后值正确且 postText 保留
describe('compute 回写保留 postText', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('首次计算与改源值重算', async () => {
    ctx = createTestEditor({
      data: {
        header: [],
        main: [
          num('cA', 'a', '1'),
          num('cB', 'b', '2'),
          num('cSum', 'sum', null, {
            disabled: true,
            postText: '元',
            compute: "getValue('a') + getValue('b')"
          })
        ],
        footer: []
      }
    })
    await waitMacroTask()
    expect(getVal(ctx, 'sum')).toBe('3')

    ctx.editor.command.executeSetControlValue({ id: 'cA', value: '2' })
    ctx.editor.command.executeSetControlValue({ id: 'cB', value: '3' })
    await waitMacroTask()
    expect(getVal(ctx, 'sum')).toBe('5')

    const sumControl = ctx.editor.command
      .getControlList()
      .find(el => el.controlId === 'cSum')
    expect(sumControl?.control?.postText).toBe('元')
  })
})
