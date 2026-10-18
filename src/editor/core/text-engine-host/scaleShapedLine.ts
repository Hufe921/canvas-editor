import type { NativeParagraphLayout } from '../text-engine/layout/TextLayoutService'

export function scaleShapedLine(
  line: NativeParagraphLayout['shaped']['lines'][number],
  scale: number
) {
  return {
    ...line,
    width: line.width * scale,
    height: line.height * scale,
    ascent: line.ascent * scale,
    descent: line.descent * scale,
    shiftX: line.shiftX * scale,
    inset: (line.inset || 0) * scale,
    glyphs: line.glyphs.map(g => ({
      ...g,
      missing: g.missing
        ? {
            ...g.missing,
            metrics: {
              ...g.missing.metrics,
              advance: g.missing.metrics.advance * scale,
              ascent: g.missing.metrics.ascent * scale,
              descent: g.missing.metrics.descent * scale
            }
          }
        : undefined,
      ax: g.ax * scale,
      dx: g.dx * scale,
      dy: g.dy * scale,
      left: g.left * scale,
      right: g.right * scale,
      baselineShift: (g.baselineShift || 0) * scale,
      style: {
        ...g.style,
        fontSize: g.style.fontSize * scale,
        padding: g.style.padding?.map(v => v * scale),
        objectWidth:
          g.style.objectWidth == null ? undefined : g.style.objectWidth * scale,
        objectCaptionHeight: (g.style.objectCaptionHeight || 0) * scale,
        objectHeight:
          g.style.objectHeight == null
            ? undefined
            : g.style.objectHeight * scale
      }
    }))
  }
}
