import { IElement } from '../../interface/Element'
import { ElementType } from '../../dataset/enum/Element'
import { ControlType } from '../../dataset/enum/Control'
import { EditorZone } from '../../dataset/enum/Editor'
import {
  IControlValidateResult,
  IValidateOption
} from '../../interface/Control'
import { Draw } from '../draw/Draw'
import { Control } from '../draw/control/Control'
import { I18n } from '../i18n/I18n'
import { IResolvedValue } from '../cascade/expression/evaluator'

export class Validate {
  private draw: Draw
  private control: Control
  private i18n: I18n
  // 记录本轮高亮过的 controlId 及用色，供 clearValidate 精确清除
  private highlightedControlIds: Set<string>
  private lastErrorBackgroundColor: string

  constructor(draw: Draw) {
    this.draw = draw
    this.control = draw.getControl()
    this.i18n = draw.getI18n()
    this.highlightedControlIds = new Set()
    this.lastErrorBackgroundColor = ''
  }

  // 按 zone 收集控件元素（含表格下钻），zone 缺省时收集全部三个 zone
  // 同一控件的各组成元素共享 control 对象，需按对象去重避免重复校验
  private collectControlElements(zone?: EditorZone): IElement[] {
    const zoneLists: IElement[][] = []
    if (!zone || zone === EditorZone.HEADER) {
      zoneLists.push(this.draw.getHeaderElementList())
    }
    if (!zone || zone === EditorZone.MAIN) {
      zoneLists.push(this.draw.getOriginalMainElementList())
    }
    if (!zone || zone === EditorZone.FOOTER) {
      zoneLists.push(this.draw.getFooterElementList())
    }
    const elements: IElement[] = []
    const seen = new Set<object>()
    const walk = (elementList: IElement[]) => {
      for (const element of elementList) {
        if (element.type === ElementType.TABLE) {
          for (const tr of element.trList || []) {
            for (const td of tr.tdList) walk(td.value)
          }
          continue
        }
        const control = element.control
        if (!control || seen.has(control)) continue
        seen.add(control)
        elements.push(element)
      }
    }
    zoneLists.forEach(walk)
    return elements
  }

  // 与 CascadeManager 相同的归一化取值，值用 getValueById 实时取
  // （文本控件 control.value 是滞后值）
  // select/radio → code；checkbox → code 数组；text/number/date → 实时文本
  private getNormalizedValue(controlElement: IElement): IResolvedValue {
    const control = controlElement.control!
    const type = control.type
    const result = this.control.getValueById({ id: controlElement.controlId! })
    const hit = result.find(item => item.value != null) || result[0]
    const value = hit?.value ?? null
    if (type === ControlType.SELECT || type === ControlType.RADIO) {
      return { code: value || null }
    }
    if (type === ControlType.CHECKBOX) {
      return { codes: value ? value.split(',') : [] }
    }
    return { text: value, isDate: type === ControlType.DATE }
  }

  private isHidden(controlElement: IElement): boolean {
    // 控件级隐藏或元素级（标题区间）隐藏
    return Boolean(controlElement.control?.hide || controlElement.hide)
  }

  private t(path: string, params?: Record<string, string | number>): string {
    let text = this.i18n.t(path)
    if (params) {
      for (const key in params) {
        text = text.replace(`{${key}}`, String(params[key]))
      }
    }
    return text
  }

