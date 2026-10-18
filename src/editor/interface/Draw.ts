import type { LayoutNode, LayoutScopeId } from './Layout'
import type { LayoutRow } from './LayoutRow'
import { ImageDisplay } from '../dataset/enum/Common'
import { EditorMode, EditorZone } from '../dataset/enum/Editor'
import { TextDirection } from '../dataset/enum/TextDirection'
import { IElement, IElementPosition } from './Element'

export interface IDrawOption {
  curIndex?: number
  isSetCursor?: boolean
  isSubmitHistory?: boolean
  isCompute?: boolean
  isLazy?: boolean
  isInit?: boolean
  isSourceHistory?: boolean
  isFirstRender?: boolean
}

// 编辑影响区间（元素索引，左闭右开）：增量续算的起点与收敛防线
export interface IComputeRange {
  startIndex: number
  endIndex: number
}

export interface IForceUpdateOption {
  isSubmitHistory?: boolean
}

export interface IDrawImagePayload {
  id?: string
  conceptId?: string
  width: number
  height: number
  value: string
  imgDisplay?: ImageDisplay
  extension?: unknown
}

export interface IDrawRowPayload {
  elementList: IElement[]
  positionList: IElementPosition[]
  rowList: LayoutRow[]
  pageNo: number
  startIndex: number
  innerWidth: number
  zone?: EditorZone
  isDrawLineBreak?: boolean
  isDrawWhiteSpace?: boolean
  isDrawRange?: boolean
}

export interface IDrawFloatPayload {
  pageNo: number
  imgDisplays: ImageDisplay[]
}

export interface IDrawPagePayload {
  elementList: IElement[]
  positionList: IElementPosition[]
  rowList: LayoutRow[]
  pageNo: number
}

export interface IPainterOption {
  isDblclick: boolean
}

export interface IGetValueOption {
  pageNo?: number
  extraPickAttrs?: Array<keyof IElement>
}

export type IGetOriginValueOption = Omit<IGetValueOption, 'extraPickAttrs'>

export interface IAppendElementListOption {
  isPrepend?: boolean
  isSubmitHistory?: boolean
}

export interface IGetImageOption {
  pixelRatio?: number
  mode?: EditorMode
  snapDomFunction?: (iframe: HTMLIFrameElement) => Promise<string>
}

export interface IComputeRowListPayload {
  innerWidth: number
  elementList: IElement[]
  /** Optional native output collector for recursive scope layout. */
  nativeNodes?: LayoutNode[]
  /** Area inherited from an enclosing table; its top gap belongs to the parent. */
  inheritedAreaId?: string
  startX?: number
  startY?: number
  isFromTable?: boolean
  isPagingMode?: boolean
  pageHeight?: number
  surroundElementList?: IElement[]
  /** Direction inherited by text inside a table cell when not explicitly set. */
  defaultDirection?: TextDirection
  /** Alignment inherited by text inside a table cell. */
  defaultAlign?: 'left' | 'right'
  /**
   * Isolate lastLayouts for main / header / footer / td:{id}.
   * Default `main`.
   */
  layoutScope?: LayoutScopeId
  /** Main-document dirty interval for paragraph-safe HarfBuzz reuse. */
  dirtyRange?: IComputeRange
}
