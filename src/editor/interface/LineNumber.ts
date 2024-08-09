import { LineNumberType } from '../dataset/enum/LineNumber'

export interface ILineNumberOption {
  size?: number
  font?: string
  color?: string
  disabled?: boolean
  right?: number
  type?: LineNumberType
}
