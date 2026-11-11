import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import {
  createRelativeSelection,
  getSharedElements,
  readSharedElements,
  resolveRelativeSelection,
  writeLocalElements
} from '../../examples/collaboration/client/document'
import { ElementType } from '../../src/editor/dataset/enum/Element'
import type { IElement } from '../../src/editor/interface/Element'

function text(doc: Y.Doc) {
  return readSharedElements(doc)
    .map(element => element.value)
    .join('')
}

function createTable(): IElement {
  return {
    id: 'table-1',
    type: ElementType.TABLE,
    value: '',
    colgroup: [
      { id: 'column-1', width: 120 },
      { id: 'column-2', width: 120 }
    ],
    trList: [
      {
        id: 'row-1',
        height: 40,
        tdList: [
          {
            id: 'cell-1',
            colspan: 1,
            rowspan: 1,
            value: [{ value: 'A' }, { value: 'B' }]
          },
          {
            id: 'cell-2',
            colspan: 1,
            rowspan: 1,
            value: [{ value: 'C' }, { value: 'D' }]
          }
        ]
      }
    ]
  }
}

function exchangeUpdates(first: Y.Doc, second: Y.Doc) {
  const firstUpdate = Y.encodeStateAsUpdate(first, Y.encodeStateVector(second))
  const secondUpdate = Y.encodeStateAsUpdate(second, Y.encodeStateVector(first))
  Y.applyUpdate(first, secondUpdate)
  Y.applyUpdate(second, firstUpdate)
}

