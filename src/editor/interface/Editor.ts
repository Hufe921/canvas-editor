import {
  EditorMode,
  PageMode,
  PaperDirection,
  RenderMode,
  WordBreak
} from '../dataset/enum/Editor'
import { IColumnOption } from './Column'
import { IBackgroundOption } from './Background'
import { ICheckboxOption } from './Checkbox'
import { IRadioOption } from './Radio'
import { IControlOption } from './Control'
import { ICursorOption } from './Cursor'
import { IFooter } from './Footer'
import { IGroup } from './Group'
import { IHeader } from './Header'
import { ILabelOption } from './Label'
import { IImgCaptionOption, IListOption } from './Element'
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
import { ILineNumberOption } from './LineNumber'
import { IPageBorderOption } from './PageBorder'
import { IBadgeOption } from './Badge'
import { IElement } from './Element'
import { LocationPosition } from '../dataset/enum/Common'
import { IRange } from './Range'
import { IGraffitiData, IGraffitiOption } from './Graffiti'
import { IWhiteSpaceOption } from './WhiteSpace'
import { IMagnifierOption } from './Magnifier'
import { IAccessibilityOption } from './Accessibility'
import { ITraceOption } from './Trace'
import { IRulerOption } from './Ruler'
import { IHintOption } from './Hint'
import type { ISpellcheckOption } from './Spellcheck'

export interface ILabOption {
  /**
   * 行级增量行计算：编辑时仅从受影响行断点续算，区间外行复用。
   * 复杂结构（表格/控件/浮动图/分栏/minWidth 控件占位等）自动退化全量。
   * 默认：false
   */
  incrementalCompute?: boolean
}

export interface IEditorData {
  header?: IElement[]
  main: IElement[]
  footer?: IElement[]
  graffiti?: IGraffitiData[]
}

export interface IEditorOption {
  mode?: EditorMode
  locale?: string
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
  spellcheck?: ISpellcheckOption
  highlightAlpha?: number
  highlightMarginHeight?: number
  resizerColor?: string
  resizerSize?: number
  marginIndicatorSize?: number
  marginIndicatorColor?: string
  margins?: IMargin
  pageMode?: PageMode
  renderMode?: RenderMode
  defaultHyperlinkColor?: string
  paperDirection?: PaperDirection
  inactiveAlpha?: number
  historyMaxRecordCount?: number
  printPixelRatio?: number
  maskMargin?: IMargin
  letterClass?: string[]
  contextMenuDisableKeys?: string[]
  shortcutDisableKeys?: string[]
  scrollContainerSelector?: string
  pageOuterSelectionDisable?: boolean
  wordBreak?: WordBreak
  // 实验性功能（逐项默认关闭，未来可能调整或移除）
  lab?: ILabOption
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
  whiteSpace?: IWhiteSpaceOption
  separator?: ISeparatorOption
  lineNumber?: ILineNumberOption
  pageBorder?: IPageBorderOption
  badge?: IBadgeOption
  modeRule?: IModeRule
  graffiti?: IGraffitiOption
  label?: ILabelOption
  imgCaption?: IImgCaptionOption
  list?: IListOption
  magnifier?: IMagnifierOption
  accessibility?: IAccessibilityOption
  column?: IColumnOption
  trace?: ITraceOption
  ruler?: IRulerOption
  hint?: IHintOption
}

export interface IEditorResult {
  version: string
  data: IEditorData
  options: IEditorOption
}

export interface IEditorHTML {
  header: string
  main: string
  footer: string
}

export type IEditorText = IEditorHTML

export type IUpdateOption = Omit<
  IEditorOption,
  | 'mode'
  | 'width'
  | 'height'
  | 'scale'
  | 'pageGap'
  | 'pageMode'
  | 'paperDirection'
  | 'historyMaxRecordCount'
  | 'scrollContainerSelector'
>

export interface ISetValueOption {
  isSetCursor?: boolean
}

export interface IFocusOption {
  rowNo?: number
  range?: IRange
  position?: LocationPosition
  isMoveCursorToVisible?: boolean
}

export interface IPrintModeRule {
  imagePreviewerDisabled?: boolean
  backgroundDisabled?: boolean
  filterEmptyControl?: boolean
  areaHideDisabled?: boolean
}

export interface IReadonlyModeRule {
  imagePreviewerDisabled?: boolean
}

export interface IFormModeRule {
  controlDeletableDisabled?: boolean
}

export interface IModeRule {
  [EditorMode.PRINT]?: IPrintModeRule
  [EditorMode.READONLY]?: IReadonlyModeRule
  [EditorMode.FORM]?: IFormModeRule
}
