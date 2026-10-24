import { Draw } from '../../src/editor/core/draw/Draw'
import { EventBus } from '../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../src/editor/core/listener/Listener'
import { Override } from '../../src/editor/core/override/Override'
import { ElementType } from '../../src/editor/dataset/enum/Element'
import type { IElement } from '../../src/editor/interface/Element'
import type { IPadding } from '../../src/editor/interface/Common'
import { formatElementList } from '../../src/editor/utils/element'
import { mergeOption } from '../../src/editor/utils/option'

/** Local review probes: return failures so every independent case runs. */
export function reviewTableLayoutEdgesInBrowser() {
  const results: Array<{
    name: string
    scale: number
    passed: boolean
    detail: unknown
  }> = []
  for (const scale of [0.5, 1, 2]) {
    for (const name of [
      'spacing',
      'headers',
      'mixed',
      'spanning',
      'shrink',
      'sparse',
      'resize'
    ]) {
      const options = mergeOption({
        width: 300,
        height: 200,
        margins: [20, 20, 20, 20],
        preserveLeadingParagraph: true,
        defaultFont: 'serif',
        defaultRowMargin: 0,
        defaultBasicRowMarginHeight: 0,
        table: { tdPadding: [0, 0, 0, 0], defaultTrMinHeight: 0 },
        header: { disabled: true },
        footer: { disabled: true },
        scale
      })
      const text = (count: number): IElement[] =>
        Array.from({ length: count }, (_, i) => ({
          value: '\nline ' + i,
          lineHeight: { rule: 'exact', value: 20 },
          ...(name === 'spacing' ? { spacingBefore: 5, spacingAfter: 3 } : {})
        }))
      const row = (count: number, padding: IPadding) => ({
        height: 0,
        tdList: [{ colspan: 1, rowspan: 1, padding, value: text(count) }]
      })
      const source: IElement = {
        type: ElementType.TABLE,
        value: '',
        colgroup: [{ width: 120 }],
        trList:
          name === 'headers'
            ? [
                { ...row(1, [0, 0, 0, 0]), pagingRepeat: true },
                row(5, [0, 0, 0, 0]),
                { ...row(8, [3, 0, 5, 0]), keepTogether: true }
              ]
            : [
                row(
                  name === 'spacing' ? 20 : 1,
                  name === 'shrink'
                    ? [40, 0, 40, 0]
                    : name === 'resize'
                      ? [0, 40, 0, 40]
                      : [7, 5, 11, 3]
                )
              ]
      }
      if (name === 'mixed' || name === 'spanning') {
        const left = row(23, [7, 5, 11, 3]).tdList[0]
        const right = row(31, [13, 3, 5, 9]).tdList[0]
        left.rowspan = name === 'spanning' ? 2 : 1
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
        source.colgroup = [{ width: 120 }, { width: 120 }]
        source.trList = [
          { height: 0, tdList: [left, right] },
          ...(name === 'spanning' ? [row(2, [2, 3, 4, 5])] : []),
          {
            height: 0,
            tdList: [
              row(1, [4, 3, 6, 5]).tdList[0],
              row(1, [0, 0, 0, 0]).tdList[0]
            ]
          }
        ]
      }
      const main = [source]
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
        const td = source.trList?.[name === 'headers' ? 2 : 0]?.tdList[0]
        if (!td) throw new Error('Missing cell')
        if (['spacing', 'headers', 'mixed', 'spanning'].includes(name)) {
          const cells = source.trList?.flatMap(tr => tr.tdList) ?? []
          const positions = cells.flatMap(cell => cell.positionList ?? [])
          const overflow = positions.filter(
            p =>
              p.coordinate.leftBottom[1] > 180 * scale + 0.01 ||
              p.coordinate.leftTop[1] < 20 * scale - 0.01
          )
          const complete = cells.every(
            cell =>
              cell.positionList?.length === cell.value.length &&
              new Set(cell.positionList?.map(p => p.index)).size ===
                cell.value.length
          )
          const hits = cells.every(cell => {
            const tails = new Map(
              (cell.positionList ?? [])
                .filter(p => p.metrics.width > 0)
                .map(p => [p.pageNo, p])
            )
            return [...tails.values()].every(
              p =>
                draw.getPosition().getPositionByXY({
                  pageNo: p.pageNo,
                  x: (p.coordinate.leftTop[0] + p.coordinate.rightTop[0]) / 2,
                  y: (p.coordinate.leftTop[1] + p.coordinate.leftBottom[1]) / 2
                }).tdId === cell.id
            )
          })
          results.push({
            name,
            scale,
            passed: overflow.length === 0 && complete && hits,
            detail: {
              maximum: Math.max(
                ...positions.map(p => p.coordinate.leftBottom[1] / scale)
              ),
              limit: 180,
              overflow: overflow.length,
              complete,
              hits,
              positioned: positions.length,
              source: cells.reduce((n, cell) => n + cell.value.length, 0)
            }
          })
        } else if (name === 'shrink') {
          td.padding = [0, 0, 0, 0]
          draw.render({ isLazy: false })
          results.push({
            name,
            scale,
            passed: td.height === 20,
            detail: { actual: td.height, expected: 20 }
          })
        } else if (name === 'sparse') {
          td.padding = [0, 0, 0, 0]
          Reflect.deleteProperty(td.padding, '0')
          let rejected = false
          try {
            draw.render({ isLazy: false })
          } catch {
            rejected = true
          }
          results.push({
            name,
            scale,
            passed: rejected,
            detail: { rejected, height: td.height }
          })
        } else {
          const position = td.positionList?.[0]
          if (!position) throw new Error('Missing cell position')
          draw.getPosition().setPositionContext({
            isTable: true,
            index: main.indexOf(source),
            trIndex: 0,
            tdIndex: 0
          })
          draw.getPosition().setCursorPosition(position)
          draw.getTableTool().render()
          const border = host.querySelector('.ce-table-tool__border__col')
          if (!border) throw new Error('Missing resize border')
          const errors: string[] = []
          const onError = (event: ErrorEvent) => {
            errors.push(event.message)
            event.preventDefault()
          }
          window.addEventListener('error', onError)
          try {
            border.dispatchEvent(
              new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: 140 * scale,
                clientY: 30 * scale
              })
            )
            document.dispatchEvent(
              new MouseEvent('mousemove', {
                bubbles: true,
                clientX: 70 * scale,
                clientY: 30 * scale
              })
            )
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          } finally {
            window.removeEventListener('error', onError)
          }
          const width = source.colgroup?.[0]?.width ?? 0
          results.push({
            name,
            scale,
            passed:
              errors.length === 0 &&
              width > 80 &&
              !host.querySelector('.ce-table-anchor__line'),
            detail: {
              errors,
              width,
              horizontalPadding: 80,
              anchorLeftBehind: !!host.querySelector('.ce-table-anchor__line')
            }
          })
        }
      } finally {
        draw.destroy()
        host.remove()
      }
    }
  }
  return { passed: results.every(r => r.passed), results }
}
