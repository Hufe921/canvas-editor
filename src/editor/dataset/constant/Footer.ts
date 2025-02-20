import { IFooter } from '../../interface/Footer'
import { MaxHeightRatio } from '../enum/Common'

export const defaultFooterOption: Readonly<Required<IFooter>> = {
  bottom: 30,
  maxHeightRadio: MaxHeightRatio.HALF,
  disabled: false
}
