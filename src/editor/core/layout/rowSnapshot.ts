import { ElementType } from '../../dataset/enum/Element'
import type { LayoutRow } from '../../interface/LayoutRow'
import type { IRow } from '../../interface/Row'
import { deepClone } from '../../utils'
import type { LayoutResult } from '../text-engine/types'
import { cellLayoutState } from './CellLayoutState'
import { lineCarets, textRangeRects } from './InteractionGeometry'
import { rowElementMetrics, rowSourceIndex } from './rowGeometry'

/** Detached compatibility output. Native layout/paint must never consume it. */
export function snapshotRows(
  rows: LayoutRow[],
  scale: number,
  findLayout: (row: LayoutRow) => LayoutResult | undefined,
  defaults: { defaultFont: string; defaultSize: number }
): IRow[] {
  return rows.map(row => {
    if (!row.node) throw new Error('Row snapshots require native layout nodes')
    const native = row.nativeLine
    const placed = native && { line: native, x: 0, y: 0, pageNo: 0, scale }
    const layout = findLayout(row)
    const lineIndex = Number(native?.id.split(':line:').at(-1) || 0)
    const result = {
      ...row,
      elementList: row.elementList.map((element, offset) => {
        const index = rowSourceIndex(row, offset)
        const rects = placed ? textRangeRects(placed, index, index + 1) : []
        const caret = placed && lineCarets(placed).find(c => c.index === index)
        const cluster = native?.clusters.find(c =>
          c.logicalIndices.includes(index)
        )
        return {
          ...element,
          ...(element.trList
            ? {
                trList: element.trList.map(tr => ({
                  ...tr,
                  tdList: tr.tdList.map(td => ({
                    ...td,
                    ...cellLayoutState(td),
                    rowList: snapshotRows(
                      td.rowList || [],
                      scale,
                      findLayout,
                      defaults
                    )
                  }))
                }))
              }
            : {}),
          metrics: rowElementMetrics(row, offset, scale, defaults.defaultSize),
          style: `${element.italic ? 'italic ' : ''}${element.bold ? 'bold ' : ''}${
            element.type === ElementType.SUPERSCRIPT ||
            element.type === ElementType.SUBSCRIPT
              ? Math.ceil((element.size || defaults.defaultSize) * 0.6)
              : element.size || defaults.defaultSize
          }px ${element.font || defaults.defaultFont}`,
          left: 0,
          sourceIndex: index,
          visualLeft: rects.length
            ? Math.min(...rects.map(r => r.x))
            : caret?.x || 0,
          bidiLevel: caret?.bidiLevel || 0,
          clusterStart: cluster && Math.min(...cluster.logicalIndices),
          clusterEnd: cluster && Math.max(...cluster.logicalIndices)
        }
      }),
      engineLine: layout?.lines[lineIndex],
      engineParagraphText: layout?.paragraphText,
      missingGlyphs: native?.inlines
        .filter(item => item.kind === 'missingGlyph')
        .map(item => ({
          ...item,
          rect: {
            ...item.rect,
            x: item.rect.x * scale,
            y: 0,
            width: item.rect.width * scale,
            height: item.rect.height * scale
          },
          advance: item.advance * scale,
          carets: item.carets.map(c => ({
            ...c,
            x: c.x * scale,
            y: 0,
            height: c.height * scale
          }))
        }))
    }
    return deepClone(result)
  })
}
