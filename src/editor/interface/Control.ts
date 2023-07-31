import { ControlType } from '../dataset/enum/Control'
import { ICheckbox } from './Checkbox'
import { IElement } from './Element'

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

export interface IControlBasic {
  type: ControlType
  value: IElement[] | null
  placeholder?: string
  conceptId?: string
  prefix?: string
  postfix?: string
}

export type IControl = IControlBasic &
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

  setValue(data: IElement[]): number

  keydown(evt: KeyboardEvent): number

  cut(): number
}
