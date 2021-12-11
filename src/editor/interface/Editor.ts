export interface IEditorOption {
  defaultType?: string;
  defaultFont?: string;
  defaultSize?: number;
  defaultBasicRowMarginHeight?: number;
  defaultRowMargin?: number;
  width?: number;
  height?: number;
  scale?: number;
  pageGap?: number;
  pageNumberBottom?: number;
  pageNumberSize?: number;
  pageNumberFont?: string;
  underlineColor?: string;
  strikeoutColor?: string;
  rangeColor?: string;
  rangeAlpha?: number;
  rangeMinWidth?: number;
  searchMatchColor?: string;
  searchMatchAlpha?: number;
  highlightAlpha?: number;
  resizerColor?: string;
  resizerSize?: number;
  marginIndicatorSize?: number;
  marginIndicatorColor?: string,
  margins?: [top: number, right: number, bootom: number, left: number],
  tdPadding?: number;
  defaultTdHeight?: number;
}