import { describe, it, expect } from 'vitest'
import { bindExternalElements } from '@/editor/utils/externalBindings'
import { EditorZone } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import type { IExternalElementBinding } from '@/editor/interface/ExternalBinding'

function fixture(): Record<EditorZone, IElement[]> {
  return {
    [EditorZone.MAIN]: [
      { value: '🔔' },
      { value: 'é' },
      {
        type: ElementType.TABLE,
        id: 'outer',
        value: '',
        trList: [
          {
            id: 'outer-row',
            height: 40,
            tdList: [
              {
                id: 'outer-cell',
                colspan: 1,
                rowspan: 1,
                value: [
                  {
                    type: ElementType.TABLE,
                    id: 'inner',
                    value: '',
                    trList: [
                      {
                        id: 'inner-row',
                        height: 40,
                        tdList: [
                          {
                            id: 'left',
                            colspan: 1,
                            rowspan: 1,
                            value: [{ value: 'same' }]
                          },
                          {
                            id: 'right',
                            colspan: 1,
                            rowspan: 1,
                            value: [{ value: 'same' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    [EditorZone.HEADER]: [{ value: 'Header' }],
    [EditorZone.FOOTER]: [{ value: 'Footer' }]
  }
}
const text: IExternalElementBinding = {
  container: { zone: EditorZone.MAIN },
  startIndex: 0,
  count: 2,
  expectedText: '🔔é',
  externalId: 'external-run',
  extension: { label: 'Unicode' }
}
const nested: IExternalElementBinding = {
  container: {
    zone: EditorZone.MAIN,
    tablePath: [
      { tableId: 'outer', rowId: 'outer-row', cellId: 'outer-cell' },
      { tableId: 'inner', rowId: 'inner-row', cellId: 'left' }
    ]
  },
  startIndex: 0,
  count: 1,
  expectedText: 'same',
  externalId: 'owned-cell-run',
  extension: { label: 'Left only' }
}
describe('atomic application-neutral external bindings', () => {
  it('binds complete grapheme spans and exact nested-cell ownership with snapshot isolation', () => {
    const roots = fixture()
    const binding = structuredClone(text)
    bindExternalElements(roots, [binding, nested])
    binding.extension = { label: 'Changed caller object' }
    expect(roots.main[0].extension).toEqual({ label: 'Unicode' })
    expect(roots.main[1].externalId).toBe('external-run')
    const inner = roots.main[2].trList?.[0].tdList[0].value[0]
    expect(inner?.trList?.[0].tdList[0].value[0].externalId).toBe(
      'owned-cell-run'
    )
    expect(inner?.trList?.[0].tdList[1].value[0].externalId).toBeUndefined()
    expect(roots.header[0].value).toBe('Header')
  })
  it('invalid text, ownership, overlapping spans or clone failure leave the complete batch unchanged', () => {
    const invalid: IExternalElementBinding[] = [
      { ...text, expectedText: 'wrong' },
      { ...text, startIndex: -1 },
      { ...text, count: 1.5 },
      {
        ...nested,
        container: {
          zone: EditorZone.MAIN,
          tablePath: [{ tableId: 'outer', rowId: 'outer-row', cellId: 'wrong' }]
        }
      },
      { ...nested, extension: () => undefined },
      text
    ]
    for (const binding of invalid) {
      const roots = fixture()
      const before = structuredClone(roots)
      expect(() => bindExternalElements(roots, [text, binding])).toThrow()
      expect(roots).toEqual(before)
    }
  })
})
