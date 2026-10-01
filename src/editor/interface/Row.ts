import { PaperDirection } from '../dataset/enum/Editor'
import { RowFlex } from '../dataset/enum/Row'
import {
  IElement,
  IElementMetrics,
  IElementPosition,
  ITableRowFragment
} from './Element'
import { IMargin } from './Margin'
import { ITd } from './table/Td'

export type IRowElement = IElement & {
  metrics: IElementMetrics
  style: string
  left?: number
}

export interface IRow {
  width: number
  height: number
  ascent: number
  rowFlex?: RowFlex
  startIndex: number
  isPageBreak?: boolean
  // 分页符行携带的后续页纸张方向（排版期从分页符元素拷贝）
  paperDirection?: PaperDirection
  isList?: boolean
  listIndex?: number
  offsetX?: number
  offsetY?: number
  elementList: IRowElement[]
  isWidthNotEnough?: boolean
  rowIndex: number
  isSurround?: boolean
  columnIndex?: number
  tableFragment?: ITableRowFragment
  // 片段行的位置信息（由位置计算阶段回填）
  fragmentPosition?: IElementPosition
  // 续页回显表头单元格的一次性位置列表（仅用于绘制，不参与命中）
  repeatTdPositionList?: { td: ITd; positionList: IElementPosition[] }[]
}

// 行计算跨行携带状态的快照：行起始时刻的完整状态，增量续算用它恢复
export interface IRowComputeState {
  rowIndex: number
  x: number
  y: number
  pageNo: number
  pageStartY: number
  direction: PaperDirection
  margins: IMargin
  innerWidth: number
  startX: number
  pageHeight: number
  column: number
  // 控件最小宽度累计
  controlRealWidth: number
  // 列表计数：不同 listId 独立计数
  listIndexMap: Map<string, number>
}
