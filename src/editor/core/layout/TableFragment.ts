import type { TableCellLayout, TableFragment } from '../../interface/Layout'

/** One window definition for content and replayed headers; children stay cell-local. */
export function sliceTableFragment(
  whole: TableFragment,
  input: {
    startRow: number
    endRow: number
    startOffset: number
    endOffset: number | null
    heights: number[]
    repeatedRows: number[]
    height: number
  }
): TableFragment {
  const prefix = [0]
  input.heights.forEach(height =>
    prefix.push(prefix[prefix.length - 1] + height)
  )
  const start = prefix[input.startRow] + input.startOffset
  const end =
    input.endOffset == null
      ? prefix[input.endRow]
      : prefix[input.endRow - 1] + input.endOffset
  const repeatedHeight = input.repeatedRows.reduce(
    (sum, row) => sum + input.heights[row],
    0
  )
  const slice = (
    cell: TableCellLayout,
    from: number,
    to: number,
    offset: number,
    repeated = false
  ) => {
    const top = Math.max(cell.rect.y, from)
    const bottom = Math.min(cell.rect.y + cell.rect.height, to)
    if (bottom <= top) return []
    return [
      {
        ...cell,
        repeated,
        id: cell.id + (repeated ? ':repeat' : ''),
        rect: { ...cell.rect, y: top + offset, height: bottom - top },
        contentRect: { ...cell.contentRect, y: cell.contentRect.y + offset },
        clip: {
          x: cell.rect.x,
          y: top + offset,
          width: cell.rect.width,
          height: bottom - top
        }
      }
    ]
  }
  let repeatY = 0
  const cells: TableCellLayout[] = []
  for (const row of input.repeatedRows) {
    for (const cell of whole.cells.filter(
      cell => cell.row <= row && cell.row + cell.rowspan > row
    ))
      cells.push(
        ...slice(
          cell,
          prefix[row],
          prefix[row + 1],
          repeatY - prefix[row],
          true
        )
      )
    repeatY += input.heights[row]
  }
  cells.push(
    ...whole.cells.flatMap(cell =>
      slice(cell, start, end, repeatedHeight - start)
    )
  )
  return {
    ...whole,
    rect: { ...whole.rect, height: input.height },
    startRow: input.startRow,
    endRow: input.endRow,
    startRowOffset: input.startOffset,
    endRowOffset: input.endOffset,
    repeatedRows: input.repeatedRows,
    cells
  }
}
