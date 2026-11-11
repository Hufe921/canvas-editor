import * as Y from 'yjs'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import type { IElement, IRange } from '@canvas-editor'

export const SHARED_ELEMENTS = 'elements'

const ELEMENT_KEYS = [
  'id',
  'type',
  'value',
  'externalId',
  'hint',
  'font',
  'size',
  'width',
  'height',
  'bold',
  'color',
  'highlight',
  'italic',
  'underline',
  'strikeout',
  'rowFlex',
  'rowMargin',
  'spacingBefore',
  'spacingAfter',
  'indentLeft',
  'indentRight',
  'indentFirstLine',
  'letterSpacing',
  'imgDisplay',
  'imgToolDisabled',
  'imgPreviewDisabled',
  'tdId',
  'trId',
  'tableId',
  'conceptId',
  'borderType',
  'borderColor',
  'borderWidth',
  'borderExternalWidth',
  'translateX',
  'tableToolDisabled'
] as const
const ELEMENT_CHILD_KEYS = ['colgroup', 'trList']
const ROW_KEYS = [
  'id',
  'externalId',
  'height',
  'minHeight',
  'pagingRepeat'
] as const
const CELL_KEYS = [
  'id',
  'conceptId',
  'externalId',
  'colspan',
  'rowspan',
  'verticalAlign',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'disabled',
  'deletable',
  'hint'
] as const
const COLUMN_KEYS = ['id', 'width'] as const

type TableRow = NonNullable<IElement['trList']>[number]
type TableCell = TableRow['tdList'][number]
type TableColumn = NonNullable<IElement['colgroup']>[number]
type Identified = { id?: string }
type SharedMap = Y.Map<unknown>
type MapReader<T> = (map: SharedMap) => T
type MapUpdater<T> = (map: SharedMap, value: T) => void

export type SharedElements = Y.Array<SharedMap>
export type SelectionScope = {
  tableId: string
  trId: string
  tdId: string
  startTrIndex: number
  startTdIndex: number
  endTrIndex: number
  endTdIndex: number
}
export type RelativeSelection = {
  anchor: Y.RelativePosition
  focus: Y.RelativePosition
  scope?: SelectionScope
}
export type RelativeSelectionJSON = {
  anchor: ReturnType<typeof Y.relativePositionToJSON>
  focus: ReturnType<typeof Y.relativePositionToJSON>
  range?: IRange
  scope?: SelectionScope
}

export function getSharedElements(doc: Y.Doc): SharedElements {
  return doc.getArray<SharedMap>(SHARED_ELEMENTS)
}

function sanitizeRecord(source: unknown, keys: readonly string[]) {
  const input = source as Record<string, unknown>
  const sanitized: Record<string, unknown> = {}
  for (const key of keys) {
    const value = input[key]
    if (
      value !== undefined &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      sanitized[key] = value
    }
  }
  return sanitized
}

function sanitizeColumn(column: TableColumn): TableColumn {
  return sanitizeRecord(column, COLUMN_KEYS) as unknown as TableColumn
}

function sanitizeCell(cell: TableCell): TableCell {
  const sanitized = sanitizeRecord(cell, CELL_KEYS) as unknown as TableCell
  sanitized.value = (cell.value || []).map(sanitizeElement)
  return sanitized
}

function sanitizeRow(row: TableRow): TableRow {
  const sanitized = sanitizeRecord(row, ROW_KEYS) as unknown as TableRow
  sanitized.tdList = (row.tdList || []).map(sanitizeCell)
  return sanitized
}

function sanitizeElement(element: IElement): IElement {
  const sanitized = sanitizeRecord(element, ELEMENT_KEYS) as unknown as IElement
  sanitized.value = String(element.value ?? '')
  if (element.type === ElementType.TABLE) {
    sanitized.colgroup = (element.colgroup || []).map(sanitizeColumn)
    sanitized.trList = (element.trList || []).map(sanitizeRow)
  }
  return sanitized
}

