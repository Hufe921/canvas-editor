import { afterEach, describe, expect, it } from 'vitest'
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
      draw
        .getPosition()
        .setPositionContext({
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

  it.each([-1, NaN, Infinity])(
    'rejects unsafe padding %s before producing cell geometry',
    value => {
      expect(() => render([table([[cell(1, [value, 0, 0, 0])]])])).toThrow(
        /padding/
      )
    }
  )
  it('rejects a cell with no usable horizontal content area', () => {
    expect(() => render([table([[cell(1, [0, 60, 0, 60])]])])).toThrow(
      /no usable content width/
    )
  })
})
