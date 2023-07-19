import { IElement } from '..'
import { EditorZone } from '../dataset/enum/Editor'
import { IElementPosition } from './Element'
import { IRow } from './Row'
import { ITd } from './table/Td'

export interface ICurrentPosition {
  index: number
  isCheckbox?: boolean
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
  isTable?: boolean
  td?: ITd
  tablePosition?: IElementPosition
  elementList?: IElement[]
  positionList?: IElementPosition[]
}

export interface IPositionContext {
  isTable: boolean
  isCheckbox?: boolean
  isControl?: boolean
  index?: number
  trIndex?: number
  tdIndex?: number
  tdId?: string
  trId?: string
  tableId?: string
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
}

export interface IComputePageRowPositionResult {
  x: number
  y: number
  index: number
}
