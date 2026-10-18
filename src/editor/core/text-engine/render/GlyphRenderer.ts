import type { FontManager } from '../font/FontManager'
import type { LayoutLine, ShapedGlyph } from '../types'

/** Paint the shaped face/glyph outline at its HB pen position, without reshaping. */
export class GlyphRenderer {
  constructor(private fontManager?: FontManager) {}

  drawNativeLine(
    ctx: CanvasRenderingContext2D,
    line: import('../../../interface/Layout').TextLine,
    x: number,
    y: number,
    scale = 1,
    style?: (indices: number[]) => { hidden?: boolean; color?: string }
  ) {
    if (line.hidden) return
    ctx.save()
    try {
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      for (const glyph of line.glyphs) {
        const cluster = line.clusters[glyph.clusterIndex]
        const live = style?.(cluster.logicalIndices)
        if (live?.hidden) continue
        const outline = this.fontManager?.getGlyphOutlineByRef(
          glyph.font,
          glyph.glyphId,
          glyph.fontSize
        )
        if (outline?.status === 'empty') continue
        if (outline?.status !== 'ready')
          throw new Error(`No supported outline for glyph ${glyph.glyphId}`)
        ctx.save()
        ctx.translate(
          line.rect.x + glyph.x + glyph.offsetX,
          line.rect.y + line.baseline + glyph.y + glyph.offsetY
        )
        ctx.fillStyle = live?.color || glyph.color
        this.paintOutline(ctx, outline.commands)
        ctx.restore()
      }
      for (const inline of line.inlines) {
        if (inline.kind !== 'missingGlyph' || inline.hidden) continue
        const indices = Array.from(
          { length: inline.source.end - inline.source.start },
          (_, index) => inline.source.start + index
        )
        const live = style?.(indices)
        if (live?.hidden) continue
        ctx.strokeStyle = live?.color || '#000'
        ctx.lineWidth = 1 / scale
        ctx.strokeRect(
          inline.rect.x + 1 / scale,
          inline.rect.y + 1 / scale,
          Math.max(1 / scale, inline.rect.width - 2 / scale),
          Math.max(1 / scale, inline.rect.height - 2 / scale)
        )
      }
    } finally {
      ctx.restore()
    }
  }

  private paintOutline(
    ctx: CanvasRenderingContext2D,
    commands: import('../font/GlyphOutline').GlyphOutline['commands']
  ) {
    ctx.beginPath()
    for (const command of commands) {
      switch (command.type) {
        case 'M':
          ctx.moveTo(command.x, command.y)
          break
        case 'L':
          ctx.lineTo(command.x, command.y)
          break
        case 'Q':
          ctx.quadraticCurveTo(command.x1, command.y1, command.x, command.y)
          break
        case 'C':
          ctx.bezierCurveTo(
            command.x1,
            command.y1,
            command.x2,
            command.y2,
            command.x,
            command.y
          )
          break
        case 'Z':
          ctx.closePath()
          break
      }
    }
    ctx.fill()
  }

  drawLine(
    ctx: CanvasRenderingContext2D,
    line: LayoutLine,
    originX: number,
    baselineY: number,
    _paragraphText?: string
  ) {
    // Kept only for old callers; source text never participates in painting.
    void _paragraphText
    for (const glyph of line.glyphs) {
      this.drawGlyph(ctx, glyph, originX, baselineY)
    }
  }

  drawGlyph(
    ctx: CanvasRenderingContext2D,
    glyph: ShapedGlyph,
    originX: number,
    baselineY: number,
    _paragraphText?: string
  ) {
    void _paragraphText
    // The object particle owns its ink; whitespace has metrics but no outline.
    if (glyph.inkless || glyph.style.objectWidth != null) return
    const outline =
      glyph.font &&
      this.fontManager?.getGlyphOutlineByRef(
        glyph.font,
        glyph.glyphId,
        glyph.style.fontSize
      )
    if (!glyph.missing && outline?.status === 'empty') return
    if (!glyph.missing && outline?.status !== 'ready') {
      throw new Error(
        `No supported outline for glyph ${glyph.glyphId} in ${glyph.font?.family || 'unknown face'}`
      )
    }
    const x = originX + glyph.left + glyph.dx
    const y = baselineY + (glyph.baselineShift || 0) - glyph.dy
    ctx.save()
    try {
      ctx.translate(x, y)
      ctx.fillStyle = glyph.style.color || '#000'
      if (glyph.missing && outline?.status !== 'ready') {
        this.drawMissingBox(ctx, glyph)
        return
      }
      ctx.beginPath()
      for (const command of outline!.commands) {
        switch (command.type) {
          case 'M':
            ctx.moveTo(command.x, command.y)
            break
          case 'L':
            ctx.lineTo(command.x, command.y)
            break
          case 'Q':
            ctx.quadraticCurveTo(command.x1, command.y1, command.x, command.y)
            break
          case 'C':
            ctx.bezierCurveTo(
              command.x1,
              command.y1,
              command.x2,
              command.y2,
              command.x,
              command.y
            )
            break
          case 'Z':
            ctx.closePath()
            break
        }
      }
      ctx.fill()
    } finally {
      ctx.restore()
    }
  }

  private drawMissingBox(ctx: CanvasRenderingContext2D, glyph: ShapedGlyph) {
    const metrics = glyph.missing!.metrics
    ctx.strokeStyle = glyph.style.color || '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(
      1,
      -metrics.ascent + 1,
      Math.max(1, metrics.advance - 2),
      Math.max(1, metrics.ascent + metrics.descent - 2)
    )
  }
}
