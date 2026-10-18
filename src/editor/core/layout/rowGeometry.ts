import type { IElementMetrics } from '../../interface/Element'
import type { TextLine } from '../../interface/Layout'
import type { LayoutRow } from '../../interface/LayoutRow'
import { lineSegments } from './InteractionGeometry'

export function rowSourceIndex(row: LayoutRow, offset: number) {
  return row.sourceIndices?.[offset] ?? row.startIndex + offset
}

const sourceBoxes = new WeakMap<
  TextLine,
  Map<number, { left: number; right: number }>
>()
function boxesFor(line: TextLine) {
  const previous = sourceBoxes.get(line)
  if (previous) return previous
  const boxes = new Map<number, { left: number; right: number }>()
  for (const segment of lineSegments({ line, x: 0, y: 0, pageNo: 0, scale: 1 }))
    for (let index = segment.start; index < segment.end; index++) {
      const before = boxes.get(index)
      boxes.set(index, {
        left: Math.min(before?.left ?? Infinity, segment.rect.x),
        right: Math.max(
          before?.right ?? -Infinity,
          segment.rect.x + segment.rect.width
        )
      })
    }
  sourceBoxes.set(line, boxes)
  return boxes
}

/** Public/paint position DTO metrics, computed from native nodes on demand. */
export function rowElementMetrics(
  row: LayoutRow,
  offset: number,
  scale: number,
  defaultSize = 16
): IElementMetrics {
  const line = row.nativeLine
  if (!row.node && !line)
    throw new Error('Row geometry requires a native layout node')
  if (!line) {
    const height =
      row.node?.kind === 'tableFragment'
        ? Math.max(0, row.height - (row.spacingAfter || 0))
        : row.node?.hidden || (row.node?.kind === 'block' && row.node.outOfFlow)
          ? 0
          : (row.node?.rect.height || 0) * scale
    return {
      width: row.width,
      height,
      boundingBoxAscent: 0,
      boundingBoxDescent: height
    }
  }
  const index = rowSourceIndex(row, offset)
  const box = boxesFor(line).get(index)
  const width = box ? (box.right - box.left) * scale : 0
  const label = line.labels?.find(label => label.source.start === index)
  const object = line.inlines.find(
    item =>
      item.kind === 'inlineObject' &&
      item.objectType !== 'controlSpace' &&
      item.source.start === index
  )
  const image =
    object?.kind === 'inlineObject' &&
    (object.objectType === 'image' || object.objectType === 'latex')
  const height = label
    ? label.rect.height * scale
    : image
      ? object.ascent * scale
      : object
        ? (row.elementList[offset].size || defaultSize) * scale
        : line.contentHeight * scale
  const ascent = label
    ? label.baseline * scale
    : image
      ? height
      : object
        ? 0
        : line.baseline * scale
  return {
    width,
    height,
    boundingBoxAscent: ascent,
    boundingBoxDescent: label
      ? height - ascent
      : image
        ? object.descent * scale
        : object
          ? height
          : (line.contentHeight - line.baseline) * scale
  }
}
