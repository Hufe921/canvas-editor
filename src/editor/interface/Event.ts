import { IElement } from './Element'
import { RangeRect } from './Range'

export interface IPasteOption {
  isPlainText: boolean
}

export interface IPositionContextByEvent {
  pageNo: number
  element: IElement | null
  rangeRect: RangeRect | null
}
