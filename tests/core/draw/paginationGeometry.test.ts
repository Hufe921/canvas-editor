import { describe, expect, it } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { PaperDirection } from '@/editor/dataset/enum/Editor'
import type { IElement } from '@/editor/interface/Element'

function layout(): Draw {
  const options = mergeOption({
    width: 794,
    height: 1123,
    margins: [100, 120, 100, 120],
    header: { disabled: true },
    footer: { disabled: true },
    column: { count: 2, gap: 40 }
  })
  const table: IElement = {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 100 }],
    trList: Array.from({ length: 20 }, () => ({
      height: 100,
      minHeight: 100,
      tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }]
    }))
  }
  const main: IElement[] = [
    { value: 'portrait' },
    {
      type: ElementType.PAGE_BREAK,
      value: '\n',
      paperDirection: PaperDirection.HORIZONTAL
    },
    table,
    { value: '\nafter' }
  ]
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const draw = new Draw(
    container,
    options,
    { header: [], main, footer: [] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render()
  return draw
}
describe('column page-break geometry', () => {
  it('starts the table after an explicit page break in the first column of the new page', () => {
    const draw = layout()
    const fragments = draw.getRowList().filter(row => row.tableFragment)
    expect(fragments[0]?.columnIndex).toBe(0)
    expect(draw.getPageRowList()[0].some(row => row.tableFragment)).toBe(false)
    expect(
      draw.getPageRowList()[1].find(row => row.tableFragment)?.tableFragment
        ?.startTrIndex
    ).toBe(0)
  })
  it('places the second landscape column using that page geometry', () => {
    const draw = layout()
    const page = draw.getPageRowList()[1]
    expect(page.some(row => row.columnIndex === 1)).toBe(true)
    const right = draw
      .getPosition()
      .getTablePagingPositionList()
      .find(position => position.pageNo === 1 && position.columnIndex === 1)
    expect(right).toBeDefined()
    const direction = draw.getPageDirection(1)
    const expected =
      draw.getMargins(direction)[3] +
      (draw.getColumnLayout(direction)?.offsets[1] ?? 0)
    expect(right?.coordinate.leftTop[0]).toBeCloseTo(expected)
  })
})
