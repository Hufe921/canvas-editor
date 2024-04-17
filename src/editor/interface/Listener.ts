import {
  EditorZone,
  ElementType,
  ListStyle,
  ListType,
  PageMode,
  TitleLevel
} from '..'
import { RowFlex } from '../dataset/enum/Row'
import { IControl } from './Control'
import { IEditorResult } from './Editor'
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

export type IControlChange = (payload: IControl | null) => void

export type IPageModeChange = (payload: PageMode) => void

export type IZoneChange = (payload: EditorZone) => void