describe('collaboration document adapter', () => {
  it('preserves character identity across local inserts', () => {
    const doc = new Y.Doc()
    const origin = {}
    writeLocalElements(doc, [{ value: '你' }, { value: '好' }], origin)
    const [first, second] = readSharedElements(doc)
    writeLocalElements(
      doc,
      [first, { value: '，' }, second, { value: '\n' }],
      origin
    )
    const result = readSharedElements(doc)
    expect(text(doc)).toBe('你，好\n')
    expect(result[0].id).toBe(first.id)
    expect(result[2].id).toBe(second.id)
    expect(new Set(result.map(element => element.id)).size).toBe(4)
  })

  it('inherits ids for editor elements that have not been reconciled', () => {
    const doc = new Y.Doc()
    const origin = {}
    writeLocalElements(doc, [{ value: 'A' }, { value: 'C' }], origin)
    const originalIds = readSharedElements(doc).map(element => element.id)
    const editorSnapshot = readSharedElements(doc).map(element => ({
      ...element,
      id: undefined
    }))
    editorSnapshot.splice(1, 0, { id: undefined, value: 'B' })
    writeLocalElements(doc, editorSnapshot, origin)
    expect(text(doc)).toBe('ABC')
    expect(readSharedElements(doc).map(element => element.id)).toEqual([
      originalIds[0],
      expect.any(String),
      originalIds[1]
    ])
  })

  it('splits zipped text and deduplicates ids after a style change', () => {
    const doc = new Y.Doc()
    const origin = {}
    writeLocalElements(doc, [{ value: '甲乙' }], origin)
    const zippedId = readSharedElements(doc)[0].id
    writeLocalElements(
      doc,
      [
        { id: zippedId, value: '甲', italic: true },
        { id: zippedId, value: '乙' }
      ],
      origin
    )
    const result = readSharedElements(doc)
    expect(text(doc)).toBe('甲乙')
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ value: '甲', italic: true })
    expect(result[1]).toMatchObject({ value: '乙' })
    expect(result[1].italic).toBeUndefined()
    expect(result[0].id).not.toBe(result[1].id)
  })

  it('converges when two clients insert at the same position', () => {
    const first = new Y.Doc()
    const second = new Y.Doc()
    writeLocalElements(first, [{ value: 'A' }, { value: 'C' }], {})
    Y.applyUpdate(second, Y.encodeStateAsUpdate(first))
    const firstSnapshot = readSharedElements(first)
    const secondSnapshot = readSharedElements(second)
    writeLocalElements(
      first,
      [firstSnapshot[0], { value: 'B1' }, firstSnapshot[1]],
      {}
    )
    writeLocalElements(
      second,
      [secondSnapshot[0], { value: 'B2' }, secondSnapshot[1]],
      {}
    )
    const firstUpdate = Y.encodeStateAsUpdate(first, Y.encodeStateVector(second))
    const secondUpdate = Y.encodeStateAsUpdate(second, Y.encodeStateVector(first))
    Y.applyUpdate(first, secondUpdate)
    Y.applyUpdate(second, firstUpdate)
    expect(text(first)).toBe(text(second))
    expect(text(first)).toContain('B1')
    expect(text(first)).toContain('B2')
  })

  it('synchronizes inline styles without replacing the character', () => {
    const doc = new Y.Doc()
    writeLocalElements(doc, [{ value: '字' }], {})
    const id = readSharedElements(doc)[0].id
    writeLocalElements(
      doc,
      [{ id, value: '字', bold: true, color: '#0969da' }],
      {}
    )
    expect(readSharedElements(doc)[0]).toMatchObject({
      id,
      value: '字',
      bold: true,
      color: '#0969da'
    })
  })

  it('moves a relative selection after a remote insertion', () => {
    const doc = new Y.Doc()
    writeLocalElements(doc, [{ value: 'A' }, { value: 'B' }], {})
    const selection = createRelativeSelection(doc, {
      startIndex: 0,
      endIndex: 0
    })!
    const remote = new Y.Doc()
    Y.applyUpdate(remote, Y.encodeStateAsUpdate(doc))
    const remoteSelection = Y.relativePositionToJSON(selection.anchor)
    const remoteSnapshot = readSharedElements(remote)
    writeLocalElements(
      remote,
      [{ value: 'X' }, ...remoteSnapshot],
      {}
    )
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(remote, Y.encodeStateVector(doc)))
    const resolved = resolveRelativeSelection(doc, selection)
    expect(resolved).toEqual({ startIndex: 1, endIndex: 1 })
    expect(remoteSelection).toBeDefined()
  })

  it('synchronizes images as atomic elements and retains their map', () => {
    const doc = new Y.Doc()
    const image: IElement = {
      id: 'image-1',
      type: ElementType.IMAGE,
      value: 'data:image/png;base64,iVBORw0KGgo=',
      width: 120,
      height: 80
    }
    writeLocalElements(doc, [image], {})
    const imageMap = getSharedElements(doc).get(0)
    const remote = new Y.Doc()
    Y.applyUpdate(remote, Y.encodeStateAsUpdate(doc))
    expect(readSharedElements(remote)).toEqual([image])

    writeLocalElements(doc, [{ ...image, width: 240 }], {})
    expect(getSharedElements(doc).get(0)).toBe(imageMap)
    expect(readSharedElements(doc)[0]).toMatchObject({
      id: 'image-1',
      value: image.value,
      width: 240,
      height: 80
    })
  })

  it('round-trips table structure and retains row and cell maps', () => {
    const doc = new Y.Doc()
    const table = createTable()
    writeLocalElements(doc, [table], {})
    const remote = new Y.Doc()
    Y.applyUpdate(remote, Y.encodeStateAsUpdate(doc))
    expect(readSharedElements(remote)).toMatchObject([table])

    const tableMap = getSharedElements(doc).get(0)
    const rows = tableMap.get('trList') as Y.Array<Y.Map<unknown>>
    const rowMap = rows.get(0)
    const cells = rowMap.get('tdList') as Y.Array<Y.Map<unknown>>
    const cellMap = cells.get(0)
    const next = readSharedElements(doc)
    next[0].trList![0].tdList![0].value.push({ value: '改' })
    writeLocalElements(doc, next, {})

    expect(getSharedElements(doc).get(0)).toBe(tableMap)
    expect(rows.get(0)).toBe(rowMap)
    expect(cells.get(0)).toBe(cellMap)
    expect(readSharedElements(doc)[0]).toMatchObject({
      id: 'table-1',
      trList: [
        {
          id: 'row-1',
          tdList: [{ id: 'cell-1' }, { id: 'cell-2' }]
        }
      ]
    })
  })

  it('merges concurrent edits in different cells of the same row', () => {
    const first = new Y.Doc()
    const second = new Y.Doc()
    writeLocalElements(first, [createTable()], {})
    Y.applyUpdate(second, Y.encodeStateAsUpdate(first))

    const firstSnapshot = readSharedElements(first)
    const secondSnapshot = readSharedElements(second)
    firstSnapshot[0].trList![0].tdList![0].value.unshift({ value: '左' })
    secondSnapshot[0].trList![0].tdList![1].value.push({ value: '右' })
    writeLocalElements(first, firstSnapshot, {})
    writeLocalElements(second, secondSnapshot, {})
    exchangeUpdates(first, second)

    const cellText = (doc: Y.Doc, cellIndex: number) =>
      readSharedElements(doc)[0]
        .trList![0].tdList![cellIndex].value.map(element => element.value)
        .join('')
    expect(readSharedElements(first)).toEqual(readSharedElements(second))
    expect(cellText(first, 0)).toBe('左AB')
    expect(cellText(first, 1)).toBe('CD右')
  })

  it('keeps a relative selection inside its original table cell', () => {
    const doc = new Y.Doc()
    writeLocalElements(doc, [createTable()], {})
    const range = {
      startIndex: 1,
      endIndex: 1,
      tableId: 'table-1',
      startTrIndex: 0,
      startTdIndex: 0,
      endTrIndex: 0,
      endTdIndex: 0
    }
    const selection = createRelativeSelection(doc, range)!
    const remote = new Y.Doc()
    Y.applyUpdate(remote, Y.encodeStateAsUpdate(doc))
    const remoteSnapshot = readSharedElements(remote)
    remoteSnapshot[0].trList![0].tdList![0].value.unshift({ value: 'X' })
    writeLocalElements(remote, remoteSnapshot, {})
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(remote, Y.encodeStateVector(doc)))

    expect(resolveRelativeSelection(doc, selection)).toEqual({
      ...range,
      startIndex: 2,
      endIndex: 2
    })
  })
})
