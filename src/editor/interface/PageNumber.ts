import { NumberType } from '../dataset/enum/Common'
import { RowFlex } from '../dataset/enum/Row'

export interface IPageNumber {
  bottom?: number
  size?: number
  font?: string
  color?: string
  rowFlex?: RowFlex
  format?: string
  numberType?: NumberType
  disabled?: boolean
  startPageNo?: number
  fromPageNo?: number
}
