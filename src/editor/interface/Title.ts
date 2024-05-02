import { EditorZone } from '../dataset/enum/Editor'
import { IElement } from './Element'

export interface ITitleSizeOption {
  defaultFirstSize?: number
  defaultSecondSize?: number
  defaultThirdSize?: number
  defaultFourthSize?: number
  defaultFifthSize?: number
  defaultSixthSize?: number
}

export type ITitleOption = ITitleSizeOption & {}

export interface ITitle {
  conceptId?: string
}

export interface IGetTitleValueOption {
  conceptId: string
}

export type IGetTitleValueResult = (ITitle & {
  value: string | null
  elementList: IElement[]
  zone: EditorZone
})[]
