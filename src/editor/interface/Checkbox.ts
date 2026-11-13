import { CheckboxMarkType } from '../dataset/enum/Common'
import { VerticalAlign } from '../dataset/enum/VerticalAlign'

export interface ICheckbox {
  value: boolean | null
  code?: string
  disabled?: boolean
  markType?: CheckboxMarkType
}

export interface ICheckboxOption {
  width?: number
  height?: number
  gap?: number
  lineWidth?: number
  fillStyle?: string
  strokeStyle?: string
  checkFillStyle?: string
  checkStrokeStyle?: string
  checkMarkColor?: string
  markType?: CheckboxMarkType
  verticalAlign?: VerticalAlign
}
