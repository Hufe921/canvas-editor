import { ControlType, ControlIndentation } from '../dataset/enum/Control'
import { EditorZone } from '../dataset/enum/Editor'
import { ICheckbox } from './Checkbox'
import { IElement } from './Element'
import { IRange } from './Range'

export interface IValueSet {
  value: string
  code: string
}

export interface IControlSelect {
  code: string | null
  valueSets: IValueSet[]
}

export interface IControlCheckbox {
  code: string | null
  min?: number
  max?: number
  valueSets: IValueSet[]
  checkbox?: ICheckbox
}

export interface IControlRule {
  deletable?: boolean
  disabled?: boolean
}

export interface IControlBasic {
  type: ControlType
  value: IElement[] | null
  placeholder?: string
  conceptId?: string
  prefix?: string
  postfix?: string
  minWidth?: number
  underline?: boolean
  extension?: unknown
  indentation?: ControlIndentation
}

export type IControl = IControlBasic &
  IControlRule &
  Partial<IControlSelect> &
  Partial<IControlCheckbox>

export interface IControlOption {
  placeholderColor?: string
  bracketColor?: string
  prefix?: string
  postfix?: string
}

export interface IControlInitOption {
  index: number
  isTable?: boolean
  trIndex?: number
  tdIndex?: number
  tdValueIndex?: number
}

export interface IControlInitResult {
  newIndex: number
}

export interface IControlInstance {
  getElement(): IElement

  getValue(): IElement[]

  setValue(
    data: IElement[],
    context?: IControlContext,
    options?: IControlRuleOption
  ): number

  keydown(evt: KeyboardEvent): number | null

  cut(): number
}

export interface IControlContext {
  range?: IRange
  elementList?: IElement[]
}

export interface IControlRuleOption {
  isIgnoreDisabledRule?: boolean // 忽略禁用校验规则
}

export interface IGetControlValueOption {
  conceptId: string
}

export type IGetControlValueResult = (Omit<IControl, 'value'> & {
  value: string | null
  innerText: string | null
  zone: EditorZone
})[]

export interface ISetControlValueOption {
  conceptId: string
  value: string
}

export interface ISetControlExtensionOption {
  conceptId: string
  extension: unknown
}
