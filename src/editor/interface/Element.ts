import { RowFlex } from "../dataset/enum/Row"

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
}

export interface IElementBasic {
  type?: 'TEXT' | 'IMAGE';
  value: string;
}

export type IElement = IElementBasic & IElementStyle

export interface IElementPosition {
  index: number;
  value: string,
  rowNo: number;
  ascent: number;
  lineHeight: number;
  metrics: TextMetrics;
  isLastLetter: boolean,
  coordinate: {
    leftTop: number[];
    leftBottom: number[];
    rightTop: number[];
    rightBottom: number[];
  }
}