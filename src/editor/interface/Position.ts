import { ImageDisplay } from '../dataset/enum/Common'
import { EditorZone } from '../dataset/enum/Editor'
import { IElement, IElementFillRect, IElementPosition } from './Element'
import { IRange } from './Range'
import { IRow, IRowElement } from './Row'
import { ITd } from './table/Td'

export interface ICurrentPosition {
  index: number
  x?: number
  y?: number
  isCheckbox?: boolean
  isRadio?: boolean
  isControl?: boolean
  isImage?: boolean
  isTable?: boolean
  isDirectHit?: boolean
  trIndex?: number
  tdIndex?: number
  tdValueIndex?: number
  tdId?: string
  trId?: string
  tableId?: string
  zone?: EditorZone
  hitLineStartIndex?: number
}

export interface IGetPositionByXYPayload {
  x: number
  y: number
  pageNo?: number
  isTable?: boolean
  td?: ITd
  tablePosition?: IElementPosition
  elementList?: IElement[]
  positionList?: IElementPosition[]
}

export type IGetFloatPositionByXYPayload = IGetPositionByXYPayload & {
  imgDisplays: ImageDisplay[]
}

export interface IPositionContext {
  isTable: boolean
  isCheckbox?: boolean
  isRadio?: boolean
  isControl?: boolean
  isImage?: boolean
  isDirectHit?: boolean
  index?: number
  trIndex?: number
  tdIndex?: number
  tdId?: string
  trId?: string
  tableId?: string
}

export interface IComputeRowPositionPayload {
  row: IRow
  innerWidth: number
}

export interface IComputePageRowPositionPayload {
  positionList: IElementPosition[]
  rowList: IRow[]
  pageNo: number
  startRowIndex: number
  startIndex: number
  startX: number
  startY: number
  innerWidth: number
  isTable?: boolean
  index?: number
  tdIndex?: number
  trIndex?: number
  tdValueIndex?: number
  zone?: EditorZone
}

export interface IComputePageRowPositionResult {
  x: number
  y: number
  index: number
}

export interface IFloatPosition {
  pageNo: number
  element: IElement
  position: IElementPosition
  isTable?: boolean
  index?: number
  tdIndex?: number
  trIndex?: number
  tdValueIndex?: number
  zone?: EditorZone
}

export interface ILocationPosition {
  zone: EditorZone
  range: IRange
  positionContext: IPositionContext
}

export interface ISetSurroundPositionPayload {
  row: IRow
  rowElement: IRowElement
  rowElementRect: IElementFillRect
  pageNo: number
  availableWidth: number
  surroundElementList: IElement[]
}
