import { afterEach, describe, expect, it } from 'vitest'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import type {
  IControlConditionRule,
  RuleContext
} from '@/editor/interface/Control'
import type { IElement } from '@/editor/interface/Element'
import { createTestEditor, TestEditorContext } from '../factories/editor'

enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

const defaultRule: IControlConditionRule = {
  expression: "getContext('gender') == 'male' || getContext('age') < 10",
  effects: {
    hide: true,
    required: false
  },
  elseEffects: {
    hide: false,
    required: true
  }
}

function buildData(rule: IControlConditionRule = defaultRule): IElement[] {
  return [
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'menstrual',
      control: {
        conceptId: 'menstrualHistory',
        type: ControlType.TEXT,
        value: null,
        rules: [rule]
      }
    }
  ]
}

function createRuleEditor(ruleContext: RuleContext, rule = defaultRule) {
  return createTestEditor({
    data: buildData(rule),
    options: { ruleContext }
  })
}

function getMenstrualControl(ctx: TestEditorContext) {
  const element = ctx.editor.command
    .getControlList()
    .find(item => item.controlId === 'menstrual')
  if (!element?.control) throw new Error('月经史测试控件不存在')
  return element.control
}

describe('控件自身规则', () => {
  let ctx: TestEditorContext

  afterEach(() => ctx?.destroy())

  it('实例化传入男性上下文，初始即隐藏且非必填', () => {
    ctx = createRuleEditor({ gender: Gender.MALE, age: 32 })
    const control = getMenstrualControl(ctx)
    expect(control.hide).toBe(true)
    expect(control.required).toBe(false)
  })

  it('实例化传入女性成年上下文，显示且必填', () => {
    ctx = createRuleEditor({ gender: Gender.FEMALE, age: 32 })
    const control = getMenstrualControl(ctx)
    expect(control.hide).toBe(false)
    expect(control.required).toBe(true)
  })

  it('executeUpdateRuleContext 局部更新并立即重算', () => {
    ctx = createRuleEditor({ gender: Gender.MALE, age: 32 })
    expect(getMenstrualControl(ctx).hide).toBe(true)

    ctx.editor.command.executeUpdateRuleContext({
      gender: Gender.FEMALE
    })
    expect(getMenstrualControl(ctx).hide).toBe(false)
    expect(getMenstrualControl(ctx).required).toBe(true)

    // 只更新年龄，保留女性上下文
    ctx.editor.command.executeUpdateRuleContext({ age: 9 })
    expect(getMenstrualControl(ctx).hide).toBe(true)
    expect(getMenstrualControl(ctx).required).toBe(false)

    ctx.editor.command.executeUpdateRuleContext({ age: 10 })
    expect(getMenstrualControl(ctx).hide).toBe(false)
    expect(getMenstrualControl(ctx).required).toBe(true)
  })

  it('未配置 elseEffects 时恢复控件原始属性', () => {
    const data = buildData({
      expression: "getContext('gender') == 'male'",
      effects: {
        hide: true,
        required: false
      }
    })
    data[0].control!.hide = false
    data[0].control!.required = true
    ctx = createTestEditor({
      data,
      options: { ruleContext: { gender: Gender.MALE } }
    })
    expect(getMenstrualControl(ctx).hide).toBe(true)
    expect(getMenstrualControl(ctx).required).toBe(false)

    ctx.editor.command.executeUpdateRuleContext({
      gender: Gender.FEMALE
    })
    expect(getMenstrualControl(ctx).hide).toBe(false)
    expect(getMenstrualControl(ctx).required).toBe(true)
  })

  it('隐藏控件豁免校验，恢复显示后执行必填校验', () => {
    ctx = createRuleEditor({ gender: Gender.MALE, age: 32 })
    expect(ctx.editor.command.executeValidate()).toHaveLength(0)

    ctx.editor.command.executeUpdateRuleContext({
      gender: Gender.FEMALE
    })
    const errors = ctx.editor.command.executeValidate()
    expect(errors).toHaveLength(1)
    expect(errors[0].conceptId).toBe('menstrualHistory')
  })

  it('规则随文档数据保存，上下文不混入控件数据', () => {
    ctx = createRuleEditor({ gender: Gender.MALE, age: 32 })
    const result = ctx.editor.command.getValue()
    const control = result.data.main[0].control
    expect(control?.rules).toEqual([defaultRule])
    expect(control).not.toHaveProperty('ruleContext')
  })
})