function readElementMap(map: SharedMap) {
  return sanitizeElement(map.toJSON() as unknown as IElement)
}

function readRowMap(map: SharedMap) {
  return sanitizeRow(map.toJSON() as unknown as TableRow)
}

function readCellMap(map: SharedMap) {
  return sanitizeCell(map.toJSON() as unknown as TableCell)
}

function readColumnMap(map: SharedMap) {
  return sanitizeColumn(map.toJSON() as unknown as TableColumn)
}

export function readSharedElements(doc: Y.Doc): IElement[] {
  return getSharedElements(doc).map(readElementMap)
}

function normalizeElements(elements: IElement[]): IElement[] {
  const normalized: IElement[] = []
  const usedIds = new Set<string>()
  const push = (element: IElement, id?: string) => {
    if (id && usedIds.has(id)) id = undefined
    if (id) usedIds.add(id)
    normalized.push({ ...element, id })
  }
  for (const sourceElement of elements) {
    const element = sanitizeElement(sourceElement)
    if (element.type && element.type !== ElementType.TEXT) {
      push(element, element.id)
      continue
    }
    const characters = Array.from(element.value)
    for (let index = 0; index < characters.length; index++) {
      push(
        {
          ...element,
          value: characters[index]
        },
        index === 0 ? element.id : undefined
      )
    }
  }
  return normalized
}

function createElementId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // http://0.0.0.0 或局域网 IP 不是安全上下文，randomUUID 可能不存在
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function inheritUnchangedIds<T extends Identified>(
  previous: T[],
  next: T[],
  isSame: (previousItem: T, nextItem: T) => boolean
) {
  let prefixLength = 0
  while (
    prefixLength < previous.length &&
    prefixLength < next.length &&
    isSame(previous[prefixLength], next[prefixLength])
  ) {
    if (!next[prefixLength].id) {
      next[prefixLength].id = previous[prefixLength].id
    }
    prefixLength++
  }
  let suffixLength = 0
  while (
    suffixLength < previous.length - prefixLength &&
    suffixLength < next.length - prefixLength &&
    isSame(
      previous[previous.length - 1 - suffixLength],
      next[next.length - 1 - suffixLength]
    )
  ) {
    const nextElement = next[next.length - 1 - suffixLength]
    if (!nextElement.id) {
      nextElement.id = previous[previous.length - 1 - suffixLength].id
    }
    suffixLength++
  }
}

function updateMapScalars(
  map: SharedMap,
  value: unknown,
  keys: readonly string[],
  childKeys: readonly string[] = []
) {
  const sanitized = sanitizeRecord(value, keys)
  for (const key of map.keys()) {
    if (!keys.includes(key) && !childKeys.includes(key)) map.delete(key)
  }
  for (const key of keys) {
    const fieldValue = sanitized[key]
    if (fieldValue === undefined || fieldValue === null || fieldValue === false) {
      if (map.has(key)) map.delete(key)
    } else if (map.get(key) !== fieldValue) {
      map.set(key, fieldValue)
    }
  }
}

function getChildArray(map: SharedMap, key: string): SharedElements {
  const current = map.get(key)
  if (current instanceof Y.Array) return current as SharedElements
  const array: SharedElements = new Y.Array<SharedMap>()
  map.set(key, array)
  return array
}

