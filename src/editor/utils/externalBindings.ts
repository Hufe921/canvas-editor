import { EditorZone } from '../dataset/enum/Editor'
import { ElementType } from '../dataset/enum/Element'
import { IElement } from '../interface/Element'
import { IExternalElementBinding } from '../interface/ExternalBinding'
import { deepClone } from './index'

/** Validate every span and clone all metadata before mutating any element.
 * No content, range, rendering or history changes are made here. */
export function bindExternalElements(
  roots: Record<EditorZone, IElement[]>,
  bindings: IExternalElementBinding[]
): void {
  if (!Array.isArray(bindings) || bindings.length > 10000) {
    throw new Error('External binding batch exceeds its bound.')
  }
  const claimed = new Set<IElement>()
  let count = 0
  const prepared = bindings.map(binding => {
    let list = roots[binding.container.zone]
    if (!list || !Array.isArray(list)) {
      throw new Error('External binding requires a document story.')
    }
    const path = binding.container.tablePath || []
    if (!Array.isArray(path) || path.length > 8) {
      throw new Error('External binding table path exceeds its bound.')
    }
    for (const owner of path) {
      const tables = list.filter(
        element =>
          element.type === ElementType.TABLE && element.id === owner.tableId
      )
      const table = tables[0]
      if (tables.length !== 1 || !table?.trList) {
        throw new Error(
          'External binding table ownership is ambiguous or stale.'
        )
      }
      const rows = table.trList.filter(row => row.id === owner.rowId)
      const row = rows[0]
      const cells = row?.tdList.filter(cell => cell.id === owner.cellId) || []
      if (rows.length !== 1 || cells.length !== 1) {
        throw new Error(
          'External binding cell ownership is ambiguous or stale.'
        )
      }
      list = cells[0].value
    }
    if (
      !Number.isSafeInteger(binding.startIndex) ||
      binding.startIndex < 0 ||
      !Number.isSafeInteger(binding.count) ||
      binding.count < 1 ||
      binding.startIndex + binding.count > list.length ||
      typeof binding.externalId !== 'string' ||
      !binding.externalId.length ||
      binding.externalId.length > 200 ||
      typeof binding.expectedText !== 'string'
    ) {
      throw new Error('External binding requires an existing complete span.')
    }
    const elements = list.slice(
      binding.startIndex,
      binding.startIndex + binding.count
    )
    if (
      elements.map(element => element.value).join('') !== binding.expectedText
    ) {
      throw new Error('External binding source text changed.')
    }
    count += elements.length
    if (count > 200000)
      throw new Error('External binding batch exceeds its bound.')
    for (const element of elements) {
      if (claimed.has(element))
        throw new Error('External binding spans overlap.')
      claimed.add(element)
    }
    return {
      elements,
      externalId: binding.externalId,
      extension: deepClone(binding.extension)
    }
  })
  for (const binding of prepared)
    for (const element of binding.elements) {
      element.externalId = binding.externalId
      element.extension = binding.extension
    }
}
