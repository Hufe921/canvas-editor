import { AreaLocationPosition } from '../dataset/enum/Common'
import { IElement } from './Element'

export interface IInsertAreaOption {
  position?: AreaLocationPosition,
  style?: IAreaStyle,
  id?: string
}

export interface IAreaStyle {
  alpha?: number
  borderColor?: string
  backgroundColor?: string
}

export interface IAreaData {
  style: Map<string, IAreaStyle>
  editingArea: Set<string>
  formArea: Set<string>
}

export interface IGetAreaValueOption {
  extraPickAttrs?: Array<keyof IElement>,
  id: string
}