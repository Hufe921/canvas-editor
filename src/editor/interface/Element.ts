import { ElementType } from "../dataset/enum/Element"
import { RowFlex } from "../dataset/enum/Row"

export interface IElementMetrics {
  width: number;
  height: number;
  boundingBoxAscent: number;
  boundingBoxDescent: number;
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

export interface IElementBasic {
  id?: string;
  type?: ElementType;
  value: string;
}

export type IElement = IElementBasic & IElementStyle

export interface IElementPosition {
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