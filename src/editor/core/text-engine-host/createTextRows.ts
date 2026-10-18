import type { RowFlex } from '../../dataset/enum/Row'
import type { IElement } from '../../interface/Element'
import type { TextLine } from '../../interface/Layout'
import type { LayoutRow } from '../../interface/LayoutRow'

/** A flow view over native nodes, with no legacy glyph/element projection. */
export function createTextRows(
  lines: TextLine[],
  elements: IElement[],
  startRowIndex: number,
  scale: number,
  rowFlex?: RowFlex
): LayoutRow[] {
  return lines.map((line, index) => {
    // Include zero-ink/empty source slots as well as visible clusters.
    const indices = Array.from(
      { length: line.source.end - line.source.start },
      (_, offset) => line.source.start + offset
    ).filter(index => !!elements[index])
    return {
      node: line,
      nativeLine: line,
      width: line.rect.width * scale,
      height: (line.contentHeight + line.spacingAfter) * scale,
      ascent: line.baseline * scale,
      offsetY: line.spacingBefore * scale,
      spacingAfter: line.spacingAfter * scale,
      direction: line.direction,
      rowFlex,
      startIndex: indices[0] ?? line.source.start,
      rowIndex: startRowIndex + index,
      sourceIndices: indices,
      elementList: indices.map(index => elements[index]),
      isWidthNotEnough: false
    }
  })
}
