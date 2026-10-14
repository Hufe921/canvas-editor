import { ZERO } from '../dataset/constant/Common'
import { EditorZone } from '../dataset/enum/Editor'
import { ElementType } from '../dataset/enum/Element'
import type { Draw } from '../core/draw/Draw'
import type { IElement, IElementPosition } from '../interface/Element'
import type { IPositionContext, ITablePositionContext } from '../interface/Position'
import type { ILocatedRange } from '../interface/Range'

/** Resolves the complete ownership path without changing zone, selection,
 * focus, content or history. Never falls back to a same-quote neighboring cell. */
export function resolveLocatedRange(draw: Draw, input: ILocatedRange) {
  if (!input || !Object.values(EditorZone).includes(input.zone)) {
    throw new Error('Located range has an invalid zone')
  }
  if (!Array.isArray(input.tablePath) || input.tablePath.length > 8) {
    throw new Error('Located range has an invalid table path')
  }
  if (typeof input.sourceText !== 'string' || input.sourceText.length > 4194304) {
    throw new Error('Located range exceeds its text bound')
  }
  const direction = draw.getPageDirection(draw.getPageNo())
  let elements: IElement[] = input.zone === EditorZone.MAIN
    ? draw.getOriginalMainElementList()
    : input.zone === EditorZone.HEADER
      ? draw.getHeaderElementList()
      : draw.getFooterElementList()
  let positions: IElementPosition[] = input.zone === EditorZone.MAIN
    ? draw.getPosition().getOriginalMainPositionList()
    : input.zone === EditorZone.HEADER
      ? draw.getHeader().getPositionList(direction)
      : draw.getFooter().getPositionList(direction)
  const tablePath: ITablePositionContext[] = []
  for (const path of input.tablePath) {
    if (!path || [path.tableId, path.rowId, path.cellId].some(id =>
      typeof id !== 'string' || !id.length || id.length > 200
    )) throw new Error('Located range has an invalid ownership identity')
    const matches = elements.map((element, index) => ({ element, index }))
      .filter(item => item.element.type === ElementType.TABLE &&
        item.element.id === path.tableId)
    if (matches.length !== 1) throw new Error('Located range table is stale or ambiguous')
    const { element, index } = matches[0]
    const rows = (element.trList ?? []).map((row, trIndex) => ({ row, trIndex }))
      .filter(item => item.row.id === path.rowId)
    if (rows.length !== 1) throw new Error('Located range row ownership changed')
    const { row, trIndex } = rows[0]
    const cells = row.tdList.map((cell, tdIndex) => ({ cell, tdIndex }))
      .filter(item => item.cell.id === path.cellId)
    if (cells.length !== 1) throw new Error('Located range cell ownership changed')
    const { cell, tdIndex } = cells[0]
    tablePath.push({ index, trIndex, tdIndex, tableId: path.tableId,
      trId: path.rowId, tdId: path.cellId })
    elements = cell.value
    positions = cell.positionList ?? []
  }
  const { startIndex, endIndex } = input
  if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) ||
    startIndex < 0 || endIndex < startIndex || endIndex >= elements.length) {
    throw new Error('Located range indices are outside their container')
  }
  const source = elements.map(element => element.value).join('')
  if (source !== input.sourceText) throw new Error('Located range source text changed')
  const first = startIndex === endIndex ? startIndex + 1
    : elements[startIndex].value === ZERO ? startIndex : startIndex + 1
  const start = elements.slice(0, first).reduce((sum, item) => sum + item.value.length, 0)
  const end = elements.slice(0, endIndex + 1).reduce((sum, item) => sum + item.value.length, 0)
  const boundaries = new Set(Array.from(
    new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(source),
    segment => segment.index
  ))
  boundaries.add(source.length)
  if (!boundaries.has(start) || !boundaries.has(end)) {
    throw new Error('Located range splits Unicode text across elements')
  }
  const last = tablePath.at(-1)
  const context: IPositionContext = last
    ? { ...last, isTable: true, tablePath }
    : { isTable: false }
  return { elements, positions, context, first }
}
