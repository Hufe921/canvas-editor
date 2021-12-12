import { EditorContext } from "../dataset/enum/Editor"

export interface ISearchResultBasic {
  type: EditorContext;
  index: number;
}

export interface ISearchResultRestArgs {
  tableIndex?: number;
  trIndex?: number;
  tdIndex?: number;
}

export type ISearchResult = ISearchResultBasic & ISearchResultRestArgs