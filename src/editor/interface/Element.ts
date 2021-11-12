export interface IElement {
  type?: 'TEXT' | 'IMAGE';
  value: string;
  font?: string;
  size?: number;
  width?: number;
  height?: number;
  bold?: boolean;
  color?: string;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
}

export interface IElementPosition {
  index: number;
  value: string,
  rowNo: number;
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