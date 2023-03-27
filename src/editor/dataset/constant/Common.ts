import { MaxHeightRatio } from '../enum/Common'

export const ZERO = '\u200B'
export const WRAP = '\n'
export const HORIZON_TAB = '\t'
export const NBSP = '\u0020'

export const maxHeightRadioMapping: Record<MaxHeightRatio, number> = {
  [MaxHeightRatio.HALF]: 1 / 2,
  [MaxHeightRatio.ONE_THIRD]: 1 / 3,
  [MaxHeightRatio.QUARTER]: 1 / 4
}