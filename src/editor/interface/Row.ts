import { RowFlex } from '../dataset/enum/Row'
import {
  IElement,
  IElementMetrics,
  IElementPosition,
  ITableRowFragment
} from './Element'
import { ITd } from './table/Td'

/** Minimal line handle from text-engine (avoid interface→core cycle at runtime) */
export interface IEngineLayoutLine {
  glyphs: Array<{
    left: number
    right: number
    ax: number
    dx: number
    dy: number
    pathData?: string
    charStart: number
    charEnd: number
    logicalIndexStart: number
    logicalIndexEnd: number
    bidiLevel: number
    style: {
      fontFamily: string
      fontSize: number
      bold?: boolean
      italic?: boolean
      color?: string
    }
  }>
  width: number
  height: number
  ascent: number
  direction: 'ltr' | 'rtl'
}

export type IRowElement = IElement & {
  metrics: IElementMetrics
  style: string
  left?: number
  /** Absolute x within the row content box (text-engine visual placement) */
  visualLeft?: number
  bidiLevel?: number
  visualIndex?: number
  clusterStart?: number
  clusterEnd?: number
}

export interface IRow {
  width: number
  height: number
  ascent: number
  rowFlex?: RowFlex
  /** Resolved paragraph direction for this row (ltr | rtl) */
  direction?: 'ltr' | 'rtl'
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
  /** text-engine layout line for joined-script rendering */
  engineLine?: IEngineLayoutLine
  /** Full paragraph text (for cluster → string when drawing runs) */
  engineParagraphText?: string
}
