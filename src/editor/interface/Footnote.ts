import { LocationPosition } from '../dataset/enum/Common'
import { IElement } from './Element'

export interface IFootnoteOption {
  size?: number
  color?: string
  lineColor?: string
  lineWidth?: number
  gap?: number
}

export interface IInsertFootnoteOption {
  id?: string
  value: IElement[]
}

export interface ISetFootnoteValueOption {
  id: string
  value: IElement[]
}

export interface IGetFootnoteValueOption {
  id: string
}

export interface IGetFootnoteValueResult {
  id: string
  value: IElement[]
}

export interface ILocationFootnoteOption {
  position?: LocationPosition
}
