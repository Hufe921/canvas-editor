import { AreaLocationPosition } from '../dataset/enum/Common'

export interface IInsertAreaOption {
  position?: AreaLocationPosition,
  style?: IAreaStyle
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