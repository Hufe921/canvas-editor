import { EditorZone } from '../dataset/enum/Editor'
import { IElement, IElementFillRect, IElementStyle } from './Element'

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

export type RangeRect = IElementFillRect

export type RangeContext = {
  isCollapsed: boolean
  startElement: IElement
  endElement: IElement
  startPageNo: number
  endPageNo: number
  startRowNo: number
  endRowNo: number
  rangeRects: RangeRect[]
  zone: EditorZone
  isTable: boolean
  trIndex: number | null
  tdIndex: number | null
  tableElement: IElement | null
  selectionText: string | null
  selectionElementList: IElement[]
  titleId: string | null
  titleStartPageNo: number | null
}

export interface IRangeParagraphInfo {
  elementList: IElement[]
  startIndex: number
}

export type IRangeElementStyle = Pick<
  IElementStyle,
  | 'bold'
  | 'color'
  | 'highlight'
  | 'font'
  | 'size'
  | 'italic'
  | 'underline'
  | 'strikeout'
>
