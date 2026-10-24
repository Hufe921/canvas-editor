import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ElementType } from '@/editor/dataset/enum/Element'
import { VerticalAlign } from '@/editor/dataset/enum/VerticalAlign'
import type { IElement } from '@/editor/interface/Element'
import type { IEditorOption } from '@/editor/interface/Editor'
import type { IPadding } from '@/editor/interface/Common'
import type { ITd } from '@/editor/interface/table/Td'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

const draws: Draw[] = []
function render(main: IElement[], override: IEditorOption = {}) {
  const options = mergeOption({
    width: 300,
    height: 200,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    preserveLeadingParagraph: true,
    defaultRowMargin: 0,
    defaultBasicRowMarginHeight: 0,
    table: { tdPadding: [0, 0, 0, 0], defaultTrMinHeight: 0 },
    ...override
  })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const draw = new Draw(
    container,
    options,
    { main, header: [], footer: [] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  draw.render()
  return draw
}
function text(lines: number): IElement[] {
  return Array.from({ length: lines }, (_, i) => ({
    value: '\nline ' + i,
    lineHeight: { rule: 'exact', value: 20 }
  }))
}
function cell(lines: number, padding?: IPadding): ITd {
  return {
    colspan: 1,
    rowspan: 1,
    value: text(lines),
    ...(padding ? { padding } : {})
  }
}
function table(cells: ITd[][]): IElement {
  return {
    type: ElementType.TABLE,
    value: '',
    colgroup: (cells[0] ?? []).map(() => ({ width: 120 })),
    trList: cells.map(tdList => ({ height: 0, tdList }))
  }
}
function retainedTable(draw: Draw): IElement {
  const value = draw
    .getOriginalElementList()
    .find(el => el.type === ElementType.TABLE)
  if (!value) throw new Error('Missing table')
  return value
}
afterEach(() => {
  for (const draw of draws.splice(0)) draw.destroy()
  document.body.replaceChildren()
})

describe('authored table cell layout', () => {
  it.each([0.5, 1, 2])(
    'uses each cell padding for height, origin, vertical alignment and context at zoom %s',
    scale => {
      const first = cell(1, [7, 11, 13, 17])
      for (const el of first.value) {
        el.spacingBefore = 5
        el.spacingAfter = 3
      }
      const second = cell(1, [0, 0, 0, 0])
      second.verticalAlign = VerticalAlign.BOTTOM
      const draw = render([table([[first, second]])], { scale })
      const value = retainedTable(draw)
      const td = value.trList?.[0]?.tdList[0]
      const right = value.trList?.[0]?.tdList[1]
      const box = draw
        .getPosition()
        .getPositionList()
        .find(p => p.index === draw.getOriginalElementList().indexOf(value))
      if (!td || !right || !box) throw new Error('Missing positioned cells')
      expect(td.height).toBe(48)
      expect(td.positionList?.[0]?.coordinate.leftTop[0]).toBeCloseTo(
        box.coordinate.leftTop[0] + 17 * scale
      )
      expect(td.positionList?.[0]?.coordinate.leftTop[1]).toBeCloseTo(
        box.coordinate.leftTop[1] + 12 * scale
      )
      expect(right.positionList?.[0]?.coordinate.leftTop[1]).toBeCloseTo(
        box.coordinate.leftTop[1] + 28 * scale
      )
      draw.getPosition().setPositionContext({
        isTable: true,
        index: draw.getOriginalElementList().indexOf(value),
        trIndex: 0,
        tdIndex: 0
      })
      expect(draw.getContextInnerWidth()).toBe(92)
      expect(draw.getTdPadding(td)).toEqual([
        7 * scale,
        11 * scale,
        13 * scale,
        17 * scale
      ])
      draw.render()
      expect(td.height).toBe(48)
    }
  )

  it('preserves custom and zero padding plus row keeps on save/reopen', () => {
    const source = table([[cell(1, [1, 2, 3, 4]), cell(1, [0, 0, 0, 0])]])
    if (!source.trList?.[0]) throw new Error('Missing row')
    source.trList[0].keepTogether = true
    const saved = render([source]).getValue()
    const reopened = render(saved.data.main, saved.options)
    const value = retainedTable(reopened)
    expect(value.trList?.[0]?.keepTogether).toBe(true)
    expect(value.trList?.[0]?.tdList.map(td => td.padding)).toEqual([
      [1, 2, 3, 4],
      [0, 0, 0, 0]
    ])
  })

  it('uses global padding only for cells without an explicit tuple', () => {
    const draw = render([table([[cell(1), cell(1, [0, 0, 0, 0])]])], {
      scale: 2,
      table: { tdPadding: [2, 4, 6, 8], defaultTrMinHeight: 0 }
    })
    const cells = retainedTable(draw).trList?.[0]?.tdList
    expect(draw.getOriginalTdPadding(cells?.[0])).toEqual([2, 4, 6, 8])
    expect(draw.getTdPadding(cells?.[0])).toEqual([4, 8, 12, 16])
    expect(draw.getTdPadding(cells?.[1])).toEqual([0, 0, 0, 0])
  })

  it('keeps nested cell origins separate from outer cell padding', () => {
    const inner = table([[cell(1, [2, 4, 6, 8])]])
    const outer = cell(1, [3, 7, 11, 13])
    outer.value.push(inner)
    const draw = render([table([[outer]])])
    const outerCell = retainedTable(draw).trList?.[0]?.tdList[0]
    const nested = outerCell?.value.find(el => el.type === ElementType.TABLE)
    const innerCell = nested?.trList?.[0]?.tdList[0]
    const box = outerCell?.positionList?.find(
      p => p.index === outerCell.value.indexOf(inner)
    )
    if (!box || !innerCell) throw new Error('Missing nested geometry')
    expect(innerCell.positionList?.[0]?.coordinate.leftTop[0]).toBeCloseTo(
      box.coordinate.leftTop[0] + 8
    )
    expect(innerCell.positionList?.[0]?.coordinate.leftTop[1]).toBeCloseTo(
      box.coordinate.leftTop[1] + 2
    )
  })

  it('moves a kept row to the next page instead of splitting it into available space', () => {
    const source = table([[cell(3)], [cell(4)]])
    if (!source.trList?.[1]) throw new Error('Missing row')
    source.trList[1].keepTogether = true
    const draw = render([...text(3), source])
    const fragments = draw
      .getRowList()
      .flatMap(row => (row.tableFragment ? [row.tableFragment] : []))
    expect(
      fragments.map(fragment => [fragment.startTrIndex, fragment.endTrIndex])
    ).toEqual([
      [0, 1],
      [1, 2]
    ])
    expect(
      fragments.every(
        fragment =>
          fragment.endSplitTrHeight === undefined &&
          !fragment.startSplitTrOffset
      )
    ).toBe(true)
    const td = retainedTable(draw).trList?.[1]?.tdList[0]
    expect(
      new Set(td?.positionList?.map(position => position.pageNo)).size
    ).toBe(1)
  })

  it('still splits oversized kept rows and retains every positioned character', () => {
    const source = table([[cell(20, [3, 4, 5, 6])]])
    if (!source.trList?.[0]) throw new Error('Missing row')
    source.trList[0].keepTogether = true
    const draw = render([source])
    const td = retainedTable(draw).trList?.[0]?.tdList[0]
    const fragments = draw.getRowList().filter(row => row.tableFragment)
    expect(fragments.length).toBeGreaterThan(2)
    expect(td?.positionList).toHaveLength(td?.value.length ?? -1)
    expect(
      new Set(td?.positionList?.map(position => position.index)).size
    ).toBe(td?.value.length)
  })

  it('fills the remaining first column before moving a kept row to the next column', () => {
    const source = table([[cell(3)], [cell(4)]])
    if (!source.trList?.[1]) throw new Error('Missing row')
    source.trList[1].keepTogether = true
    const draw = render([...text(3), source], {
      width: 600,
      column: { count: 2, gap: 20 }
    })
    const fragments = draw.getRowList().filter(row => row.tableFragment)
    expect(draw.getPageRowList()).toHaveLength(1)
    expect(
      fragments.map(row => [
        row.tableFragment?.startTrIndex,
        row.tableFragment?.endTrIndex,
        row.columnIndex
      ])
    ).toEqual([
      [0, 1, 0],
      [1, 2, 1]
    ])
  })

  it('uses custom padding in repeated headers without adding selectable source copies', () => {
    const source = table([
      [cell(1, [4, 8, 6, 12])],
      ...Array.from({ length: 4 }, () => [cell(3, [2, 4, 3, 6])])
    ])
    if (!source.trList?.[0]) throw new Error('Missing header')
    source.trList[0].pagingRepeat = true
    for (const row of source.trList) row.keepTogether = true
    const draw = render([source])
    const repeats = draw
      .getRowList()
      .flatMap(row => row.repeatTdPositionList ?? [])
    expect(repeats.length).toBeGreaterThan(0)
    const td = retainedTable(draw).trList?.[0]?.tdList[0]
    expect(td?.positionList).toHaveLength(td?.value.length ?? -1)
    const headerX = td?.positionList?.[0]?.coordinate.leftTop[0]
    for (const repeated of repeats)
      expect(repeated.positionList[0]?.coordinate.leftTop[0]).toBe(headerX)
  })

  it('rejects a sparse padding tuple', () => {
    const padding: IPadding = [0, 0, 0, 0]
    Reflect.deleteProperty(padding, '0')
    expect(() => render([table([[cell(1, padding)]])])).toThrow(/padding/)
  })

  it('recomputes row minimums when authored padding is reduced', () => {
    const draw = render([table([[cell(1, [40, 0, 40, 0])]])])
    const td = retainedTable(draw).trList?.[0]?.tdList[0]
    if (!td) throw new Error('Missing cell')
    expect(td.height).toBe(100)
    td.padding = [0, 0, 0, 0]
    draw.render()
    expect(td.height).toBe(20)
    expect(retainedTable(draw).trList?.[0]?.minHeight).toBe(0)
    const saved = draw.getValue()
    const reopened = render(saved.data.main, saved.options)
    expect(retainedTable(reopened).trList?.[0]?.tdList[0].height).toBe(20)
  })

  it.each([0.5, 1, 2])(
    'retains spaced content across split windows at zoom %s',
    scale => {
      const td = cell(20, [7, 5, 11, 3])
      for (const el of td.value) {
        el.spacingBefore = 5
        el.spacingAfter = 3
      }
      const draw = render([table([[td]])], { scale })
      expect(draw.getPageRowList().length).toBeGreaterThan(2)
      expect(td.positionList).toHaveLength(td.value.length)
      expect(new Set(td.positionList?.map(p => p.index)).size).toBe(
        td.value.length
      )
      for (const p of td.positionList ?? []) {
        expect(p.coordinate.leftTop[1]).toBeGreaterThanOrEqual(20 * scale)
        expect(p.coordinate.leftBottom[1]).toBeLessThanOrEqual(180 * scale)
      }
    }
  )

  it.each([0.5, 1, 2])(
    'honors a page break before a short table in columns at zoom %s',
    scale => {
      const draw = render(
        [
          ...text(1),
          { type: ElementType.PAGE_BREAK, value: '\n' },
          table([[cell(1, [3, 4, 5, 6])]])
        ],
        { width: 600, column: { count: 2, gap: 20 }, scale }
      )
      const td = retainedTable(draw).trList?.[0]?.tdList[0]
      expect(new Set(td?.positionList?.map(p => p.pageNo))).toEqual(
        new Set([1])
      )
      expect(td?.positionList?.[0]?.coordinate.leftTop[0]).toBe(26 * scale)
    }
  )

  it('keeps a row intact when it exactly fits below a repeated header', () => {
    const source = table([[cell(1)], [cell(5)], [cell(7)]])
    if (!source.trList?.[0] || !source.trList[2])
      throw new Error('Missing rows')
    source.trList[0].pagingRepeat = true
    source.trList[2].keepTogether = true
    const draw = render([source])
    const td = source.trList[2].tdList[0]
    expect(draw.getPageRowList()).toHaveLength(2)
    expect(new Set(td.positionList?.map(p => p.pageNo))).toEqual(new Set([1]))
    expect(
      draw
        .getRowList()
        .filter(r => r.tableFragment)
        .every(
          r =>
            r.tableFragment?.endSplitTrHeight === undefined &&
            !r.tableFragment?.startSplitTrOffset
        )
    ).toBe(true)
  })

  it('splits an oversized kept row after reserving repeated header height', () => {
    const source = table([[cell(1)], [cell(5)], [cell(8, [3, 0, 5, 0])]])
    if (!source.trList?.[0] || !source.trList[2])
      throw new Error('Missing rows')
    source.trList[0].pagingRepeat = true
    source.trList[2].keepTogether = true
    const draw = render([source])
    const td = source.trList[2].tdList[0]
    expect(
      draw
        .getRowList()
        .some(row => row.tableFragment?.endSplitTrHeight !== undefined)
    ).toBe(true)
    expect(td.positionList).toHaveLength(td.value.length)
    expect(new Set(td.positionList?.map(p => p.index)).size).toBe(
      td.value.length
    )
    for (const p of td.positionList ?? [])
      expect(p.coordinate.leftBottom[1]).toBeLessThanOrEqual(180)
  })

  it('positions padded spanning cells once across page boundaries', () => {
    const spanning = cell(12, [9, 5, 13, 7])
    spanning.rowspan = 4
    const source = table([[spanning, cell(3)], [cell(3)], [cell(3)], [cell(3)]])
    const draw = render([source])
    expect(draw.getPageRowList().length).toBeGreaterThan(1)
    expect(spanning.positionList).toHaveLength(spanning.value.length)
    expect(new Set(spanning.positionList?.map(p => p.index)).size).toBe(
      spanning.value.length
    )
  })

  it('retains an explicit row minimum when cell padding is smaller', () => {
    const source = table([[cell(1, [1, 2, 3, 4])]])
    if (!source.trList?.[0]) throw new Error('Missing row')
    source.trList[0].minHeight = 100
    const draw = render([source])
    expect(retainedTable(draw).trList?.[0]?.tdList[0].height).toBe(100)
    draw.render()
    expect(retainedTable(draw).trList?.[0]?.minHeight).toBe(100)
  })

  it.each([0.5, 1, 2])(
    'clips padded spaced cells to the permitted last page at zoom %s',
    scale => {
      const td = cell(20, [7, 5, 11, 3])
      for (const el of td.value) {
        el.spacingBefore = 5
        el.spacingAfter = 3
      }
      const draw = render([table([[td]])], {
        scale,
        pageNumber: { maxPageNo: 0 }
      })
      expect(draw.getPageRowList()).toHaveLength(1)
      expect(td.positionList).toHaveLength(td.value.length)
      expect(new Set(td.positionList?.map(p => p.index)).size).toBe(
        td.value.length
      )
      for (const p of td.positionList ?? []) {
        expect(p.pageNo).toBe(0)
        expect(p.coordinate.leftBottom[1]).toBeLessThanOrEqual(180 * scale)
      }
      const saved = draw.getValue()
      const reopened = render(saved.data.main, saved.options)
      expect(reopened.getPageRowList()).toHaveLength(1)
    }
  )

  it.each([-1, NaN, Infinity])(
    'rejects unsafe padding %s before producing cell geometry',
    value => {
      expect(() => render([table([[cell(1, [value, 0, 0, 0])]])])).toThrow(
        /padding/
      )
    }
  )
  it.each([0, 1, 2, 3])('rejects a hole at padding index %s', index => {
    const padding: IPadding = [0, 0, 0, 0]
    Reflect.deleteProperty(padding, String(index))
    expect(() => render([table([[cell(1, padding)]])])).toThrow(/padding/)
  })

  it.each([0.5, 1, 2])(
    'fits unequal cell rhythms, rowspans and subsequent rows at zoom %s',
    scale => {
      for (const columns of [1, 2]) {
        for (const spanning of [false, true]) {
          const left = cell(23, [7, 5, 11, 3])
          const right = cell(31, [13, 3, 5, 9])
          left.rowspan = spanning ? 2 : 1
          for (const el of left.value) {
            el.lineHeight = { rule: 'exact', value: 23 }
            el.spacingBefore = 3
            el.spacingAfter = 2
          }
          for (const el of right.value) {
            el.lineHeight = { rule: 'exact', value: 17 }
            el.spacingBefore = 7
            el.spacingAfter = 1
          }
          const last = cell(1, [4, 3, 6, 5])
          const source = table([
            [left, right],
            ...(spanning ? [[cell(2)]] : []),
            [last, cell(1)]
          ])
          const draw = render([source], {
            scale,
            width: 600,
            column: { count: columns, gap: 20 }
          })
          expect(draw.getPageRowList().length).toBeGreaterThan(1)
          for (const td of [left, right, last]) {
            expect(td.positionList).toHaveLength(td.value.length)
            expect(new Set(td.positionList?.map(p => p.index)).size).toBe(
              td.value.length
            )
            for (const p of td.positionList ?? []) {
              expect(p.coordinate.leftTop[1]).toBeGreaterThanOrEqual(
                20 * scale - 1e-8
              )
              expect(p.coordinate.leftBottom[1]).toBeLessThanOrEqual(
                180 * scale + 1e-8
              )
            }
            const tails = new Map(
              (td.positionList ?? [])
                .filter(p => p.metrics.width > 0)
                .map(p => [p.pageNo, p])
            )
            for (const p of tails.values()) {
              const hit = draw
                .getPosition()
                .getPositionByXY({
                  pageNo: p.pageNo,
                  x: (p.coordinate.leftTop[0] + p.coordinate.rightTop[0]) / 2,
                  y: (p.coordinate.leftTop[1] + p.coordinate.leftBottom[1]) / 2
                })
              expect(hit.tdId).toBe(td.id)
            }
          }
          const lastStart = last.positionList?.[0]
          if (!lastStart) throw new Error('Missing following row')
          const prior = [
            ...(left.positionList ?? []),
            ...(right.positionList ?? [])
          ].filter(
            p =>
              p.pageNo === lastStart.pageNo &&
              p.coordinate.leftTop[0] <
                lastStart.coordinate.leftTop[0] + 240 * scale &&
              p.coordinate.leftTop[0] >=
                lastStart.coordinate.leftTop[0] - 10 * scale
          )
          for (const p of prior)
            expect(p.coordinate.leftBottom[1]).toBeLessThanOrEqual(
              lastStart.coordinate.leftTop[1]
            )
        }
      }
    }
  )

  it.each([0.5, 1, 2])(
    'keeps large asymmetric vertical padding bounded at zoom %s',
    scale => {
      for (const padding of [
        [72, 0, 5, 0],
        [5, 0, 72, 0],
        [37, 0, 37, 0]
      ] satisfies IPadding[]) {
        const td = cell(20, padding)
        const next = cell(1)
        const source = table([[td], [next]])
        const draw = render([source], { scale })
        expect(draw.getPageRowList().length).toBeGreaterThan(2)
        expect(td.positionList).toHaveLength(td.value.length)
        expect(new Set(td.positionList?.map(p => p.index)).size).toBe(
          td.value.length
        )
        for (const p of [
          ...(td.positionList ?? []),
          ...(next.positionList ?? [])
        ]) {
          expect(p.coordinate.leftTop[1]).toBeGreaterThanOrEqual(
            20 * scale - 1e-8
          )
          expect(p.coordinate.leftBottom[1]).toBeLessThanOrEqual(
            180 * scale + 1e-8
          )
        }
      }
    }
  )

  it('constrains both sides of a boundary including spanning owners', () => {
    const spanning = cell(1, [0, 110, 0, 110])
    spanning.colspan = 2
    const source = table([
      [cell(1, [0, 40, 0, 40]), cell(1, [0, 50, 0, 50])],
      [spanning]
    ])
    const draw = render([source])
    const particle = draw.getTableParticle()
    expect(particle.constrainColResize(source, 0, -100)).toBe(-39)
    expect(particle.constrainColResize(source, 0, 100)).toBe(19)
    expect(particle.constrainColResize(source, 1, -100)).toBe(-19)
    expect(particle.constrainColResize(source, 0, 100, true)).toBe(19)
    expect(source.colgroup?.map(col => col.width)).toEqual([120, 120])
  })

  it('cleans up and restores column sizes if rendering a drag fails', () => {
    const source = table([[cell(1, [0, 40, 0, 40])]])
    const draw = render([source])
    const td = source.trList?.[0]?.tdList[0]
    const position = td?.positionList?.[0]
    if (!position) throw new Error('Missing cell position')
    draw.getPosition().setPositionContext({
      isTable: true,
      index: draw.getOriginalElementList().indexOf(source),
      trIndex: 0,
      tdIndex: 0
    })
    draw.getPosition().setCursorPosition(position)
    draw.getTableTool().render()
    const border = draw
      .getContainer()
      .querySelector('.ce-table-tool__border__col')
    if (!border) throw new Error('Missing border')
    const widths = source.colgroup?.map(col => col.width)
    const errorListener = (event: ErrorEvent) => event.preventDefault()
    window.addEventListener('error', errorListener)
    const renderSpy = vi.spyOn(draw, 'render').mockImplementation(() => {
      throw new Error('Injected render failure')
    })
    try {
      border.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          clientX: 140,
          clientY: 30
        })
      )
      document.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 70, clientY: 30 })
      )
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
      expect(source.colgroup?.map(col => col.width)).toEqual(widths)
      expect(
        draw.getContainer().querySelector('.ce-table-anchor__line')
      ).toBeNull()
      expect(document.body.style.cursor).toBe('')
      document.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 30 })
      )
      expect(renderSpy).toHaveBeenCalledTimes(1)
    } finally {
      renderSpy.mockRestore()
      window.removeEventListener('error', errorListener)
    }
  })
  it('rejects a cell with no usable horizontal content area', () => {
    expect(() => render([table([[cell(1, [0, 60, 0, 60])]])])).toThrow(
      /no usable content width/
    )
  })
})
