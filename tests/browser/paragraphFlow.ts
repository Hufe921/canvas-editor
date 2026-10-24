import { BackendType } from '../../src/editor/dataset/enum/Editor'
import { Draw } from '../../src/editor/core/draw/Draw'
import { EventBus } from '../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../src/editor/core/listener/Listener'
import { Override } from '../../src/editor/core/override/Override'
import type { IElement } from '../../src/editor/interface/Element'
import { formatElementList } from '../../src/editor/utils/element'
import { mergeOption } from '../../src/editor/utils/option'

/** Unmocked browser measurements determine the fixture's line count. */
export function reviewParagraphFlowInBrowser(backend = BackendType.CANVAS) {
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) throw new Error('Canvas metrics unavailable')
  probe.font = '16px monospace'
  const letters = Math.floor(80 / probe.measureText('x').width)
  if (letters < 2) throw new Error('Unexpected monospace metrics')
  const results: Array<{ name: string; scale: number; pages: number }> = []
  const prefix = (n: number): IElement[] =>
    Array.from({ length: n }, () => ({
      value: '\npre',
      lineHeight: { rule: 'exact', value: 20 }
    }))
  const paragraph = (n: number, style: Partial<IElement>): IElement => ({
    value: '\n' + 'x'.repeat(n * letters - 1),
    lineHeight: { rule: 'exact', value: 20 },
    ...style
  })
  for (const scale of [0.5, 1, 2])
    for (const name of [
      'keep',
      'orphan',
      'widow',
      'chain',
      'columns',
      'break',
      'oversized'
    ]) {
      const main =
        name === 'chain'
          ? [
              ...prefix(5),
              paragraph(1, { keepWithNext: true }),
              paragraph(4, { widowControl: true })
            ]
          : name === 'break'
            ? [...prefix(1), paragraph(1, { pageBreakBefore: true })]
            : [
                ...prefix(name === 'orphan' ? 7 : name === 'oversized' ? 1 : 5),
                paragraph(
                  name === 'oversized' ? 20 : 4,
                  name === 'keep' || name === 'columns' || name === 'oversized'
                    ? { keepTogether: true }
                    : { widowControl: true }
                )
              ]
      const options = mergeOption({
      backend,
        width: name === 'columns' || name === 'break' ? 240 : 120,
        height: 200,
        margins: [20, 20, 20, 20],
        scale,
        defaultFont: 'monospace',
        defaultSize: 16,
        column: {
          count: name === 'columns' || name === 'break' ? 2 : 1,
          gap: 40
        },
        preserveLeadingParagraph: true,
        header: { disabled: true },
        footer: { disabled: true },
        defaultRowMargin: 0,
        defaultBasicRowMarginHeight: 0
      })
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
      const check = (condition: boolean, message: string) => {
        if (!condition) throw new Error(name + ' at ' + scale + ': ' + message)
      }
      try {
        draw.render({ isLazy: false })
        const pages = draw.getPageRowList()
        const counts = (
          key: 'keepTogether' | 'widowControl' | 'keepWithNext'
        ) =>
          pages.map(
            rows =>
              rows.filter(row => row.elementList.some(el => el[key])).length
          )
        if (name === 'keep')
          check(
            JSON.stringify(counts('keepTogether')) === '[0,4]',
            'Kept paragraph split'
          )
        if (name === 'orphan')
          check(
            JSON.stringify(counts('widowControl')) === '[0,4]',
            'Orphan first line'
          )
        if (name === 'widow')
          check(
            JSON.stringify(counts('widowControl')) === '[2,2]',
            'Widow final line'
          )
        if (name === 'chain')
          check(
            JSON.stringify(counts('keepWithNext')) === '[0,1]' &&
              JSON.stringify(counts('widowControl')) === '[0,4]',
            'Heading detached'
          )
        if (name === 'columns')
          check(
            pages.length === 1 &&
              draw
                .getRowList()
                .filter(row => row.elementList.some(el => el.keepTogether))
                .every(row => row.columnIndex === 1),
            'Column reservation lost'
          )
        if (name === 'break')
          check(
            pages.length === 2 && pages[1]?.[0]?.columnIndex === 0,
            'Break advanced only a column'
          )
        if (name === 'oversized')
          check(
            JSON.stringify(counts('keepTogether')) === '[0,8,8,4]',
            'Oversized paragraph failed to progress'
          )
        const positions = draw.getPosition().getPositionList()
        check(positions.length === main.length, 'Characters lost or duplicated')
        for (const position of positions) {
          check(
            position.coordinate.leftTop[1] >= 20 * scale - 0.01 &&
              position.coordinate.leftBottom[1] <= 180 * scale + 0.01,
            'Content outside page'
          )
        }
        results.push({ name, scale, pages: pages.length })
      } finally {
        draw.destroy()
        host.remove()
      }
    }
  return results
}
