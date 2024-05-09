import { IElement } from '..'
import {
  EditorMode,
  PageMode,
  PaperDirection,
  WordBreak
} from '../dataset/enum/Editor'
import { IBackgroundOption } from './Background'
import { ICheckboxOption } from './Checkbox'
import { IRadioOption } from './Radio'
import { IControlOption } from './Control'
import { ICursorOption } from './Cursor'
import { IFooter } from './Footer'
import { IGroup } from './Group'
import { IHeader } from './Header'
import { ILineBreakOption } from './LineBreak'
import { IMargin } from './Margin'
import { IPageBreak } from './PageBreak'
import { IPageNumber } from './PageNumber'
import { IPlaceholder } from './Placeholder'
import { ITitleOption } from './Title'
import { IWatermark } from './Watermark'
import { IZoneOption } from './Zone'
import { ISeparatorOption } from './Separator'
import { ITableOption } from './table/Table'

export interface IEditorData {
  header?: IElement[]
  main: IElement[]
  footer?: IElement[]
}

export interface IEditorOption {
  mode?: EditorMode
  defaultType?: string
  defaultColor?: string
  defaultFont?: string
  defaultSize?: number
  minSize?: number
  maxSize?: number
  defaultBasicRowMarginHeight?: number
  defaultRowMargin?: number
  defaultTabWidth?: number
  width?: number
  height?: number
  scale?: number
  pageGap?: number
  underlineColor?: string
  strikeoutColor?: string
  rangeColor?: string
  rangeAlpha?: number
  rangeMinWidth?: number
  searchMatchColor?: string
  searchNavigateMatchColor?: string
  searchMatchAlpha?: number
  highlightAlpha?: number
  resizerColor?: string
  resizerSize?: number
  marginIndicatorSize?: number
  marginIndicatorColor?: string
  margins?: IMargin
  pageMode?: PageMode
  defaultHyperlinkColor?: string
  paperDirection?: PaperDirection
  inactiveAlpha?: number
  historyMaxRecordCount?: number
  printPixelRatio?: number
  maskMargin?: IMargin
  letterClass?: string[]
  contextMenuDisableKeys?: string[]
  scrollContainerSelector?: string
  wordBreak?: WordBreak
  table?: ITableOption
  header?: IHeader
  footer?: IFooter
  pageNumber?: IPageNumber
  watermark?: IWatermark
  control?: IControlOption
  checkbox?: ICheckboxOption
  radio?: IRadioOption
  cursor?: ICursorOption
  title?: ITitleOption
  placeholder?: IPlaceholder
  group?: IGroup
  pageBreak?: IPageBreak
  zone?: IZoneOption
  background?: IBackgroundOption
  lineBreak?: ILineBreakOption
  separator?: ISeparatorOption
}

export interface IEditorResult {
  version: string
  width: number
  height: number
  margins: IMargin
  watermark?: IWatermark
  data: IEditorData
}

export interface IEditorHTML {
  header: string
  main: string
  footer: string
}

export type IEditorText = IEditorHTML
