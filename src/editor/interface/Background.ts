import { BackgroundRepeat, BackgroundSize } from '../dataset/enum/Background'

export interface IBackgroundOption {
  color?: string
  image?: string
  size?: BackgroundSize
  repeat?: BackgroundRepeat
}
