import type { PaperDirection } from '../dataset/enum/Editor'
import type { RowFlex } from '../dataset/enum/Row'
import type { IElement, IElementPosition, ITableRowFragment } from './Element'
import type { ITd } from './table/Td'

/** Host flow bookkeeping. Native nodes own geometry, models own semantics. */
export interface LayoutRow {
  /** Authoritative native text geometry. */
  nativeLine?: import('./Layout').TextLine
  /** Authoritative page/column placement from native document flow. CSS pixels. */
  flow?: import('../core/layout/DocumentFlow').FlowPlacement
  width: number
  height: number
  ascent: number
  rowFlex?: RowFlex
  /** Resolved paragraph direction for this row (ltr | rtl) */
  direction?: 'ltr' | 'rtl'
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
  elementList: IElement[]
  /** Explicit local source mapping; never written onto IElement. */
  sourceIndices?: number[]
  node?: import('./Layout').LayoutNode
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
