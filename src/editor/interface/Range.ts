import { EditorZone } from '../dataset/enum/Editor'
import { SurroundPosition } from '../dataset/enum/Common'
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

/** Runtime indices are temporary. Stable table ownership and exact container
 * text must be revalidated before restoring a range into another context. */
export interface ILocatedRange {
  zone: EditorZone
  tablePath: { tableId: string; rowId: string; cellId: string }[]
  startIndex: number
  endIndex: number
  sourceText: string
}

export interface ILocatedElementRect {
  pageNo: number
  index: number
  rowNo: number
  columnIndex?: number
  x: number
  y: number
  width: number
  height: number
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
  startColNo: number
  endColNo: number
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
  startParagraphNo: number
  endParagraphNo: number
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

export interface IGetSurroundElementListOption {
  direction?: SurroundPosition
  length?: number
}
