import { TextDirection } from '../../dataset/enum/TextDirection'

export type ResolvedTextDirection = TextDirection.LTR | TextDirection.RTL

export interface IBidiTextItem {
  value: string
}

export interface IBidiResult {
  direction: ResolvedTextDirection
  levels: number[]
  visualIndexes: number[]
}
