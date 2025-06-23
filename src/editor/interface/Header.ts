import { MaxHeightRatio } from '../dataset/enum/Common'

export interface IHeader {
  top?: number
  inactiveAlpha?: number
  maxHeightRadio?: MaxHeightRatio
  disabled?: boolean
  editable?: boolean
}
