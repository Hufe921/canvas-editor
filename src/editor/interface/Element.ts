import { ElementType } from "../dataset/enum/Element"
import { RowFlex } from "../dataset/enum/Row"
import { IColgroup } from "./table/Colgroup"
import { ITr } from "./table/Tr"

export interface IElementBasic {
  id?: string;
  type?: ElementType;
  value: string;
}

export interface IElementStyle {
  font?: string;
  size?: number;
  width?: number;
  height?: number;
  bold?: boolean;
  color?: string;
  highlight?: string;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  rowFlex?: RowFlex;
  rowMargin?: number;
}

export interface ITableAttr {
  colgroup?: IColgroup[];
  trList?: ITr[];
}

export interface ITableElement {
  tdId?: string;
  trId?: string;
  tableId?: string;
}

export interface IHyperlinkElement {
  valueList?: IElement[];
  url?: string;
  hyperlinkId?: string;
}

export type ITable = ITableAttr & ITableElement

export interface ISuperscriptSubscript {
  actualSize?: number;
}

export type IElement = IElementBasic & IElementStyle & ITable & IHyperlinkElement & ISuperscriptSubscript

export interface IElementMetrics {
  width: number;
  height: number;
  boundingBoxAscent: number;
  boundingBoxDescent: number;
}

export interface IElementPosition {
  pageNo: number;
  index: number;
  value: string,
  rowNo: number;
  ascent: number;
  lineHeight: number;
  metrics: IElementMetrics;
  isLastLetter: boolean,
  coordinate: {
    leftTop: number[];
    leftBottom: number[];
    rightTop: number[];
    rightBottom: number[];
  }
}

export interface IElementFillRect {
  x: number;
  y: number;
  width: number;
  height: number;
}