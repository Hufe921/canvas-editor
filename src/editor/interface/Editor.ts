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
import {
  CaretMovement,
  TextDirection,
  TextEngineMode
} from '../dataset/enum/TextDirection'
import { IEditorFontFace } from './TextEngine'

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
  /** Text layout engine: legacy measureText path or HarfBuzz */
  textEngine?: TextEngineMode
  /**
   * LTR/RTL mode for editor UI chrome only (toolbar/shell `dir`, host toggle).
   * Also used as default `element.direction` when creating new lines/tables.
   * Does not affect existing content layout, paint, or hit-testing.
   * Default: ltr. Command: executeUiDirection
   */
  direction?: TextDirection.LTR | TextDirection.RTL
  /**
   * Whether host toolbar may show the LTR/RTL mode toggle.
   * Default: true. Set false to hide the control (demo reads this flag).
   */
  uiDirectionToggle?: boolean
  /**
   * Default when resolving existing content without element.direction
   * (AUTO detects from strong characters). Not the UI mode; not rewritten
   * by executeUiDirection. Default: auto
   */
  defaultDirection?: TextDirection
  /** Arrow-key caret movement semantics */
  caretMovement?: CaretMovement
  /** Font binaries registered for HarfBuzz shaping */
  fonts?: IEditorFontFace[]
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
