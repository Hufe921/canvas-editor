import { ITd } from './Td'

export interface ITr {
  id?: string
  height: number
  tdList: ITd[]
  minHeight?: number
}