function writeMapList<T extends Identified>(
  shared: SharedElements,
  next: T[],
  read: MapReader<T>,
  isSame: (previousItem: T, nextItem: T) => boolean,
  update: MapUpdater<T>
) {
  const previous = shared.map(read)
  inheritUnchangedIds(previous, next, isSame)
  const retainedIds = new Set(next.map(item => item.id).filter(Boolean))
  for (let index = shared.length - 1; index >= 0; index--) {
    const id = shared.get(index)?.get('id')
    if (typeof id !== 'string' || !retainedIds.has(id)) {
      shared.delete(index, 1)
    }
  }
  for (let index = 0; index < next.length; index++) {
    const item = next[index]
    const current = shared.get(index)
    if (item.id && current?.get('id') === item.id) {
      update(current, item)
      continue
    }
    if (item.id) {
      const oldIndex = shared
        .toArray()
        .findIndex(map => map.get('id') === item.id)
      if (oldIndex >= 0) shared.delete(oldIndex, 1)
    }
    // 先接入文档再填充字段，嵌套 Yjs 类型才能安全读取和观察
    const map: SharedMap = new Y.Map<unknown>()
    shared.insert(index, [map])
    update(map, item)
  }
}

function isSameElement(previous: IElement, next: IElement) {
  return previous.value === next.value && previous.type === next.type
}

function alwaysSame() {
  return true
}

function updateColumnMap(map: SharedMap, column: TableColumn) {
  const sanitized = sanitizeColumn(column)
  sanitized.id = sanitized.id || createElementId()
  updateMapScalars(map, sanitized, COLUMN_KEYS)
}

function updateCellMap(map: SharedMap, cell: TableCell) {
  const sanitized = sanitizeCell(cell)
  sanitized.id = sanitized.id || createElementId()
  updateMapScalars(map, sanitized, CELL_KEYS, ['value'])
  writeElementArray(getChildArray(map, 'value'), sanitized.value)
}

function updateRowMap(map: SharedMap, row: TableRow) {
  const sanitized = sanitizeRow(row)
  sanitized.id = sanitized.id || createElementId()
  updateMapScalars(map, sanitized, ROW_KEYS, ['tdList'])
  writeMapList(
    getChildArray(map, 'tdList'),
    sanitized.tdList,
    readCellMap,
    alwaysSame,
    updateCellMap
  )
}

function updateElementMap(map: SharedMap, element: IElement) {
  const sanitized = sanitizeElement(element)
  sanitized.id = sanitized.id || createElementId()
  updateMapScalars(map, sanitized, ELEMENT_KEYS, ELEMENT_CHILD_KEYS)
  if (sanitized.type === ElementType.TABLE) {
    writeMapList(
      getChildArray(map, 'colgroup'),
      sanitized.colgroup || [],
      readColumnMap,
      alwaysSame,
      updateColumnMap
    )
    writeMapList(
      getChildArray(map, 'trList'),
      sanitized.trList || [],
      readRowMap,
      alwaysSame,
      updateRowMap
    )
  } else {
    for (const key of ELEMENT_CHILD_KEYS) {
      if (map.has(key)) map.delete(key)
    }
  }
}

function writeElementArray(shared: SharedElements, elements: IElement[]) {
  writeMapList(
    shared,
    normalizeElements(elements),
    readElementMap,
    isSameElement,
    updateElementMap
  )
}

/**
 * 将编辑器快照递归转换为 Y.Array/Y.Map 修改。
 * 正文按字符合并，图片作为原子节点，表格单元格拥有独立正文数组。
 */
export function writeLocalElements(
  doc: Y.Doc,
  elements: IElement[],
  origin: unknown
) {
  doc.transact(() => {
    writeElementArray(getSharedElements(doc), elements)
  }, origin)
}

function getSelectionScope(
  doc: Y.Doc,
  range: IRange
): SelectionScope | null {
  const {
    tableId,
    startTrIndex,
    startTdIndex,
    endTrIndex = startTrIndex,
    endTdIndex = startTdIndex
  } = range
  if (
    !tableId ||
    startTrIndex === undefined ||
    startTdIndex === undefined ||
    endTrIndex === undefined ||
    endTdIndex === undefined
  ) {
    return null
  }
  const table = getSharedElements(doc)
    .toArray()
    .find(element => element.get('id') === tableId)
  const rows = table?.get('trList')
  if (!(rows instanceof Y.Array)) return null
  const row = rows.get(startTrIndex) as SharedMap | undefined
  const cells = row?.get('tdList')
  if (!(cells instanceof Y.Array)) return null
  const cell = cells.get(startTdIndex) as SharedMap | undefined
  const trId = row?.get('id')
  const tdId = cell?.get('id')
  if (typeof trId !== 'string' || typeof tdId !== 'string') return null
  return {
    tableId,
    trId,
    tdId,
    startTrIndex,
    startTdIndex,
    endTrIndex,
    endTdIndex
  }
}