  private validateControl(controlElement: IElement, errors: string[]): void {
    const control = controlElement.control!
    const v = this.getNormalizedValue(controlElement)
    const validation = control.validation
    // required
    if (control.required) {
      const empty = v.codes
        ? !v.codes.length
        : v.code !== undefined
          ? !v.code
          : !v.text?.trim()
      if (empty) {
        errors.push(validation?.message || this.t('validate.required'))
        return // 必填未过不再跑后续规则
      }
    }
    if (!validation) return
    const text = 'text' in v ? v.text || '' : ''
    const message = validation.message
    // TEXT 长度 / 正则
    if (control.type === ControlType.TEXT && text) {
      if (validation.minLength != null && text.length < validation.minLength) {
        errors.push(
          message ||
            this.t('validate.minLength', { min: validation.minLength! })
        )
      }
      if (validation.maxLength != null && text.length > validation.maxLength) {
        errors.push(
          message ||
            this.t('validate.maxLength', { max: validation.maxLength! })
        )
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(text)) {
        errors.push(message || this.t('validate.pattern'))
      }
    }
    // NUMBER 范围
    if (control.type === ControlType.NUMBER && text) {
      const num = Number(text)
      if (!Number.isFinite(num)) {
        errors.push(message || this.t('validate.invalidNumber'))
      } else {
        if (validation.min != null && num < validation.min) {
          errors.push(
            message || this.t('validate.min', { min: validation.min! })
          )
        }
        if (validation.max != null && num > validation.max) {
          errors.push(
            message || this.t('validate.max', { max: validation.max! })
          )
        }
        if (validation.integer && !Number.isInteger(num)) {
          errors.push(message || this.t('validate.integer'))
        }
        if (validation.precision != null) {
          const decimals = text.split('.')[1]?.length || 0
          if (decimals > validation.precision) {
            errors.push(
              message ||
                this.t('validate.precision', {
                  precision: validation.precision!
                })
            )
          }
        }
      }
    }
    // DATE 范围
    if (control.type === ControlType.DATE && text) {
      const toTime = (s: string) =>
        s === 'today'
          ? new Date(new Date().toDateString()).getTime()
          : new Date(s).getTime()
      const time = toTime(text)
      if (validation.minDate && time < toTime(validation.minDate)) {
        errors.push(
          message || this.t('validate.minDate', { date: validation.minDate! })
        )
      }
      if (validation.maxDate && time > toTime(validation.maxDate)) {
        errors.push(
          message || this.t('validate.maxDate', { date: validation.maxDate! })
        )
      }
    }
    // CHECKBOX 数量
    if (control.type === ControlType.CHECKBOX && v.codes) {
      const count = v.codes.length
      if (validation.minChecked != null && count < validation.minChecked) {
        errors.push(
          message ||
            this.t('validate.minChecked', { count: validation.minChecked! })
        )
      }
      if (validation.maxChecked != null && count > validation.maxChecked) {
        errors.push(
          message ||
            this.t('validate.maxChecked', { count: validation.maxChecked! })
        )
      }
    }
  }

  private walkAllControlElements(fn: (element: IElement) => void) {
    const walk = (elementList: IElement[]) => {
      for (const element of elementList) {
        if (element.type === ElementType.TABLE) {
          for (const tr of element.trList || []) {
            for (const td of tr.tdList) walk(td.value)
          }
          continue
        }
        if (element.controlId) fn(element)
      }
    }
    walk(this.draw.getHeaderElementList())
    walk(this.draw.getOriginalMainElementList())
    walk(this.draw.getFooterElementList())
  }

  private applyHighlight(color: string) {
    this.walkAllControlElements(element => {
      if (this.highlightedControlIds.has(element.controlId!)) {
        element.highlight = color
      }
    })
    this.draw.render({ isSubmitHistory: false, isSetCursor: false })
  }

  public clearHighlight() {
    if (!this.highlightedControlIds.size) return
    this.walkAllControlElements(element => {
      if (
        this.highlightedControlIds.has(element.controlId!) &&
        element.highlight === this.lastErrorBackgroundColor
      ) {
        delete element.highlight
      }
    })
    this.highlightedControlIds.clear()
    this.draw.render({ isSubmitHistory: false, isSetCursor: false })
  }

  public execute(payload?: IValidateOption): IControlValidateResult[] {
    // 级联由 contentChange 异步驱动，校验前先同步冲刷，
    // 保证「设值 → 立即校验」读到最新的显隐/必填状态
    this.draw.getCascadeManager().executeAll()
    this.clearHighlight()
    const errorBackgroundColor =
      payload?.errorBackgroundColor ||
      this.draw.getOptions().control.errorBackgroundColor
    const results: IControlValidateResult[] = []
    const elements = this.collectControlElements(payload?.zone)
    for (const element of elements) {
      if (!element.control || !element.controlId) continue
      if (this.isHidden(element)) continue
      const errors: string[] = []
      this.validateControl(element, errors)
      if (errors.length) {
        results.push({
          controlId: element.controlId,
          conceptId: element.control.conceptId,
          control: { ...element.control },
          errors
        })
        this.highlightedControlIds.add(element.controlId)
      }
    }
    this.lastErrorBackgroundColor = errorBackgroundColor
    if (this.highlightedControlIds.size) {
      this.applyHighlight(errorBackgroundColor)
    }
    return results
  }
}
