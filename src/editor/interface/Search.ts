import { EditorContext } from '../dataset/enum/Editor'

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
