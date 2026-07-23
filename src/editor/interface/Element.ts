import { ImageDisplay } from '../dataset/enum/Common'
import { ControlComponent } from '../dataset/enum/Control'
import { ElementType } from '../dataset/enum/Element'
import { TraceType } from '../dataset/enum/Trace'
import { ListStyle, ListType } from '../dataset/enum/List'
import { RowFlex } from '../dataset/enum/Row'
import { TitleLevel } from '../dataset/enum/Title'
import { TableBorder } from '../dataset/enum/table/Table'
import { IArea } from './Area'
import { IBlock } from './Block'
import { ICheckbox } from './Checkbox'
import { IPadding } from './Common'
import { IControl } from './Control'
import { IRadio } from './Radio'
import { ITextDecoration } from './Text'
import { ITitle } from './Title'
import { IColgroup } from './table/Colgroup'
import { ITd } from './table/Td'
import { ITr } from './table/Tr'

export interface IElementBasic {
  id?: string
  type?: ElementType
  value: string
  extension?: unknown
  externalId?: string
}

export interface IElementStyle {
  font?: string
  size?: number
  width?: number
  height?: number
  bold?: boolean
  color?: string
  highlight?: string
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
  rowFlex?: RowFlex
  rowMargin?: number
  level?: TitleLevel
  title?: ITitle
  letterSpacing?: number
  textDecoration?: ITextDecoration
}

export interface IElementRule {
  hide?: boolean
}

export interface IElementGroup {
  groupIds?: string[]
}

export interface ITraceRecord {
  type: TraceType
  author?: string
  timestamp?: number
}

export interface IElementTrace {
  trace?: ITraceRecord[]
}

export interface ITitleElement {
  valueList?: IElement[]
  level?: TitleLevel
  titleId?: string
  title?: ITitle
}

export interface IListElement {
  valueList?: IElement[]
  listType?: ListType
  listStyle?: ListStyle
  listId?: string
  listWrap?: boolean
  listLevel?: number
}

export interface ITableAttr {
  colgroup?: IColgroup[]
  trList?: ITr[]
  borderType?: TableBorder
  borderColor?: string
  borderWidth?: number
  borderExternalWidth?: number
  translateX?: number
}

export interface ITableRule {
  tableToolDisabled?: boolean
}

export interface ITableElement {
  tdId?: string
  trId?: string
  tableId?: string
  conceptId?: string
}

export type ITable = ITableAttr & ITableRule & ITableElement

export interface IHyperlinkElement {
  valueList?: IElement[]
  url?: string
  hyperlinkId?: string
}

export interface ISuperscriptSubscript {
  actualSize?: number
}

export interface ISeparator {
  dashArray?: number[]
  lineWidth?: number
}

export interface IControlElement {
  control?: IControl
  controlId?: string
  controlComponent?: ControlComponent
  isControlMinWidthPlaceholder?: boolean
}

export interface ICheckboxElement {
  checkbox?: ICheckbox
}

export interface IRadioElement {
  radio?: IRadio
}

export interface ILaTexElement {
  laTexSVG?: string
}

export interface IDateElement {
  dateFormat?: string
  dateId?: string
}

export interface IImageRule {
  imgToolDisabled?: boolean
  imgPreviewDisabled?: boolean
}

export interface IImageCrop {
  x: number
  y: number
  width: number
  height: number
}

export interface IImageCaption {
  value: string
  color?: string
  font?: string
  size?: number
  top?: number
}

export interface IImgCaptionOption {
  color?: string
  font?: string
  size?: number
  top?: number
}

export interface IListOption {
  inheritStyle?: boolean // 是否让列表序号继承文字样式
}

export interface IImageBasic {
  imgDisplay?: ImageDisplay
  imgFloatPosition?: {
    x: number
    y: number
    pageNo?: number
  }
  imgCrop?: IImageCrop
  imgCaption?: IImageCaption
}

export type IImageElement = IImageBasic & IImageRule

export interface IBlockElement {
  block?: IBlock
}

export interface IAreaElement {
  valueList?: IElement[]
  areaId?: string
  areaIndex?: number
  area?: IArea
}

export interface ILabelElement {
  labelId?: string
  label?: {
    color?: string
    backgroundColor?: string
    borderRadius?: number
    padding?: IPadding
  }
}

export type IElement = IElementBasic &
  IElementStyle &
  IElementRule &
  IElementGroup &
  IElementTrace &
  ITable &
  IHyperlinkElement &
  ISuperscriptSubscript &
  ISeparator &
  IControlElement &
  ICheckboxElement &
  IRadioElement &
  ILaTexElement &
  IDateElement &
  IImageElement &
  IBlockElement &
  ITitleElement &
  IListElement &
  IAreaElement &
  ILabelElement

export interface IElementMetrics {
  width: number
  height: number
  boundingBoxAscent: number
  boundingBoxDescent: number
}

export interface IElementPosition {
  pageNo: number
  index: number
  value: string
  rowIndex: number
  rowNo: number
  ascent: number
  lineHeight: number
  left: number
  metrics: IElementMetrics
  isFirstLetter: boolean
  isLastLetter: boolean
  columnIndex?: number
  tableFragment?: ITableRowFragment // 表格跨页渲染片段信息
  coordinate: {
    leftTop: number[]
    leftBottom: number[]
    rightTop: number[]
    rightBottom: number[]
  }
}

// 表格跨页渲染片段（数据层保持单一表格，仅渲染时按页拆分行）
export interface ITableRowFragment {
  startTrIndex: number // 片段起始行索引（含）
  endTrIndex: number // 片段结束行索引（不含）
  skipHeight: number // 片段之前所有行高度和（未缩放，与 td.y 同单位）
  repeatHeight: number // 续页回显表头高度和（未缩放，首页为 0）
  repeatTrIndexes?: number[] // 续页需回显的 pagingRepeat 表头行索引
  // 起始行为上一页拆分行的续排：该行在之前页已消耗的高度（未缩放）
  startSplitTrOffset?: number
  // 结束行在本页被拆分：该行截止到本页末累计消耗的高度（未缩放）
  endSplitTrHeight?: number
  // 从之前行带入片段的跨行合并单元格（渲染层缓存，避免逐片段全表扫描）
  carriedTds?: ITd[]
}

export interface IElementFillRect {
  x: number
  y: number
  width: number
  height: number
}

export interface IUpdateElementByIdOption {
  id?: string
  conceptId?: string
  properties: Omit<Partial<IElement>, 'id'>
}

export interface IDeleteElementByIdOption {
  id?: string
  conceptId?: string
}

export interface IGetElementByIdOption {
  id?: string
  conceptId?: string
}

export interface IInsertElementListOption {
  isReplace?: boolean
  isSubmitHistory?: boolean
  ignoreContextKeys?: Array<keyof IElement>
}

export interface ISpliceElementListOption {
  isIgnoreDeletedRule?: boolean
}
