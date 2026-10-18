import type { LayoutRow } from './LayoutRow'
import { ImageDisplay } from '../dataset/enum/Common'
import { EditorZone } from '../dataset/enum/Editor'
import { IElement, IElementPosition } from './Element'
import { IRange } from './Range'
import { ITd } from './table/Td'

export interface ICurrentPosition {
  nativeCaret?: import('../core/layout/InteractionGeometry').NativeCaret
  index: number
  x?: number
  y?: number
  isCheckbox?: boolean
  isRadio?: boolean
  isControl?: boolean
  isImage?: boolean
  isLabel?: boolean
  isTable?: boolean
  isDirectHit?: boolean
  trIndex?: number
  tdIndex?: number
  tdValueIndex?: number
  tdId?: string
  trId?: string
  tableId?: string
  tablePath?: ITablePositionContext[]
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
  isLabel?: boolean
  isDirectHit?: boolean
  index?: number
  trIndex?: number
  tdIndex?: number
  tdId?: string
  trId?: string
  tableId?: string
  tablePath?: ITablePositionContext[]
}

export interface ITablePositionContext {
  index: number
  trIndex: number
  tdIndex: number
  tdId?: string
  trId?: string
  tableId?: string
}

export interface IComputeRowPositionPayload {
  row: LayoutRow
  innerWidth: number
}

export interface IComputePageRowPositionPayload {
  clip?: import('./Layout').LayoutRect
  positionList: IElementPosition[]
  rowList: LayoutRow[]
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
  tablePosition?: IElementPosition
}

export interface IComputePageRowPositionResult {
  x: number
  y: number
  index: number
}

export interface IComputePositionListPayload {
  // 首个变动页码：该页之前的页位置/浮动/跨页表格片段可复用缓存
  fromPageNo?: number
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
