import { RowFlex } from '../dataset/enum/Row'
import {
  IElement,
  IElementMetrics,
  IElementPosition,
  ITableRowFragment
} from './Element'
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
