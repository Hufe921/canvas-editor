import { ControlComponent, ImageDisplay } from '../dataset/enum/Control'
import { ElementType } from '../dataset/enum/Element'
import { ListStyle, ListType } from '../dataset/enum/List'
import { RowFlex } from '../dataset/enum/Row'
import { TitleLevel } from '../dataset/enum/Title'
import { TableBorder } from '../dataset/enum/table/Table'
import { IBlock } from './Block'
import { ICheckbox } from './Checkbox'
import { IControl } from './Control'
import { IColgroup } from './table/Colgroup'
import { ITr } from './table/Tr'

export interface IElementBasic {
  id?: string
  type?: ElementType
  value: string
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
  letterSpacing?: number
}

export interface ITitleElement {
  valueList?: IElement[]
  level?: TitleLevel
  titleId?: string
}

export interface IListElement {
  valueList?: IElement[]
  listType?: ListType
  listStyle?: ListStyle
  listId?: string
  listWrap?: boolean
}

export interface ITableAttr {
  colgroup?: IColgroup[]
  trList?: ITr[]
  borderType?: TableBorder
}

export interface ITableElement {
  tdId?: string
  trId?: string
  tableId?: string
}

export type ITable = ITableAttr & ITableElement

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
}

export interface IControlElement {
  control?: IControl
  controlId?: string
  controlComponent?: ControlComponent
}

export interface ICheckboxElement {
  checkbox?: ICheckbox
}

export interface ILaTexElement {
  laTexSVG?: string
}

export interface IDateElement {
  dateFormat?: string
  dateId?: string
}

export interface IImageElement {
  imgDisplay?: ImageDisplay
}

export interface IBlockElement {
  block?: IBlock
}

export type IElement = IElementBasic &
  IElementStyle &
  ITable &
  IHyperlinkElement &
  ISuperscriptSubscript &
  ISeparator &
  IControlElement &
  ICheckboxElement &
  ILaTexElement &
  IDateElement &
  IImageElement &
  IBlockElement &
  ITitleElement &
  IListElement

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
  metrics: IElementMetrics
  isFirstLetter: boolean
  isLastLetter: boolean
  coordinate: {
    leftTop: number[]
    leftBottom: number[]
    rightTop: number[]
    rightBottom: number[]
  }
}

export interface IElementFillRect {
  x: number
  y: number
  width: number
  height: number
}
