import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  createTestEditor,
  TestEditorContext,
  waitMacroTask
} from '../factories/editor'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'

const numberControl = (
  controlId: string,
  conceptId: string,
  text: string | null,
  extra: Record<string, unknown> = {}
): IElement => ({
  type: ElementType.CONTROL,
  value: '',
  controlId,
  control: {
    conceptId,
    type: ControlType.NUMBER,
    value: text ? [{ value: text } as IElement] : null,
    ...extra
  } as IElement['control']
})

// BMI 场景：身高/体重 → BMI 自动计算，BMI > 28 显示干预建议
function buildBmiData(): IElement[] {
  return [
    { value: '身高：' },
    numberControl('cHeight', 'height', '1.75'),
    { value: '体重：' },
    numberControl('cWeight', 'weight', '70'),
    { value: 'BMI：' },
    numberControl('cBmi', 'bmi', null, {
      disabled: true,
      compute:
        "round(getValue('weight') / (getValue('height') * getValue('height')), 1)",
      cascade: [
        {
          expression: 'getValue(@self) > 28',
          actions: [{ conceptId: 'obesityTip', effects: { hide: false } }]
        }
      ]
    }),
    { value: '肥胖干预：' },
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'cTip',
      control: {
        conceptId: 'obesityTip',
        type: ControlType.TEXT,
        value: null,
        hide: true
      } as IElement['control']
    }
  ]
}

function getControlValue(ctx: TestEditorContext, conceptId: string) {
  const result = ctx.editor.command.getControlValue({ conceptId })
  return result?.[0]?.value ?? null
}

function isHidden(ctx: TestEditorContext, controlId: string) {
  const target = ctx.editor.command
    .getControlList()
    .find(el => el.controlId === controlId)
  return Boolean(target?.control?.hide)
}

describe('compute 计算字段', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('初始化即自动计算 BMI', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildBmiData(), footer: [] }
    })
    expect(getControlValue(ctx, 'bmi')).toBe('22.9')
    expect(isHidden(ctx, 'cTip')).toBe(true)
  })

  it('源值变化 → 重算；BMI 超阈值 → @self 级联显示提示', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildBmiData(), footer: [] }
    })
    ctx.editor.command.executeSetControlValue({ id: 'cWeight', value: '90' })
    await waitMacroTask()
    // 90 / 1.75² ≈ 29.4
    expect(getControlValue(ctx, 'bmi')).toBe('29.4')
    expect(isHidden(ctx, 'cTip')).toBe(false)
    // 降回正常体重：提示还原隐藏
    ctx.editor.command.executeSetControlValue({ id: 'cWeight', value: '70' })
    await waitMacroTask()
    expect(getControlValue(ctx, 'bmi')).toBe('22.9')
    expect(isHidden(ctx, 'cTip')).toBe(true)
  })

  it('任一输入为空 → 计算结果清空', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildBmiData(), footer: [] }
    })
    expect(getControlValue(ctx, 'bmi')).toBe('22.9')
    ctx.editor.command.executeSetControlValue({ id: 'cHeight', value: null })
    await waitMacroTask()
    expect(getControlValue(ctx, 'bmi')).toBeNull()
  })

  it('链式计算：total → doubled 多轮收敛', async () => {
    const data: IElement[] = [
      numberControl('cA', 'a', '1'),
      numberControl('cB', 'b', '2'),
      numberControl('cTotal', 'total', null, {
        compute: "getValue('a') + getValue('b')"
      }),
      numberControl('cDoubled', 'doubled', null, {
        compute: "getValue('total') * 2"
      })
    ]
    ctx = createTestEditor({
      data: { header: [], main: data, footer: [] }
    })
    expect(getControlValue(ctx, 'total')).toBe('3')
    expect(getControlValue(ctx, 'doubled')).toBe('6')
    ctx.editor.command.executeSetControlValue({ id: 'cA', value: '5' })
    await waitMacroTask()
    expect(getControlValue(ctx, 'total')).toBe('7')
    expect(getControlValue(ctx, 'doubled')).toBe('14')
  })

  it('循环计算：迭代上限保护，不卡死并告警', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data: IElement[] = [
      numberControl('cA', 'a', '1', { compute: "getValue('b') + 1" }),
      numberControl('cB', 'b', '1', { compute: "getValue('a') + 1" })
    ]
    ctx = createTestEditor({
      data: { header: [], main: data, footer: [] }
    })
    expect(warn.mock.calls.some(args => String(args[0]).includes('循环'))).toBe(
      true
    )
    warn.mockRestore()
  })

  it('compute 回写不产生 undo 记录：undo 回退的是用户输入', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildBmiData(), footer: [] }
    })
    // 两次用户输入（首次记录为基线，undo 需要栈长 > 1）
    ctx.editor.command.executeSetControlValue({ id: 'cWeight', value: '80' })
    await waitMacroTask()
    ctx.editor.command.executeSetControlValue({ id: 'cWeight', value: '90' })
    await waitMacroTask()
    expect(getControlValue(ctx, 'weight')).toBe('90')
    expect(getControlValue(ctx, 'bmi')).toBe('29.4')
    // undo 应回退用户第二次输入（80），而非 BMI 的计算回写
    ctx.editor.command.executeUndo()
    expect(getControlValue(ctx, 'weight')).toBe('80')
    // contentChange 在 nextTick 发射，等待后 BMI 保持一致
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(getControlValue(ctx, 'bmi')).toBe('26.1')
  })
})

describe('@self 保留字', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('@self 引用规则所在控件自身的值', async () => {
    const data: IElement[] = [
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
              actions: [{ conceptId: 'detail', effects: { hide: false } }]
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
          type: ControlType.TEXT,
          value: null,
          hide: true
        } as IElement['control']
      }
    ]
    ctx = createTestEditor({
      data: { header: [], main: data, footer: [] }
    })
    expect(isHidden(ctx, 'c2')).toBe(false)
    ctx.editor.command.executeSetControlValue({ id: 'c1', value: '0' })
    await waitMacroTask()
    expect(isHidden(ctx, 'c2')).toBe(true)
  })
})
