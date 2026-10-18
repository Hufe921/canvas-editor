import {
  fitTableColumns,
  layoutTable,
  TableLayoutInput
} from '@/editor/core/layout/TableLayout'
import { getLayoutFlowHeight } from '@/editor/core/text-engine/layout/layoutProtocol'
import { describe, expect, it } from 'vitest'

function input(extra: Partial<TableLayoutInput> = {}): TableLayoutInput {
  return {
    source: { scope: 'main', nodeId: 'table', start: 1, end: 2 },
    revision: { documentRevision: 1, fontRevision: 2 },
    columns: [100, 100],
    rows: [
      {
        minHeight: 30,
        cells: [
          { id: 'a', scope: 'td:a', rowspan: 2, colspan: 1 },
          { id: 'b', scope: 'td:b', rowspan: 1, colspan: 1 }
        ]
      },
      {
        minHeight: 30,
        cells: [{ id: 'c', scope: 'td:c', rowspan: 1, colspan: 1 }]
      },
      {
        minHeight: 30,
        cells: [
          {
            id: 'd',
            scope: 'td:d',
            rowspan: 1,
            colspan: 2,
            verticalAlign: 'bottom'
          }
        ]
      }
    ],
    availableWidth: 160,
    minColumnWidth: 40,
    overflow: false,
    mirrored: false,
    padding: [3, 5, 7, 11],
    hidden: false,
    spacingAfter: 8,
    ...extra
  }
}

describe('T12 native table geometry', () => {
  it('constrains cell containers, satisfies all spans and is repeatable without model mutations', () => {
    const request = input()
    const original = structuredClone(request)
    const widths: number[] = []
    const content = (cell: { id: string }, width: number) => {
      widths.push(width)
      return { nodes: [], height: cell.id === 'a' ? 150 : 10 }
    }
    const result = layoutTable(request, content)
    expect(widths).toEqual([64, 64, 64, 144])
    expect(result.columns).toEqual([80, 80])
    expect(result.rowHeights).toEqual([30, 130, 30])
    expect(
      result.fragment.cells.map(c => [c.row, c.column, c.rect.y, c.rect.height])
    ).toEqual([
      [0, 0, 0, 160],
      [0, 1, 0, 30],
      [1, 1, 30, 130],
      [2, 0, 160, 30]
    ])
    expect(result.fragment.cells[3].contentRect.y).toBe(173)
    expect(getLayoutFlowHeight(result.fragment)).toBe(198)
    expect(layoutTable(request, content)).toEqual(result)
    expect(request).toEqual(original)
  })

  it('mirrors physical columns while preserving logical indices, scopes and decorations', () => {
    const request = input({
      mirrored: true,
      borderColor: '#123456',
      borderWidth: 2
    })
    request.rows[0].cells[0].borderColor = '#ff0000'
    request.rows[0].cells[0].borderWidth = 3
    const { fragment } = layoutTable(request, () => ({ nodes: [], height: 10 }))
    expect(fragment.cells.map(c => c.column)).toEqual([0, 1, 1, 0])
    expect(fragment.cells.map(c => c.rect.x)).toEqual([80, 0, 0, 0])
    expect(fragment.cells[0]).toMatchObject({
      scope: 'td:a',
      borderColor: '#ff0000',
      borderWidth: 3
    })
    expect(fragment).toMatchObject({ borderColor: '#123456', borderWidth: 2 })
  })

  it('retains covered empty rows and collapses hidden tables without child layout', () => {
    const request = input({
      rows: [
        {
          minHeight: 20,
          cells: [{ id: 'merged', scope: 'td:m', rowspan: 2, colspan: 2 }]
        },
        { minHeight: 20, cells: [] }
      ]
    })
    const result = layoutTable(request, () => ({ nodes: [], height: 100 }))
    expect(result.rowHeights).toEqual([20, 90])
    expect(result.fragment.cells[0].rect.height).toBe(110)
    const hidden = layoutTable({ ...request, hidden: true }, () => {
      throw new Error('Hidden table must not lay out children')
    })
    expect(hidden.fragment.hidden).toBe(true)
    expect(getLayoutFlowHeight(hidden.fragment)).toBe(0)
  })

  it('fits intrinsic colspan constraints and preserves the explicit minimum under tiny containers', () => {
    expect(
      fitTableColumns(
        [100, 100],
        [
          { column: 0, colspan: 1, width: 70 },
          { column: 0, colspan: 2, width: 200 }
        ],
        40
      )
    ).toEqual([115, 85])
    expect(
      layoutTable(input({ availableWidth: 20 }), () => ({
        nodes: [],
        height: 0
      })).columns
    ).toEqual([40, 40])
    expect(
      layoutTable(input({ overflow: true }), () => ({ nodes: [], height: 0 }))
        .columns
    ).toEqual([100, 100])
  })

  it('rejects spans outside the declared grid', () => {
    const request = input()
    request.rows[0].cells[0].rowspan = 10
    expect(() =>
      layoutTable(request, () => ({ nodes: [], height: 0 }))
    ).toThrow('Invalid table cell span')
  })
})
