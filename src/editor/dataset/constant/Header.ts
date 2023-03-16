import { IHeader } from '../../interface/Header'
import { HeaderMaxHeightRatio } from '../enum/Header'

export const defaultHeaderOption: Readonly<Required<IHeader>> = {
  top: -50,
  maxHeightRadio: HeaderMaxHeightRatio.HALF
}