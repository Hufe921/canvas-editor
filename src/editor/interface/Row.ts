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
  // 图片、公式顶部到基线的距离（非底端对齐时存在）
  imgAscent?: number
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
  // 段后间距（已计入height，绘制选区等视觉效果时需剔除）
  spacingAfter?: number
  // 区域最小高度补高（已计入height，绘制选区等视觉效果时需剔除；
  // 分页溢出时截断至页底，height为本页内部分）
  areaPadding?: {
    areaId: string
    height: number
  }
  // 区域补高的跨页结转：位于区域后续行时已计入其offsetY（占位空间视觉上归属区域）；
  // 位于区域末行自身时（区域在文档末尾）剩余补高以空白页延续
  areaPaddingCarry?: {
    areaId: string
    height: number
  }
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
