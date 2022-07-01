import { IElementPosition } from './Element'
import { IRow } from './Row'

export interface IDrawOption {
  curIndex?: number;
  isSetCursor?: boolean;
  isSubmitHistory?: boolean;
  isComputeRowList?: boolean;
}

export interface IDrawImagePayload {
  width: number;
  height: number;
  value: string;
}

export interface IDrawRowPayload {
  positionList: IElementPosition[];
  rowList: IRow[];
  pageNo: number;
  startIndex: number;
  startX: number;
  startY: number;
  innerWidth: number;
}

export interface IDrawRowResult {
  x: number;
  y: number;
  index: number;
}

export interface IPainterOptions {
  isDblclick: boolean;
}