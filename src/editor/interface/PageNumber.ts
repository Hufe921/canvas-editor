import { NumberType } from '../dataset/enum/Common'
import { RowFlex } from '../dataset/enum/Row'

type TopBottom = 'top' | 'bottom'
type Side = 'left' | 'center' | 'right' | 'outer' | 'inner'
export type IPageNumberPosition = `${TopBottom}-${Side}`

export interface IPageNumber {
  top?: number;
  bottom?: number;
  size?: number;
  font?: string;
  color?: string;
  rowFlex?: RowFlex;
  format?: string;
  numberType?: NumberType;
  position?: IPageNumberPosition
  startAt?: number;
  disabled?: boolean;
}