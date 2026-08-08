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
 * Returns null so callers can fall back to measureText / fillText.
 */
export function measurePlainText(
  adapter: LayoutHostAdapter,
  style: IPlainTextStyle
): IPlainTextMetrics | null {
  if (!adapter.isReady()) return null
  const layout = adapter.layoutPlainText(style)
  const line = layout?.lines[0]
  if (!line?.glyphs.length) return null
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
  const full = measurePlainText(adapter, style)
  if (full) {
    if (full.width <= maxWidth) return style.text
    let left = 0
    let right = style.text.length
    while (left < right) {
      const mid = Math.ceil((left + right) / 2)
      const truncated = style.text.substring(0, mid) + '...'
      const m = measurePlainText(adapter, { ...style, text: truncated })
      if (m && m.width <= maxWidth) {
        left = mid
      } else {
        right = mid - 1
      }
    }
    return style.text.substring(0, left) + '...'
  }
  // Legacy measureText path
  ctx.font = `${style.fontSize}px ${style.fontFamily}`
  if (ctx.measureText(style.text).width <= maxWidth) return style.text
  let left = 0
  let right = style.text.length
  while (left < right) {
    const mid = Math.ceil((left + right) / 2)
    const truncated = style.text.substring(0, mid)
    if (ctx.measureText(truncated + '...').width <= maxWidth) {
      left = mid
    } else {
      right = mid - 1
    }
  }
  return style.text.substring(0, left) + '...'
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
  if (!line?.glyphs.length) return null
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
