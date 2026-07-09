import { RulerUnit } from '../dataset/enum/Ruler'

export interface IRulerOption {
  disabled?: boolean
  size?: number
  font?: string
  fontSize?: number
  color?: string
  textColor?: string
  backgroundColor?: string
  outsideBackgroundColor?: string
  marginColor?: string
  unit?: RulerUnit
  enableMarginDrag?: boolean
}
