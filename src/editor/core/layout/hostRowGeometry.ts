import type { LayoutRow } from '../../interface/LayoutRow'

/** Includes paragraph spacing exactly once, in the host's scaled coordinates. */
export function getHostRowFlowHeight(row: LayoutRow) {
  return row.height + (row.offsetY || 0)
}

export function getHostRowsHeight(rows: LayoutRow[]) {
  return rows.reduce((sum, row) => sum + getHostRowFlowHeight(row), 0)
}
