import { IHeader } from '../../interface/Header'
import { HeaderMaxHeightRatio } from '../enum/Header'

export const defaultHeaderOption: Readonly<Required<IHeader>> = {
  top: 30,
  maxHeightRadio: HeaderMaxHeightRatio.HALF
}

export const maxHeightRadioMapping: Record<HeaderMaxHeightRatio, number> = {
  [HeaderMaxHeightRatio.HALF]: 1 / 2,
  [HeaderMaxHeightRatio.ONE_THIRD]: 1 / 3,
  [HeaderMaxHeightRatio.QUARTER]: 1 / 4
}