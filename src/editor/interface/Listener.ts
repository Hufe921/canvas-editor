import { RowFlex } from "../dataset/enum/Row"

export interface IRangeStype {
  undo: boolean;
  redo: boolean;
  painter: boolean;
  font: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeout: boolean;
  color: string | null;
  highlight: string | null;
  rowFlex: RowFlex | null;
  rowMargin: number
}

export type IRangeStyleChange = (payload: IRangeStype) => void

export type IVisiblePageNoListChange = (payload: number[]) => void

export type IIntersectionPageNoChange = (payload: number) => void

export type IPageSizeChange = (payload: number) => void

export type IPageScaleChange = (payload: number) => void
