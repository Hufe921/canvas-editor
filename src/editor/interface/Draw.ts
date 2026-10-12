import { ImageDisplay } from '../dataset/enum/Common'
import { EditorMode, EditorZone } from '../dataset/enum/Editor'
import { IElement, IElementPosition } from './Element'
import { IRow, IRowComputeState, IRowElement } from './Row'

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
  rowList: IRow[]
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
  rowList: IRow[]
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
  startX?: number
  startY?: number
  isFromTable?: boolean
  isPagingMode?: boolean
  pageHeight?: number
  surroundElementList?: IElement[]
  /**
   * 断点续算：从 state 对应的行首元素（startIndex）重新参与断行，
   * 到与某个旧行状态收敛（converge 返回 true）或文档末尾即止，
   * 收敛点之后的旧行对象可原样复用。
   */
  resume?: IComputeRowListResume
}

export interface IComputeRowListResume {
  // 续算起始元素索引（须为行首元素，或 0）
  startIndex: number
  // 起始时刻的跨行状态快照
  state: IRowComputeState
  // 续算点上一行的末元素（行首隐藏元素的高度继承自它的度量）
  preRowLastElement?: IRowElement
  // 遇到复杂结构元素（表格/图片/控件等）时返回 true 中止续算，调用方退化全量
  shouldAbort?: (element: IElement, index: number) => boolean
  // 新行诞生回调：返回 true 表示与旧行状态收敛，续算提前结束
  converge?: (
    state: IRowComputeState,
    firstElement: IElement,
    startIndex: number
  ) => boolean
}

// 行级增量计算结果：合并后的行列表 + 首个变动行
export interface IIncrementalRowListResult {
  rowList: IRow[]
  firstChangedRow: IRow
}
