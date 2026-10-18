import type { ShapedGlyph, StyleRun } from '../types'

/** Geometry supplied by the host; no font lookup, shaping or browser metrics. */
export function shapeInlineObject(run: StyleRun): ShapedGlyph[] {
  if (!run.text.length || run.style.objectWidth == null) return []
  const charStart = run.textStart
  const charEnd = run.textEnd
  return [
    {
      glyphId: 0,
      cluster: 0,
      ax: Math.max(0, run.style.objectWidth),
      dx: 0,
      dy: 0,
      charStart,
      charEnd,
      logicalIndexStart: run.logicalIndexAt(charStart),
      logicalIndexEnd: run.logicalIndexAt(Math.max(charStart, charEnd - 1)),
      logicalIndices: [run.logicalIndexAt(charStart)],
      left: 0,
      right: 0,
      style: run.style,
      bidiLevel: run.direction === 'rtl' ? 1 : 0
    }
  ]
}
