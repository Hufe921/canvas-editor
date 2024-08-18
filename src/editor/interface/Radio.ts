import { VerticalAlign } from '../dataset/enum/VerticalAlign'

export interface IRadio {
  value: boolean | null
  code?: string
  disabled?: boolean
}

export interface IRadioOption {
  width?: number
  height?: number
  gap?: number
  lineWidth?: number
  fillStyle?: string
  strokeStyle?: string
  verticalAlign?: VerticalAlign
}
