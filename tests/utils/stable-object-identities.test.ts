import { describe, expect, it } from 'vitest'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import { formatElementList, zipElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

describe('serialized object identities', () => {
  it('retains table, row, cell and image identities across reopen', () => {
    const source: IElement[] = [{
      type: ElementType.TABLE, id: 'table-owned', value: '',
      colgroup: [{ width: 120 }],
      trList: [{ id: 'row-owned', height: 40, tdList: [{
        id: 'cell-owned', colspan: 1, rowspan: 1,
        externalId: 'application-cell', extension: { source: 'original' },
        value: [{ type: ElementType.IMAGE, id: 'image-owned', value: 'data:image/png;base64,AA==', width: 60, height: 30 }]
      }] }]
    }]
    const options = mergeOption()
    formatElementList(source, { editorOptions: options })
    const before = structuredClone(source)
    const serialized = zipElementList(source)
    expect(source).toEqual(before)
    expect(serialized[0]?.id).toBe('table-owned')
    expect(serialized[0]?.trList?.[0]?.id).toBe('row-owned')
    const cell = serialized[0]?.trList?.[0]?.tdList[0]
    expect(cell?.id).toBe('cell-owned')
    expect(cell?.externalId).toBe('application-cell')
    expect(cell?.extension).toEqual({ source: 'original' })
    expect(cell?.value[0]?.id).toBe('image-owned')
    formatElementList(serialized, { editorOptions: options })
    expect(zipElementList(serialized)).toEqual(zipElementList(source))
  })
  it('keeps distinct equal-looking drawings independently addressable', () => {
    const value: IElement[] = [
      { type: ElementType.IMAGE, id: 'first', value: 'data:image/png;base64,AA==', width: 60, height: 30 },
      { type: ElementType.IMAGE, id: 'second', value: 'data:image/png;base64,AA==', width: 60, height: 30 }
    ]
    expect(zipElementList(value).map(element => element.id)).toEqual(['first', 'second'])
  })
})
