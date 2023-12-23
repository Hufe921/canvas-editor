import { IElement } from './Element'

export interface IPreviewerCreateResult {
  resizerSelection: HTMLDivElement
  resizerHandleList: HTMLDivElement[]
  resizerImageContainer: HTMLDivElement
  resizerImage: HTMLImageElement
  resizerSize: HTMLSpanElement
}

export interface IPreviewerDrawOption {
  mime?: 'png' | 'jpg' | 'jpeg' | 'svg'
  srcKey?: keyof Pick<IElement, 'value' | 'laTexSVG'>
}
