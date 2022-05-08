import { IElement } from '..'
import { EditorMode } from '../dataset/enum/Editor'
import { ICheckboxOption } from './Checkbox'
import { DeepRequired } from './Common'
import { IControlOption } from './Control'
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
  control?: IControlOption;
  checkbox?: ICheckboxOption;
}

export interface IEditorResult {
  version: string;
  data: IElement[];
  options: DeepRequired<IEditorOption>;
}