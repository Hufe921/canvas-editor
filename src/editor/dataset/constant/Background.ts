import { IBackgroundOption } from '../../interface/Background'
import { BackgroundRepeat, BackgroundSize } from '../enum/Background'

export const defaultBackground: Readonly<Required<IBackgroundOption>> = {
  color: '#FFFFFF',
  image: '',
  size: BackgroundSize.COVER,
  repeat: BackgroundRepeat.NO_REPEAT
}
