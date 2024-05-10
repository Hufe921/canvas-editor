import { IElement, ImageDisplay } from '..'
import { EditorZone } from '../dataset/enum/Editor'
import { IElementPosition } from './Element'
import { IRow } from './Row'
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
  imgDisplay: ImageDisplay
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
