import { IElement } from '..'
import { EditorMode } from '../dataset/enum/Editor'
import { IHeader } from './Header'
import { IWatermark } from './Watermark'

export interface IEditorOption {
  defaultMode?: EditorMode;
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
  margins?: [top: number, right: number, bottom: number, left: number],
  tdPadding?: number;
  defaultTdHeight?: number;
  defaultHyperlinkColor?: string;
  headerTop?: number;
  header?: IHeader;
  watermark?: IWatermark;
}

export interface IEditorResult {
  version: string;
  width: number;
  height: number;
  margins: [top: number, right: number, bottom: number, left: number];
  watermark?: IWatermark;
  data: IElement[];
}