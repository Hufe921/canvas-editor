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
  isPageBreak?: boolean
  isList?: boolean
  listIndex?: number
  offsetX?: number
  elementList: IRowElement[]
  isWidthNotEnough?: boolean
}
