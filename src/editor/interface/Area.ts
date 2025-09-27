import { AreaMode } from '../dataset/enum/Area'
import { LocationPosition } from '../dataset/enum/Common'
import { IElement, IElementPosition } from './Element'
import { IPlaceholder } from './Placeholder'
import { IRange } from './Range'

export interface IAreaBasic {
  extension?: unknown
  placeholder?: IPlaceholder
}

export interface IAreaStyle {
  top?: number
  borderColor?: string
  backgroundColor?: string
}

export interface IAreaRule {
  mode?: AreaMode
  hide?: boolean
  deletable?: boolean
}

export type IArea = IAreaBasic & IAreaStyle & IAreaRule

export interface IInsertAreaOption {
  id?: string
  area: IArea
  value: IElement[]
  position?: LocationPosition
  range?: Pick<IRange, 'startIndex' | 'endIndex'>
}

export interface ISetAreaValueOption {
  id?: string
  value: IElement[]
}

export interface ISetAreaPropertiesOption {
  id?: string
  properties: IArea
}

export interface IGetAreaValueOption {
  id?: string
}

export interface IGetAreaValueResult {
  id?: string
  area: IArea
  startPageNo: number
  endPageNo: number
  value: IElement[]
}

export interface IAreaInfo {
  id: string
  area: IArea
  elementList: IElement[]
  positionList: IElementPosition[]
}

export interface ILocationAreaOption {
  position: LocationPosition
  isAppendLastLineBreak?: boolean
}
