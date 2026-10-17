import { ImageDisplay } from '../dataset/enum/Common'
import { ZERO } from '../dataset/constant/Common'
import { EditorZone } from '../dataset/enum/Editor'
import { ElementType } from '../dataset/enum/Element'
import type { Draw } from '../core/draw/Draw'
import type { IElement, IElementPosition } from '../interface/Element'
import type {
  IPositionContext,
  ITablePositionContext
} from '../interface/Position'
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
  if (
    typeof input.sourceText !== 'string' ||
    input.sourceText.length > 4194304
  ) {
    throw new Error('Located range exceeds its text bound')
  }
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') {
    throw new Error(
      'Located range requires Intl.Segmenter for Unicode validation'
    )
  }
  const storyPageNo =
    input.zone === EditorZone.MAIN
      ? 0
      : input.pageNo === undefined
        ? draw.getPageNo()
        : input.pageNo
  if (
    !Number.isInteger(storyPageNo) ||
    storyPageNo < 0 ||
    storyPageNo >= draw.getPageList().length ||
    (input.zone === EditorZone.MAIN && input.pageNo !== undefined)
  ) {
    throw new Error('Located range has an invalid story page')
  }
  if (
    (input.zone === EditorZone.HEADER &&
      draw.getHeader().isDisabled(storyPageNo)) ||
    (input.zone === EditorZone.FOOTER &&
      draw.getFooter().isDisabled(storyPageNo))
  ) {
    throw new Error('Located range zone is unavailable on its page')
  }
  // Story table cells share mutable geometry across cached page directions.
  // Do not resolve a seemingly valid cell against another page's coordinates.
  if (input.zone !== EditorZone.MAIN && input.tablePath.length) {
    throw new Error(
      'Located range does not support table paths in header/footer stories'
    )
  }
  const direction = draw.getPageDirection(storyPageNo)
  let elements: IElement[] =
    input.zone === EditorZone.MAIN
      ? draw.getOriginalMainElementList()
      : input.zone === EditorZone.HEADER
        ? draw.getHeaderElementList()
        : draw.getFooterElementList()
  let positions: IElementPosition[] =
    input.zone === EditorZone.MAIN
      ? draw.getPosition().getOriginalMainPositionList()
      : input.zone === EditorZone.HEADER
        ? draw.getHeader().getPositionList(direction)
        : draw.getFooter().getPositionList(direction)
  const tablePath: ITablePositionContext[] = []
  for (const path of input.tablePath) {
    if (
      !path ||
      [path.tableId, path.rowId, path.cellId].some(
        id => typeof id !== 'string' || !id.length || id.length > 200
      )
    )
      throw new Error('Located range has an invalid ownership identity')
    const matches = elements
      .map((element, index) => ({ element, index }))
      .filter(
        item =>
          item.element.type === ElementType.TABLE &&
          item.element.id === path.tableId
      )
    if (matches.length !== 1)
      throw new Error('Located range table is stale or ambiguous')
    const { element, index } = matches[0]
    const rows = (element.trList ?? [])
      .map((row, trIndex) => ({ row, trIndex }))
      .filter(item => item.row.id === path.rowId)
    if (rows.length !== 1)
      throw new Error('Located range row ownership changed')
    const { row, trIndex } = rows[0]
    const cells = row.tdList
      .map((cell, tdIndex) => ({ cell, tdIndex }))
      .filter(item => item.cell.id === path.cellId)
    if (cells.length !== 1)
      throw new Error('Located range cell ownership changed')
    const { cell, tdIndex } = cells[0]
    tablePath.push({
      index,
      trIndex,
      tdIndex,
      tableId: path.tableId,
      trId: path.rowId,
      tdId: path.cellId
    })
    elements = cell.value
    positions = cell.positionList ?? []
  }
  const { startIndex, endIndex } = input
  if (
    !Number.isInteger(startIndex) ||
    !Number.isInteger(endIndex) ||
    startIndex < 0 ||
    endIndex < startIndex ||
    endIndex >= elements.length
  ) {
    throw new Error('Located range indices are outside their container')
  }
  const source = elements.map(element => element.value).join('')
  if (source !== input.sourceText)
    throw new Error('Located range source text changed')
  const first =
    startIndex === endIndex
      ? startIndex + 1
      : elements[startIndex].value === ZERO
        ? startIndex
        : startIndex + 1
  if (
    startIndex !== endIndex &&
    elements
      .slice(first, endIndex + 1)
      .some(
        element =>
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
      )
  ) {
    // Floating positions in the flow list alias neighboring text boxes. Object
    // geometry/selection has a separate engine path; never return that alias.
    throw new Error('Located range does not support floating object geometry')
  }
  const start = elements
    .slice(0, first)
    .reduce((sum, item) => sum + item.value.length, 0)
  const end = elements
    .slice(0, endIndex + 1)
    .reduce((sum, item) => sum + item.value.length, 0)
  let startBoundary = start === source.length
  let endBoundary = end === source.length
  // Stream boundaries instead of retaining a Set for every grapheme in a long
  // story. Complete-container validation still rejects stale text first.
  for (const segment of new Intl.Segmenter('und', {
    granularity: 'grapheme'
  }).segment(source)) {
    if (segment.index === start) startBoundary = true
    if (segment.index === end) endBoundary = true
    if ((startBoundary && endBoundary) || segment.index > end) break
  }
  if (!startBoundary || !endBoundary) {
    throw new Error('Located range splits Unicode text across elements')
  }
  const scale = draw.getOptions().scale
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('Located range geometry has an invalid scale')
  }
  for (let index = startIndex; index <= endIndex; index++) {
    const position = positions[index]
    if (
      !position ||
      position.index !== index ||
      !Number.isInteger(position.pageNo) ||
      position.pageNo < 0 ||
      (input.zone === EditorZone.MAIN &&
        position.pageNo >= draw.getPageList().length) ||
      ![
        ...position.coordinate.leftTop,
        ...position.coordinate.rightTop,
        ...position.coordinate.leftBottom
      ].every(Number.isFinite)
    ) {
      throw new Error('Located range geometry is missing or inconsistent')
    }
  }
  const pageNo =
    input.zone === EditorZone.MAIN ? positions[endIndex].pageNo : storyPageNo
  const last = tablePath.at(-1)
  const context: IPositionContext = last
    ? { ...last, isTable: true, tablePath }
    : { isTable: false }
  return { elements, positions, context, first, pageNo, scale }
}
