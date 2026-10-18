import type { IPadding } from '../../interface/Common'
import type {
  LayoutNode,
  LayoutRevision,
  LayoutSource,
  TableCellLayout,
  TableFragment
} from '../../interface/Layout'
import { shrinkColgroupToWidth } from '../../utils/table'

export interface TableCellInput {
  id: string
  scope: string
  rowspan: number
  colspan: number
  verticalAlign?: 'top' | 'middle' | 'bottom'
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderTypes?: string[]
  slashTypes?: string[]
}

export interface TableLayoutInput {
  source: LayoutSource
  revision: LayoutRevision
  columns: number[]
  rows: { minHeight: number; cells: TableCellInput[] }[]
  availableWidth: number
  minColumnWidth: number
  overflow: boolean
  mirrored: boolean
  padding: IPadding
  hidden: boolean
  spacingAfter: number
  borderColor?: string
  borderWidth?: number
  borderType?: string
}

export interface CellContentLayout {
  nodes: LayoutNode[]
  height: number
}

export interface TableLayoutResult {
  fragment: TableFragment
  columns: number[]
  rowHeights: number[]
  contentHeights: number[]
}

export function getCellContentWidth(width: number, padding: IPadding) {
  return Math.max(0, width - padding[1] - padding[3])
}

export function getCellVerticalOffset(
  height: number,
  contentHeight: number,
  padding: IPadding,
  align?: string
) {
  const blank = Math.max(0, height - padding[0] - padding[2] - contentHeight)
  return align === 'middle' ? blank / 2 : align === 'bottom' ? blank : 0
}

/** Intrinsic widths constrain the complete colspan, not each column separately. */
export function fitTableColumns(
  columns: number[],
  constraints: { column: number; colspan: number; width: number }[],
  minimum: number
) {
  const result = columns.map(() => minimum)
  for (const constraint of [...constraints].sort(
    (a, b) => a.colspan - b.colspan
  )) {
    const current = result
      .slice(constraint.column, constraint.column + constraint.colspan)
      .reduce((a, b) => a + b, 0)
    const extra = Math.max(0, constraint.width - current) / constraint.colspan
    for (
      let c = constraint.column;
      c < constraint.column + constraint.colspan;
      c++
    )
      result[c] += extra
  }
  return result
}

/** Pure scope-local table layout. No Draw, Canvas, IElement or LayoutRow. */
export function layoutTable(
  input: TableLayoutInput,
  layoutCell: (cell: TableCellInput, width: number) => CellContentLayout
): TableLayoutResult {
  const columns = input.columns.map(width => ({ width }))
  if (!input.overflow)
    shrinkColgroupToWidth(columns, input.availableWidth, input.minColumnWidth)
  const x = [0]
  for (const column of columns) x.push(x[x.length - 1] + column.width)
  const occupied = input.rows.map(() => new Set<number>())
  const cells: {
    input: TableCellInput
    row: number
    column: number
    width: number
    content: CellContentLayout
  }[] = []
  input.rows.forEach((row, rowIndex) => {
    let column = 0
    for (const cell of row.cells) {
      while (occupied[rowIndex].has(column)) column++
      if (
        cell.rowspan < 1 ||
        cell.colspan < 1 ||
        rowIndex + cell.rowspan > input.rows.length ||
        column + cell.colspan > columns.length
      )
        throw new Error('Invalid table cell span: ' + cell.id)
      for (let r = rowIndex; r < rowIndex + cell.rowspan; r++)
        for (let c = column; c < column + cell.colspan; c++) {
          if (occupied[r].has(c))
            throw new Error('Overlapping table cell: ' + cell.id)
          occupied[r].add(c)
        }
      const width = x[column + cell.colspan] - x[column]
      const content = input.hidden
        ? { nodes: [], height: 0 }
        : layoutCell(cell, getCellContentWidth(width, input.padding))
      cells.push({ input: cell, row: rowIndex, column, width, content })
      column += cell.colspan
    }
  })
  const rowHeights = input.rows.map(row => Math.max(0, row.minHeight))
  // Start at declared minima on every pass. Satisfying smaller spans first
  // avoids order-dependent growth and eliminates the old grow/trim loop.
  for (const cell of [...cells].sort(
    (a, b) => a.input.rowspan - b.input.rowspan
  )) {
    const end = cell.row + cell.input.rowspan
    const available = rowHeights.slice(cell.row, end).reduce((a, b) => a + b, 0)
    const required = cell.content.height + input.padding[0] + input.padding[2]
    rowHeights[end - 1] += Math.max(0, required - available)
  }
  const y = [0]
  for (const height of rowHeights) y.push(y[y.length - 1] + height)
  const nativeCells: TableCellLayout[] = cells.map(cell => {
    const height = y[cell.row + cell.input.rowspan] - y[cell.row]
    const left = input.mirrored
      ? x[x.length - 1] - x[cell.column] - cell.width
      : x[cell.column]
    const top = y[cell.row]
    const offset = getCellVerticalOffset(
      height,
      cell.content.height,
      input.padding,
      cell.input.verticalAlign
    )
    return {
      ...cell.input,
      row: cell.row,
      column: cell.column,
      rect: { x: left, y: top, width: cell.width, height },
      contentRect: {
        x: left + input.padding[3],
        y: top + input.padding[0] + offset,
        width: getCellContentWidth(cell.width, input.padding),
        height: cell.content.height
      },
      children: cell.content.nodes
    }
  })
  return {
    columns: columns.map(column => column.width),
    rowHeights,
    contentHeights: cells.map(cell => cell.content.height),
    fragment: {
      kind: 'tableFragment',
      id: input.source.nodeId + ':whole',
      source: { ...input.source },
      revision: { ...input.revision },
      rect: {
        x: 0,
        y: 0,
        width: x[x.length - 1],
        height: input.hidden ? 0 : y[y.length - 1]
      },
      hidden: input.hidden,
      tableId: input.source.nodeId,
      pageNo: 0,
      startRow: 0,
      endRow: input.rows.length,
      startRowOffset: 0,
      endRowOffset: null,
      repeatedRows: [],
      cells: nativeCells,
      spacingAfter: input.hidden ? 0 : input.spacingAfter,
      borderColor: input.borderColor,
      borderWidth: input.borderWidth,
      borderType: input.borderType
    }
  }
}
