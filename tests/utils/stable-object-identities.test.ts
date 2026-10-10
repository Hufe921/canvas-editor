import { describe, expect, it } from 'vitest'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import { formatElementList, zipElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

function fixture(prefix = ''): IElement[] {
  return [
    {
      type: ElementType.TABLE,
      id: `${prefix}table-owned`,
      value: '',
      externalId: 'application-table',
      colgroup: [{ width: 120 }],
      trList: [
        {
          id: `${prefix}row-owned`,
          height: 40,
          externalId: 'application-row',
          extension: { source: 'row' },
          tdList: [
            {
              id: `${prefix}cell-owned`,
              colspan: 1,
              rowspan: 1,
              externalId: 'application-cell',
              extension: { source: 'cell' },
              hint: 'Cell hint',
              width: 120,
              value: [
                { value: 'Bell 🔔 é', bold: true },
                {
                  type: ElementType.IMAGE,
                  id: `${prefix}image-owned`,
                  value: 'data:image/png;base64,AA==',
                  width: 60,
                  height: 30
                }
              ]
            }
          ]
        }
      ]
    },
    {
      type: ElementType.IMAGE,
      id: `${prefix}standalone-image`,
      value: 'data:image/png;base64,AA==',
      width: 60,
      height: 30
    }
  ]
}

function tableParts(elements: IElement[]) {
  const table = elements.find(element => element.type === ElementType.TABLE)
  const row = table?.trList?.[0]
  const cell = row?.tdList[0]
  const image = cell?.value.find(element => element.type === ElementType.IMAGE)
  if (!table || !row || !cell || !image) throw new Error('Incomplete fixture')
  return { table, row, cell, image }
}

function identities(elements: IElement[]): string[] {
  const result: string[] = []
  for (const element of elements) {
    if (element.id) result.push(element.id)
    for (const row of element.trList || []) {
      if (row.id) result.push(row.id)
      for (const cell of row.tdList) {
        if (cell.id) result.push(cell.id)
        result.push(...identities(cell.value))
      }
    }
  }
  return result
}

describe('opt-in serialized object identities', () => {
  it('strips table, row, cell and image ids by default', () => {
    const source = fixture()
    const before = structuredClone(source)
    const serialized = zipElementList(source)
    expect(identities(serialized)).toEqual([])
    const { table, row, cell, image } = tableParts(serialized)
    for (const object of [table, row, cell, image]) {
      expect(Object.hasOwn(object, 'id')).toBe(false)
    }
    expect(source).toEqual(before)
    expect(zipElementList(source, { extraPickAttrs: [] })).toEqual(serialized)
  })

  it('preserves all four levels only when ids are requested', () => {
    const source = fixture()
    const options = mergeOption()
    formatElementList(source, { editorOptions: options })
    const before = structuredClone(source)
    const serialized = zipElementList(source, { extraPickAttrs: ['id'] })
    expect(identities(serialized)).toEqual([
      'table-owned', 'row-owned', 'cell-owned', 'image-owned', 'standalone-image'
    ])
    expect(source).toEqual(before)
    formatElementList(serialized, { editorOptions: options })
    expect(zipElementList(serialized, { extraPickAttrs: ['id'] })).toEqual(
      zipElementList(source, { extraPickAttrs: ['id'] })
    )
  })

  it('retains existing row and cell binding metadata without opting in', () => {
    const { table, row, cell } = tableParts(zipElementList(fixture()))
    expect(table.externalId).toBe('application-table')
    expect(row.externalId).toBe('application-row')
    expect(row.extension).toEqual({ source: 'row' })
    expect(cell.externalId).toBe('application-cell')
    expect(cell.extension).toEqual({ source: 'cell' })
    expect(Object.hasOwn(cell, 'hint')).toBe(false)
    expect(Object.hasOwn(cell, 'width')).toBe(false)
  })

  it('allows other shared cell attributes without inventing absent keys', () => {
    const { cell } = tableParts(zipElementList(fixture(), {
      extraPickAttrs: ['hint', 'width', 'italic']
    }))
    expect(cell.hint).toBe('Cell hint')
    expect(cell.width).toBe(120)
    expect(Object.hasOwn(cell, 'italic')).toBe(false)
    expect(Object.hasOwn(cell, 'id')).toBe(false)
  })

  it('keeps recursively zipped cell content when value is requested', () => {
    const source = fixture()
    formatElementList(source, { editorOptions: mergeOption() })
    const before = structuredClone(source)
    const expected = zipElementList(source, { extraPickAttrs: ['id'] })
    expect(zipElementList(source, {
      extraPickAttrs: ['id', 'value']
    })).toEqual(expected)
    expect(source).toEqual(before)
    const { cell } = tableParts(expected)
    expect(cell.value.some(element => element.tdId !== undefined)).toBe(false)
    expect(cell.value[0]?.value).toBe('Bell 🔔 é')
  })

  it('propagates opt-in retention through nested tables', () => {
    const source = fixture()
    tableParts(source).cell.value.push(...fixture('nested-'))
    const serialized = zipElementList(source, { extraPickAttrs: ['id'] })
    expect(identities(serialized)).toEqual(identities(source))
    expect(identities(zipElementList(source))).toEqual([])
  })

  it('does not invent missing or undefined identities', () => {
    const source = fixture()
    for (const object of Object.values(tableParts(source))) object.id = undefined
    const serialized = zipElementList(source, { extraPickAttrs: ['id'] })
    for (const object of Object.values(tableParts(serialized))) {
      expect(object.id).toBeUndefined()
    }
    const missing = fixture()
    for (const object of Object.values(tableParts(missing))) delete object.id
    for (const object of Object.values(tableParts(zipElementList(missing, {
      extraPickAttrs: ['id']
    })))) expect(Object.hasOwn(object, 'id')).toBe(false)
  })

  it('supports the in-place serialization used by the clipboard', () => {
    const source = fixture()
    const expected = zipElementList(source)
    expect(zipElementList(source, { isClone: false })).toEqual(expected)
    expect(identities(source)).toEqual(['table-owned', 'standalone-image'])
    const retained = fixture()
    expect(zipElementList(retained, {
      isClone: false,
      extraPickAttrs: ['id']
    })).toEqual(zipElementList(fixture(), { extraPickAttrs: ['id'] }))
  })

  it('regenerates distinct ids for repeated clipboard-style inserts', () => {
    const source = fixture()
    const options = mergeOption()
    formatElementList(source, { editorOptions: options })
    const clipboard = zipElementList(source)
    const firstPaste = structuredClone(clipboard)
    const secondPaste = structuredClone(clipboard)
    formatElementList(firstPaste, { editorOptions: options })
    formatElementList(secondPaste, { editorOptions: options })
    const ids = [
      ...identities(source), ...identities(firstPaste), ...identities(secondPaste)
    ]
    expect(ids).toHaveLength(15)
    expect(new Set(ids).size).toBe(ids.length)
    for (const paste of [firstPaste, secondPaste]) {
      const { table, row, cell, image } = tableParts(paste)
      expect(image.tableId).toBe(table.id)
      expect(image.trId).toBe(row.id)
      expect(image.tdId).toBe(cell.id)
    }
    expect(identities(clipboard)).toEqual([])
  })

  it('keeps opt-in identities on equal-looking images independently', () => {
    const source: IElement[] = ['first', 'second'].map(id => ({
      type: ElementType.IMAGE, id,
      value: 'data:image/png;base64,AA==', width: 60, height: 30
    }))
    expect(identities(zipElementList(source, {
      extraPickAttrs: ['id', 'id']
    }))).toEqual(['first', 'second'])
    expect(identities(zipElementList(source))).toEqual([])
  })
})
