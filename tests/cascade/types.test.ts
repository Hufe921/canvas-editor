import { describe, it, expect } from 'vitest'
import { ControlType } from '@/editor/dataset/enum/Control'
import type {
  IControlCascadeRule,
  IControlValidation,
  IControlValidateResult
} from '@/editor/interface/Control'

describe('级联与校验类型定义', () => {
  it('级联规则结构可构造', () => {
    const rule: IControlCascadeRule = {
      expression: "getValue(@self) == '1'",
      actions: [
        {
          conceptId: 'hypertensionLevel',
          effects: { hide: false, required: true }
        }
      ]
    }
    expect(rule.actions[0].conceptId).toBe('hypertensionLevel')
  })

  it('校验规则结构可构造', () => {
    const validation: IControlValidation = {
      minLength: 2,
      maxLength: 10,
      min: 0,
      max: 100,
      minDate: '2024-01-01',
      maxDate: 'today',
      minChecked: 1,
      maxChecked: 3
    }
    expect(validation.maxDate).toBe('today')
  })

  it('校验结果结构可构造', () => {
    const result: IControlValidateResult = {
      controlId: '1',
      conceptId: 'a',
      control: { type: ControlType.TEXT, value: null },
      errors: ['该字段为必填项']
    }
    expect(result.errors).toHaveLength(1)
  })
})
