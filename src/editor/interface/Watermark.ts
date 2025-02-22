import { NumberType } from '../dataset/enum/Common'

export interface IWatermark {
  data: string
  color?: string
  opacity?: number
  size?: number
  font?: string
  repeat?: boolean
  numberType?: NumberType
  gap?: [horizontal: number, vertical: number]
}
