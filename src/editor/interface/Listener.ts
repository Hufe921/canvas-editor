import { EditorZone, PageMode } from '../dataset/enum/Editor'
import { ElementType } from '../dataset/enum/Element'
import { ListStyle, ListType } from '../dataset/enum/List'
import { RowFlex } from '../dataset/enum/Row'
import { TitleLevel } from '../dataset/enum/Title'
import { IControlChangeResult, IControlContentChangeResult } from './Control'
import { IEditorResult } from './Editor'
import { IElement } from './Element'
import { IPositionContext } from './Position'
import { ITextDecoration } from './Text'

export interface IRangeStyle {
  type: ElementType | null
  undo: boolean
  redo: boolean
  painter: boolean
  font: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikeout: boolean
  color: string | null
  highlight: string | null
  rowFlex: RowFlex | null
  rowMargin: number
  dashArray: number[]
  level: TitleLevel | null
  listType: ListType | null
  listStyle: ListStyle | null
  groupIds: string[] | null
  textDecoration: ITextDecoration | null
  extension?: unknown | null
}

export type IRangeStyleChange = (payload: IRangeStyle) => void

export type IVisiblePageNoListChange = (payload: number[]) => void

export type IIntersectionPageNoChange = (payload: number) => void

export type IPageSizeChange = (payload: number) => void

export type IPageScaleChange = (payload: number) => void

export type ISaved = (payload: IEditorResult) => void

export type IContentChange = () => void

export type IControlChange = (payload: IControlChangeResult) => void

export type IControlContentChange = (
  payload: IControlContentChangeResult
) => void

export type IPageModeChange = (payload: PageMode) => void

export type IZoneChange = (payload: EditorZone) => void

export type IMouseEventChange = (evt: MouseEvent) => void

export interface IPositionContextChangePayload {
  value: IPositionContext
  oldValue: IPositionContext
}

export type IPositionContextChange = (
  payload: IPositionContextChangePayload
) => void

export type IImageSizeChange = (payload: { element: IElement }) => void
