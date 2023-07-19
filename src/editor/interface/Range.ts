import { EditorZone } from '../dataset/enum/Editor'
import { IElement } from './Element'

export interface IRange {
  startIndex: number
  endIndex: number
  isCrossRowCol?: boolean
  tableId?: string
  startTdIndex?: number
  endTdIndex?: number
  startTrIndex?: number
  endTrIndex?: number
  zone?: EditorZone
}

export type RangeRowArray = Map<number, number[]>

export type RangeRowMap = Map<number, Set<number>>

export type RangeContext = {
  isCollapsed: boolean
  startElement: IElement
  endElement: IElement
  startPageNo: number
  endPageNo: number
}
