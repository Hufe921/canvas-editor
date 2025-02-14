import { IElement } from './Element'
import { RangeRect } from './Range'

export interface IPasteOption {
  isPlainText: boolean
}

export interface ITableInfoByEvent {
  element: IElement
  trIndex: number
  tdIndex: number
}

export interface IPositionContextByEventResult {
  pageNo: number
  element: IElement | null
  rangeRect: RangeRect | null
  tableInfo: ITableInfoByEvent | null
}

export interface IPositionContextByEventOption {
  isMustDirectHit?: boolean
}

export interface ICopyOption {
  isPlainText: boolean
}
