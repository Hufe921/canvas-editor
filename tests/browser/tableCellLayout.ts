import { Draw } from '../../src/editor/core/draw/Draw'
import { EventBus } from '../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../src/editor/core/listener/Listener'
import { Override } from '../../src/editor/core/override/Override'
import { ElementType } from '../../src/editor/dataset/enum/Element'
import type { IElement } from '../../src/editor/interface/Element'
import { formatElementList } from '../../src/editor/utils/element'
import { mergeOption } from '../../src/editor/utils/option'

/** Run with unmocked Canvas metrics through Vite, as paragraphLayout.ts does. */
export function reviewTableLayoutInBrowser() {
  const results: Array<{ scale: number; pages: number; fragments: number }> = []
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message)
  }
  const text = (count: number): IElement[] =>
    Array.from({ length: count }, (_, i) => ({
      value: '\nline ' + i,
      lineHeight: { rule: 'exact', value: 20 }
    }))
  for (const scale of [0.5, 1, 2]) {
    const options = mergeOption({
      width: 600,
      height: 200,
      margins: [20, 20, 20, 20],
      column: { count: 2, gap: 20 },
      preserveLeadingParagraph: true,
      defaultFont: 'serif',
      defaultRowMargin: 0,
      defaultBasicRowMarginHeight: 0,
      table: { tdPadding: [0, 0, 0, 0], defaultTrMinHeight: 0 },
      header: { disabled: true },
      footer: { disabled: true },
      scale
    })
    const table: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 120 }],
      trList: [
        {
          height: 0,
          tdList: [
            { colspan: 1, rowspan: 1, padding: [4, 6, 8, 10], value: text(3) }
          ]
        },
        {
          height: 0,
          keepTogether: true,
          tdList: [
            { colspan: 1, rowspan: 1, padding: [6, 8, 10, 12], value: text(4) }
          ]
        }
      ]
    }
    const main = [...text(3), table]
    formatElementList(main, {
      editorOptions: options,
      isForceCompensation: true
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const draw = new Draw(
      host,
      options,
      { main, header: [], footer: [] },
      new Listener(),
      new EventBus(),
      new Override()
    )
    try {
      draw.render({ isLazy: false })
      const fragments = draw.getRowList().filter(row => row.tableFragment)
      check(
        draw.getPageRowList().length === 1,
        'Whole table skipped the available first column'
      )
      check(
        fragments.length === 2 &&
          fragments[0].columnIndex === 0 &&
          fragments[1].columnIndex === 1,
        'Expected one fragment in each column'
      )
      check(
        fragments.every(
          row =>
            !row.tableFragment?.startSplitTrOffset &&
            row.tableFragment?.endSplitTrHeight === undefined
        ),
        'Kept row was split'
      )
      const first = table.trList?.[0]?.tdList[0]
      const position = first?.positionList?.[0]
      const box = fragments[0]?.fragmentPosition
      if (!first || !position || !box) throw new Error('Missing cell geometry')
      check(
        Math.abs(
          position.coordinate.leftTop[0] -
            box.coordinate.leftTop[0] -
            10 * scale
        ) < 0.01,
        'Cell left padding lost'
      )
      check(
        Math.abs(
          position.coordinate.leftTop[1] - box.coordinate.leftTop[1] - 4 * scale
        ) < 0.01,
        'Cell top padding lost'
      )
      const hit = draw
        .getPosition()
        .getPositionByXY({
          pageNo: 0,
          x: position.coordinate.leftTop[0] + 1,
          y: position.coordinate.leftTop[1] + 5 * scale
        })
      check(
        hit.isTable === true && hit.tdId === first.id,
        'Cell selection lost ownership'
      )
      const saved = draw
        .getValue()
        .data.main.find(el => el.type === ElementType.TABLE)
      check(
        JSON.stringify(saved?.trList?.[0]?.tdList[0]?.padding) === '[4,6,8,10]',
        'Saved padding differs'
      )
      check(saved?.trList?.[1]?.keepTogether === true, 'Saved row keep differs')
      results.push({
        scale,
        pages: draw.getPageRowList().length,
        fragments: fragments.length
      })
    } finally {
      draw.destroy()
      host.remove()
    }
  }
  return results
}
