import { RowFlex } from '../dataset/enum/Row'
import { IElement, IElementMetrics } from './Element'

export type IRowElement = IElement & {
  metrics: IElementMetrics
  style: string
  left?: number
}

export interface IRow {
  width: number
  height: number
  ascent: number
  rowFlex?: RowFlex
  startIndex: number
  endIndex: number
  isPageBreak?: boolean
  isList?: boolean
  listIndex?: number
  offsetX?: number
  elementList: IRowElement[]
  isWidthNotEnough?: boolean
  rowIndex: number
  isSurround?: boolean
}


export interface IRowRef {
  listIndex: number
  level: number
  originalIndex: number
  parents: number[]
  children: number[]
  subChildren: number[]
  majorSubLevel: number
}