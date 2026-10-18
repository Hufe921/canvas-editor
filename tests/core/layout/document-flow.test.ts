import { DocumentFlow } from '@/editor/core/layout/DocumentFlow'
import { sliceTableFragment } from '@/editor/core/layout/TableFragment'
import { PaperDirection } from '@/editor/dataset/enum/Editor'
import type { TableFragment } from '@/editor/interface/Layout'
import { describe, expect, it } from 'vitest'
const page = () => ({
  top: 20,
  bottom: 120,
  left: 10,
  width: 100,
  columns: [0, 120]
})
describe('T15 page/column/exclusion constraints', () => {
  it('advances overflow to the next column but explicit section breaks to the next page', () => {
    const flow = new DocumentFlow(PaperDirection.VERTICAL, page)
    expect(flow.place(80).columnIndex).toBe(0)
    expect(flow.place(30).columnIndex).toBe(1)
    flow.advance(PaperDirection.HORIZONTAL)
    expect(flow.state).toMatchObject({
      pageNo: 1,
      columnIndex: 0,
      direction: PaperDirection.HORIZONTAL,
      y: 20
    })
  })
  it('subtracts the union of exclusions and chooses a legal interval independent of input order', () => {
    const obstacles = [
      { pageNo: 0, x: 10, y: 20, width: 30, height: 40 },
      { pageNo: 0, x: 30, y: 20, width: 30, height: 60 }
    ]
    const first = new DocumentFlow(
      PaperDirection.VERTICAL,
      page,
      obstacles
    ).place(15)
    const second = new DocumentFlow(
      PaperDirection.VERTICAL,
      page,
      obstacles.reverse()
    ).place(15)
    expect(first).toEqual(second)
    expect(first).toMatchObject({ x: 50, width: 50, y: 20 })
  })
  it('does not put a cluster in a slit narrower than its advance', () => {
    const flow = new DocumentFlow(PaperDirection.VERTICAL, page, [
      { pageNo: 0, x: 10, y: 20, width: 99, height: 50 }
    ])
    expect(flow.place(20, 0, 0, 0, false, 12)).toMatchObject({
      x: 0,
      y: 70,
      width: 100
    })
  })
  it('rechecks the page after skipping an obstacle and permits an oversized line once at the slot top', () => {
    const flow = new DocumentFlow(PaperDirection.VERTICAL, page, [
      { pageNo: 0, x: 10, y: 20, width: 100, height: 110 }
    ])
    expect(flow.place(20)).toMatchObject({ columnIndex: 1, y: 20 })
    expect(flow.place(200)).toMatchObject({ pageNo: 1, columnIndex: 0, y: 20 })
  })
  it('accounts for spacing and variable page bounds once and keeps forks independent', () => {
    const flow = new DocumentFlow(PaperDirection.VERTICAL, pageNo => ({
      ...page(),
      top: pageNo ? 30 : 20
    }))
    const copy = flow.fork()
    copy.place(80, 10, 10)
    expect(copy.state.y).toBe(120)
    expect(flow.state.y).toBe(20)
    copy.place(20)
    expect(copy.state.columnIndex).toBe(1)
  })
})
describe('T15 native table windows', () => {
  it('clips carried rowspans and replays headers without translating cell-local children', () => {
    const child = {
      kind: 'textLine',
      rect: { x: 0, y: 0, width: 10, height: 10 }
    } as any
    const whole = {
      kind: 'tableFragment',
      rect: { x: 0, y: 0, width: 200, height: 150 },
      cells: [
        {
          id: 'header',
          scope: 'td:h',
          row: 0,
          column: 0,
          rowspan: 1,
          colspan: 1,
          rect: { x: 0, y: 0, width: 200, height: 30 },
          contentRect: { x: 5, y: 5, width: 190, height: 20 },
          children: [child]
        },
        {
          id: 'merged',
          scope: 'td:m',
          row: 1,
          column: 0,
          rowspan: 2,
          colspan: 1,
          rect: { x: 0, y: 30, width: 200, height: 120 },
          contentRect: { x: 5, y: 35, width: 190, height: 110 },
          children: [child]
        }
      ]
    } as TableFragment
    const fragment = sliceTableFragment(whole, {
      startRow: 2,
      endRow: 3,
      startOffset: 10,
      endOffset: 40,
      heights: [30, 60, 60],
      repeatedRows: [0],
      height: 60
    })
    expect(fragment.cells).toHaveLength(2)
    expect(fragment.cells[0]).toMatchObject({
      repeated: true,
      rect: { y: 0, height: 30 }
    })
    expect(fragment.cells[1]).toMatchObject({
      rect: { y: 30, height: 30 },
      clip: { y: 30, height: 30 }
    })
    expect(fragment.cells[1].children[0]).toBe(child)
    expect(whole.cells[1].rect.height).toBe(120)
  })
})
