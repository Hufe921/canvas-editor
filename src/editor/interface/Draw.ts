import { IElementPosition } from './Element'
import { IRow } from './Row'

export interface IDrawOption {
  curIndex?: number;
  isSetCursor?: boolean;
  isSubmitHistory?: boolean;
  isCompute?: boolean;
  isLazy?: boolean;
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
  innerWidth: number;
}

export interface IPainterOptions {
  isDblclick: boolean;
}