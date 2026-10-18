import { LayoutHostAdapter } from './LayoutHostAdapter'

export interface IPlainTextStyle {
  text: string
  fontFamily: string
  fontSize: number
  color: string
}

export interface IPlainTextMetrics {
  width: number
  ascent: number
  descent: number
  height: number
}

/**
 * Layout plain chrome text when HarfBuzz path is ready.
 * Before ready, chrome is deferred. Missing glyphs retain native boxes.
 */
export function measurePlainText(
  adapter: LayoutHostAdapter,
  style: IPlainTextStyle
): IPlainTextMetrics | null {
  if (!adapter.isReady()) return null
  const layout = adapter.layoutPlainText(style)
  const line = layout?.lines[0]
  if (!line) return null
  return {
    width: line.width,
    ascent: line.ascent,
    descent: line.descent,
    height: line.ascent + line.descent
  }
}

/**
 * Truncate plain text to maxWidth (logical ellipsis suffix), matching legacy caption.
 */
export function truncatePlainText(
  adapter: LayoutHostAdapter,
  ctx: CanvasRenderingContext2D,
  style: IPlainTextStyle,
  maxWidth: number
): string {
  // Keep the context parameter for callers; native measurement never uses it.
  void ctx
  const layout = adapter.layoutPlainText(style)
  if (!layout) return ''
  if ((layout.lines[0]?.width || 0) <= maxWidth) return style.text
  if (maxWidth <= 0) return ''
  const suffix = '...'
  if (
    (measurePlainText(adapter, { ...style, text: suffix })?.width || 0) >
    maxWidth
  )
    return ''
  const glyphs = layout.lines.flatMap(line => line.glyphs)
  const boundaries = [
    0,
    ...[
      ...new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(
        style.text
      )
    ]
      .map(item => item.index + item.segment.length)
      .filter(end => !glyphs.some(g => g.charStart < end && end < g.charEnd))
  ]
  // Contextual shaping can change advances non-monotonically. Verify each
  // candidate from the longest complete grapheme/cluster to the shortest.
  for (let index = boundaries.length - 1; index >= 0; index--) {
    const candidate = style.text.slice(0, boundaries[index]) + suffix
    const metrics = measurePlainText(adapter, { ...style, text: candidate })
    if (metrics && metrics.width <= maxWidth) return candidate
  }
  return ''
}

/**
 * Draw plain text via GlyphRenderer when ready.
 * originX is the visual left of the line; baselineY is alphabetic baseline.
 */
export function drawPlainText(
  adapter: LayoutHostAdapter,
  ctx: CanvasRenderingContext2D,
  style: IPlainTextStyle,
  originX: number,
  baselineY: number
): IPlainTextMetrics | null {
  if (!adapter.isReady()) return null
  const layout = adapter.layoutPlainText(style)
  const line = layout?.lines[0]
  if (!line) return null
  adapter
    .getGlyphRenderer()
    .drawLine(ctx, line, originX, baselineY, layout!.paragraphText)
  return {
    width: line.width,
    ascent: line.ascent,
    descent: line.descent,
    height: line.ascent + line.descent
  }
}
