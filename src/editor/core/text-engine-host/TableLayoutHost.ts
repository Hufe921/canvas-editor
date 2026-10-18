import { TextDirection } from '../../dataset/enum/TextDirection'
import type { DeepRequired } from '../../interface/Common'
import type { IEditorOption } from '../../interface/Editor'
import type { IElement } from '../../interface/Element'
import type {
  LayoutNode,
  LayoutRevision,
  LayoutSource
} from '../../interface/Layout'
import type { LayoutRow } from '../../interface/LayoutRow'
import { isTableMirrored } from '../../utils/direction'
import { cellLayoutState } from '../layout/CellLayoutState'
import { layoutTable } from '../layout/TableLayout'
import { getHostRowsHeight } from '../layout/hostRowGeometry'

/** Native table layout with sidecars for host container tools. */
export function layoutHostTable(
  payload: {
    element: IElement
    source: LayoutSource
    revision: LayoutRevision
    options: DeepRequired<IEditorOption>
    availableWidth: number
    rowMargin: number
    rowIndex: number
    nextIsTable: boolean
    hidden: boolean
  },
  layoutCell: (
    elements: IElement[],
    width: number,
    scope: string,
    direction: TextDirection,
    align: 'left' | 'right'
  ) => { rows: LayoutRow[]; nodes: LayoutNode[] }
) {
  const { options, source, rowMargin, hidden } = payload
  const isFrame =
    source.scope.startsWith('header:') || source.scope.startsWith('footer:')
  const element = isFrame
    ? {
        ...payload.element,
        colgroup: payload.element.colgroup?.map(col => ({ ...col })),
        trList: payload.element.trList?.map(tr => ({
          ...tr,
          tdList: tr.tdList.map(td => ({ ...td }))
        }))
      }
    : payload.element
  const {
    scale,
    table: { tdPadding, defaultColMinWidth, overflow }
  } = options
  const hostCells = element.trList!.flatMap(row => row.tdList)
  const cellRows = new Map<string, LayoutRow[]>()
  const mirrored = isTableMirrored(element, options)
  const minimum =
    tdPadding[0] + tdPadding[2] + options.defaultSize + (2 * rowMargin) / scale
  const input = {
    source,
    revision: payload.revision,
    columns: element.colgroup!.map(column => column.width),
    rows: element.trList!.map((row, r) => ({
      minHeight: Math.max(minimum, row.minHeight || 0),
      cells: row.tdList.map((cell, c) => ({
        id: cell.id || source.nodeId + ':cell:' + r + ':' + c,
        scope: cell.id
          ? (source.scope.startsWith('header:') ||
            source.scope.startsWith('footer:') ||
            source.scope === 'measurement' ||
            source.scope.startsWith('measurement/')
              ? source.scope.split('/')[0] + '/'
              : '') +
            'td:' +
            cell.id
          : source.scope + '/' + source.nodeId + ':cell:' + r + ':' + c,
        rowspan: cell.rowspan,
        colspan: cell.colspan,
        verticalAlign: cell.verticalAlign,
        borderColor: cell.borderColor,
        borderWidth: cell.borderWidth,
        borderTypes: cell.borderTypes,
        backgroundColor: cell.backgroundColor,
        slashTypes: cell.slashTypes
      }))
    })),
    availableWidth: Math.max(0, payload.availableWidth / scale),
    minColumnWidth: defaultColMinWidth,
    overflow,
    mirrored,
    padding: tdPadding,
    hidden,
    spacingAfter: payload.nextIsTable ? 0 : rowMargin / scale,
    borderColor: element.borderColor,
    borderWidth: element.borderWidth,
    borderType: element.borderType
  }
  const byId = new Map(
    input.rows
      .flatMap(row => row.cells)
      .map((cell, i) => [cell.id, hostCells[i]])
  )
  const result = layoutTable(input, (cell, width) => {
    const child = layoutCell(
      byId.get(cell.id)!.value,
      width * scale,
      cell.scope,
      element.direction || TextDirection.AUTO,
      mirrored ? 'right' : 'left'
    )
    cellRows.set(cell.id, child.rows)
    return { nodes: child.nodes, height: getHostRowsHeight(child.rows) / scale }
  })
  result.columns.forEach((width, index) => {
    element.colgroup![index].width = width
  })
  if (!overflow) element.translateX = 0
  result.rowHeights.forEach((height, index) => {
    element.trList![index].height = height
  })
  result.fragment.cells.forEach((cell, index) => {
    const host = hostCells[index]
    cellLayoutState(host)
    const { row, column, rect } = cell
    Object.assign(host, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      rowIndex: row,
      colIndex: column,
      trIndex: row,
      tdIndex: element.trList![row].tdList.indexOf(host),
      rowList: cellRows.get(cell.id) || [],
      mainHeight: result.contentHeights[index] + tdPadding[0] + tdPadding[2],
      realHeight: rect.height,
      realMinHeight: input.rows
        .slice(row, row + cell.rowspan)
        .reduce((sum, r) => sum + r.minHeight, 0),
      isLastRowTd: element.trList![row].tdList.at(-1) === host,
      isLastColTd: row + cell.rowspan === element.trList!.length,
      isLastTd:
        row === element.trList!.length - 1 &&
        element.trList![row].tdList.at(-1) === host
    })
  })
  element.width = result.fragment.rect.width
  element.height = result.fragment.rect.height
  // Preserve the geometry contract consumed by current table painting/paging.
  const tableHeight = hidden ? 0 : element.height * scale
  const row: LayoutRow = {
    width: hidden ? 0 : element.width * scale,
    height: tableHeight + (result.fragment.spacingAfter || 0) * scale,
    ascent: 0,
    rowIndex: payload.rowIndex,
    startIndex: source.start,
    node: result.fragment,
    sourceIndices: [source.start],
    spacingAfter: (result.fragment.spacingAfter || 0) * scale,
    elementList: [element],
    direction: mirrored ? 'rtl' : 'ltr'
  }
  return { row, fragment: result.fragment }
}
