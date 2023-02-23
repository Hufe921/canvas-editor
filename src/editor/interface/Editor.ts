import { IElement } from '..'
import { EditorMode, PageMode } from '../dataset/enum/Editor'
import { ICheckboxOption } from './Checkbox'
import { IControlOption } from './Control'
import { ICursorOption } from './Cursor'
import { IHeader } from './Header'
import { IMargin } from './Margin'
import { IWatermark } from './Watermark'

export interface IEditorOption {
  mode?: EditorMode;
  defaultType?: string;
  defaultFont?: string;
  defaultSize?: number;
  defaultBasicRowMarginHeight?: number;
  defaultRowMargin?: number;
  defaultTabWidth?: number;
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
  searchNavigateMatchColor?: string;
  searchMatchAlpha?: number;
  highlightAlpha?: number;
  resizerColor?: string;
  resizerSize?: number;
  marginIndicatorSize?: number;
  marginIndicatorColor?: string,
  margins?: IMargin,
  pageMode?: PageMode;
  tdPadding?: number;
  defaultTdHeight?: number;
  defaultHyperlinkColor?: string;
  headerTop?: number;
  header?: IHeader;
  watermark?: IWatermark;
  control?: IControlOption;
  checkbox?: ICheckboxOption;
  cursor?: ICursorOption;
}

export interface IEditorResult {
  version: string;
  width: number;
  height: number;
  margins: IMargin;
  header?: IHeader;
  watermark?: IWatermark;
  data: IElement[];
}