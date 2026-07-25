import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor, TestEditorContext } from '../factories/editor'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'

const control = (over: Record<string, any>): IElement => ({
  type: ElementType.CONTROL,
  value: '',
  controlId: over.controlId,
  control: { value: null, ...over } as any
})

describe('executeValidate', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('必填未填 → 返回错误并高亮；clearValidate 清除', () => {
    const data = [
      control({
        controlId: 'c1',
        conceptId: 'name',
        type: ControlType.TEXT,
        required: true,
        preText: '姓名'
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    const result = ctx.editor.command.executeValidate()
    expect(result).toHaveLength(1)
    expect(result[0].controlId).toBe('c1')
    expect(result[0].control.preText).toBe('姓名')
    expect(result[0].errors[0]).toContain('必填')
    ctx.editor.command.executeClearValidate()
  })

  it('必填已填 → 通过', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.TEXT,
        required: true,
        value: [{ value: '张' }, { value: '三' }]
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    expect(ctx.editor.command.executeValidate()).toHaveLength(0)
  })

  it('隐藏控件豁免必填', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.TEXT,
        required: true,
        hide: true
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    expect(ctx.editor.command.executeValidate()).toHaveLength(0)
  })

  it('文本长度规则', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.TEXT,
        value: [{ value: 'a' }],
        validation: { minLength: 2, maxLength: 5 }
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    const result = ctx.editor.command.executeValidate()
    expect(result[0].errors[0]).toContain('2')
  })

  it('数值范围', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.NUMBER,
        value: [{ value: '120' }],
        validation: { max: 100 }
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    expect(ctx.editor.command.executeValidate()).toHaveLength(1)
  })

  it('日期范围（含 today 关键字）', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.DATE,
        value: [{ value: '2020-01-01' }],
        validation: { minDate: '2024-01-01' }
      }),
      control({
        controlId: 'c2',
        type: ControlType.DATE,
        value: [{ value: '2999-01-01' }],
        validation: { maxDate: 'today' }
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    expect(ctx.editor.command.executeValidate()).toHaveLength(2)
  })

  it('多选数量', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.CHECKBOX,
        code: '1',
        valueSets: [
          { value: 'a', code: '1' },
          { value: 'b', code: '2' }
        ],
        validation: { minChecked: 2 }
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    expect(ctx.editor.command.executeValidate()).toHaveLength(1)
  })

  it('select 必填校验基于 code', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.SELECT,
        required: true,
        code: null,
        valueSets: [{ value: '有', code: '1' }]
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    expect(ctx.editor.command.executeValidate()).toHaveLength(1)
  })

  it('校验文案支持国际化覆盖（register.langMap）', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.TEXT,
        required: true,
        validation: { minLength: 2 }
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    ctx.editor.register.langMap('zhCN', {
      validate: {
        required: 'CUSTOM_REQUIRED',
        minLength: 'CUSTOM_MIN_{min}'
      }
    })
    const result = ctx.editor.command.executeValidate()
    expect(result[0].errors[0]).toBe('CUSTOM_REQUIRED')
    // 必填已填时校验长度规则，参数插值生效
    ctx.editor.command.executeSetControlValue({ id: 'c1', value: 'a' })
    const result2 = ctx.editor.command.executeValidate()
    expect(result2[0].errors[0]).toBe('CUSTOM_MIN_2')
  })

  it('validation.message 优先级高于国际化文案', () => {
    const data = [
      control({
        controlId: 'c1',
        type: ControlType.TEXT,
        required: true,
        validation: { message: '请填写此字段' }
      })
    ]
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    const result = ctx.editor.command.executeValidate()
    expect(result[0].errors[0]).toBe('请填写此字段')
  })
})
