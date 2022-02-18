import { ElementType } from ".."
import { RowFlex } from "../dataset/enum/Row"
import { IEditorResult } from "./Editor"

export interface IRangeStyle {
  type: ElementType | null;
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
  rowMargin: number;
  dashArray: number[];
}

export type IRangeStyleChange = (payload: IRangeStyle) => void

export type IVisiblePageNoListChange = (payload: number[]) => void

export type IIntersectionPageNoChange = (payload: number) => void

export type IPageSizeChange = (payload: number) => void

export type IPageScaleChange = (payload: number) => void

export type ISaved = (payload: IEditorResult) => void

export type IContentChange = () => void
