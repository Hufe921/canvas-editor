import { IHeader } from '../../interface/Header'
import { MaxHeightRatio } from '../enum/Common'

export const defaultHeaderOption: Readonly<Required<IHeader>> = {
  top: 30,
  maxHeightRadio: MaxHeightRatio.HALF,
  disabled: false
}