function getScopedElements(doc: Y.Doc, scope?: SelectionScope) {
  if (!scope) return getSharedElements(doc)
  const table = getSharedElements(doc)
    .toArray()
    .find(element => element.get('id') === scope.tableId)
  const rows = table?.get('trList')
  if (!(rows instanceof Y.Array)) return null
  const row = rows
    .toArray()
    .find(item => item.get('id') === scope.trId) as SharedMap | undefined
  const cells = row?.get('tdList')
  if (!(cells instanceof Y.Array)) return null
  const cell = cells
    .toArray()
    .find(item => item.get('id') === scope.tdId) as SharedMap | undefined
  const value = cell?.get('value')
  return value instanceof Y.Array ? (value as SharedElements) : null
}

export function createRelativeSelection(
  doc: Y.Doc,
  range: IRange
): RelativeSelection | null {
  const scope = range.tableId ? getSelectionScope(doc, range) : undefined
  if (range.tableId && !scope) return null
  const shared = getScopedElements(doc, scope || undefined)
  const { startIndex, endIndex } = range
  // 单元格首位的零宽占位符由编辑器内部维护，不会进入共享数组
  const indexOffset = scope ? 0 : 1
  const minIndex = scope ? 0 : -1
  const maxIndex = shared ? shared.length - indexOffset : -1
  if (
    !shared ||
    (!scope && !shared.length) ||
    startIndex < minIndex ||
    endIndex < startIndex ||
    endIndex > maxIndex
  ) {
    return null
  }
  return {
    anchor: Y.createRelativePositionFromTypeIndex(
      shared,
      startIndex + indexOffset
    ),
    focus: Y.createRelativePositionFromTypeIndex(shared, endIndex + indexOffset),
    scope: scope || undefined
  }
}

export function resolveRelativeSelection(
  doc: Y.Doc,
  selection: RelativeSelection
): IRange | null {
  try {
    const anchor = Y.createAbsolutePositionFromRelativePosition(
      selection.anchor,
      doc
    )
    const focus = Y.createAbsolutePositionFromRelativePosition(
      selection.focus,
      doc
    )
    if (!anchor || !focus) return null
    const scope = selection.scope
    const indexOffset = scope ? 0 : -1
    return {
      startIndex: anchor.index + indexOffset,
      endIndex: focus.index + indexOffset,
      tableId: scope?.tableId,
      startTrIndex: scope?.startTrIndex,
      startTdIndex: scope?.startTdIndex,
      endTrIndex: scope?.endTrIndex,
      endTdIndex: scope?.endTdIndex
    }
  } catch {
    // 锚点字符或单元格已被删除时，由调用方使用最后有效选区降级
    return null
  }
}

export function serializeRelativeSelection(
  selection: RelativeSelection | null,
  range?: IRange
): RelativeSelectionJSON | null {
  if (!selection) return null
  return {
    anchor: Y.relativePositionToJSON(selection.anchor),
    focus: Y.relativePositionToJSON(selection.focus),
    range,
    scope: selection.scope
  }
}

export function deserializeRelativeSelection(
  selection: RelativeSelectionJSON
): RelativeSelection {
  return {
    anchor: Y.createRelativePositionFromJSON(selection.anchor),
    focus: Y.createRelativePositionFromJSON(selection.focus),
    scope: selection.scope
  }
}
