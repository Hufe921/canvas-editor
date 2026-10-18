import type { LayoutCaret, LayoutRect, TextLine } from '../../interface/Layout'

/** One placement of immutable scope-local geometry, in page CSS pixels. */
export interface PlacedTextLine {
  line: TextLine
  pageNo: number
  x: number
  y: number
  scale: number
  columnIndex?: number
  clip?: LayoutRect
}

export interface NativeCaret extends LayoutCaret {
  index: number
  pageNo: number
  lineId: string
  scope: string
}

export function hostCaretIndex(line: TextLine, caret: LayoutCaret) {
  const index = caret.position.elementIndex
  // Paragraph anchors/empty lines have no visible character before insertion.
  const anchor =
    index === line.source.start &&
    !line.clusters.some(
      c => c.logicalIndices.includes(index) && c.rect.width > 0
    ) &&
    !line.inlines.some(
      c => index >= c.source.start && index < c.source.end && c.rect.width > 0
    )
  return Math.max(
    0,
    anchor ? index : index - (caret.position.offset === 0 ? 1 : 0)
  )
}

export function pageRect(placed: PlacedTextLine, rect: LayoutRect): LayoutRect {
  return {
    x: placed.x + rect.x * placed.scale,
    y: placed.y + rect.y * placed.scale,
    width: rect.width * placed.scale,
    height: rect.height * placed.scale
  }
}

export function intersectRect(a: LayoutRect, b: LayoutRect): LayoutRect {
  const x = Math.max(a.x, b.x),
    y = Math.max(a.y, b.y)
  return {
    x,
    y,
    width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x),
    height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y)
  }
}

export function lineCarets(placed: PlacedTextLine): NativeCaret[] {
  const seen = new Set<string>()
  return placed.line.carets
    .map(caret => ({
      ...caret,
      position: { ...caret.position },
      index: hostCaretIndex(placed.line, caret),
      x: placed.x + caret.x * placed.scale,
      y: placed.y + caret.y * placed.scale,
      height: caret.height * placed.scale,
      pageNo: placed.pageNo,
      lineId: placed.line.id,
      scope: placed.line.source.scope
    }))
    .filter(caret => {
      if (placed.clip) {
        const clip = placed.clip
        const bottom = Math.min(caret.y + caret.height, clip.y + clip.height)
        caret.y = Math.max(caret.y, clip.y)
        caret.height = Math.max(0, bottom - caret.y)
        if (!caret.height || caret.x < clip.x || caret.x > clip.x + clip.width)
          return false
      }
      const key = `${caret.index}:${caret.x}:${caret.y}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.x - b.x)
}

export function hitTextLine(
  placed: PlacedTextLine,
  x: number
): NativeCaret | null {
  const carets = lineCarets(placed)
  if (!Number.isFinite(x)) return (x > 0 ? carets.at(-1) : carets[0]) || null
  return carets.reduce<NativeCaret | null>(
    (best, caret) =>
      !best || Math.abs(caret.x - x) < Math.abs(best.x - x) ? caret : best,
    null
  )
}

/** Selectable grapheme intervals. A ligature may have several legal stops. */
export function lineSegments(placed: PlacedTextLine) {
  const line = placed.line
  const segments: { start: number; end: number; rect: LayoutRect }[] = []
  const append = (
    carets: LayoutCaret[],
    fallback: LayoutRect,
    from: number,
    to: number
  ) => {
    const sorted = [...carets].sort(
      (a, b) =>
        a.position.elementIndex - b.position.elementIndex ||
        a.position.offset - b.position.offset
    )
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1],
        b = sorted[i]
      const start = a.position.elementIndex
      const end = b.position.elementIndex + (b.position.offset > 0 ? 1 : 0)
      if (end <= start) continue
      segments.push({
        start,
        end,
        rect: pageRect(placed, {
          x: Math.min(a.x, b.x),
          y: line.rect.y,
          width: Math.abs(b.x - a.x),
          height: line.contentHeight
        })
      })
    }
    if (sorted.length < 2 && to > from)
      segments.push({
        start: from,
        end: to,
        rect: pageRect(placed, {
          ...fallback,
          y: line.rect.y,
          height: line.contentHeight
        })
      })
  }
  for (const cluster of line.clusters)
    append(
      cluster.carets,
      cluster.rect,
      Math.min(...cluster.logicalIndices),
      Math.max(...cluster.logicalIndices) + 1
    )
  for (const inline of line.inlines) {
    if (inline.hidden) continue
    append(
      inline.kind === 'missingGlyph' ? inline.carets : [],
      inline.rect,
      inline.source.start,
      inline.source.end
    )
  }
  return segments
}

/** Half-open host source interval; paragraph spacing never enters these boxes. */
export function textRangeRects(
  placed: PlacedTextLine,
  start: number,
  end: number
): LayoutRect[] {
  if (placed.line.hidden || end <= start) return []
  const rects = lineSegments(placed)
    .filter(s => s.start < end && s.end > start)
    .map(s => {
      const rect = { ...s.rect }
      if (placed.clip) {
        const clip = placed.clip
        const right = Math.min(rect.x + rect.width, clip.x + clip.width)
        const bottom = Math.min(rect.y + rect.height, clip.y + clip.height)
        rect.x = Math.max(rect.x, clip.x)
        rect.y = Math.max(rect.y, clip.y)
        rect.width = Math.max(0, right - rect.x)
        rect.height = Math.max(0, bottom - rect.y)
      }
      return rect
    })
    .filter(r => r.width > 0 && r.height > 0)
    .sort((a, b) => a.x - b.x)
  const merged: LayoutRect[] = []
  for (const rect of rects) {
    const previous = merged.at(-1)
    if (previous && rect.x <= previous.x + previous.width + 0.01)
      previous.width =
        Math.max(previous.x + previous.width, rect.x + rect.width) - previous.x
    else merged.push({ ...rect })
  }
  return merged
}
