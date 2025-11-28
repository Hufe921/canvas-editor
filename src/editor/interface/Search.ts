import { EditorContext } from '../dataset/enum/Editor'
import { IElementPosition } from './Element'
import { IRange } from './Range'

export interface ISearchResultBasic {
  type: EditorContext
  index: number
  groupId: string
}

export interface ISearchResultRestArgs {
  tableId?: string
  tableIndex?: number
  trIndex?: number
  tdIndex?: number
  tdId?: string
  startIndex?: number
}

export type ISearchResult = ISearchResultBasic & ISearchResultRestArgs

export interface ISearchResultContext {
  range: IRange
  startPosition: IElementPosition
  endPosition: IElementPosition
}

export interface IReplaceOption {
  index?: number
}

export interface ISearchOption {
  isRegEnable?: boolean
  isIgnoreCase?: boolean
}
