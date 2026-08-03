import { containsShapingScript } from '../utils/scriptFont'
import { LayoutLine, ShapedGlyph } from '../types'

/**
 * Draw shaped glyphs.
 * Prefer visual-segment fillText (stable joining / no path pile-up).
 * pathData is optional fallback when paragraph text is unavailable.
 */
export class GlyphRenderer {
  drawLine(
    ctx: CanvasRenderingContext2D,
    line: LayoutLine,
    originX: number,
    baselineY: number,
    paragraphText?: string
  ) {
    if (!line.glyphs.length) return
    // Segment fillText first：HB pathData 在窄行/混排时易叠成「折叠」
    if (paragraphText) {
      this.drawByVisualSegments(ctx, line, originX, baselineY, paragraphText)
      return
    }
    const hasPaths = line.glyphs.some(g => !!g.pathData)
    if (hasPaths) {
      for (const g of line.glyphs) {
        this.drawGlyph(ctx, g, originX, baselineY, paragraphText)
      }
      return
    }
    for (const g of line.glyphs) {
      this.drawGlyph(ctx, g, originX, baselineY, paragraphText)
    }
  }

  drawGlyph(
    ctx: CanvasRenderingContext2D,
    glyph: ShapedGlyph,
    originX: number,
    baselineY: number,
    paragraphText?: string
  ) {
    const x = originX + glyph.left + glyph.dx
    const y = baselineY - glyph.dy
    ctx.save()
    ctx.fillStyle = glyph.style.color || '#000'
    if (glyph.pathData) {
      ctx.translate(x, y)
      try {
        ctx.fill(new Path2D(glyph.pathData))
      } catch {
        this.fillCluster(ctx, glyph, 0, 0, paragraphText)
      }
    } else {
      this.fillCluster(ctx, glyph, x, y, paragraphText)
    }
    ctx.restore()
  }

  private drawByVisualSegments(
    ctx: CanvasRenderingContext2D,
    line: LayoutLine,
    originX: number,
    baselineY: number,
    paragraphText: string
  ) {
    type Seg = { glyphs: ShapedGlyph[]; complex: boolean }
    const segs: Seg[] = []
    for (const g of line.glyphs) {
      const slice = paragraphText.slice(g.charStart, g.charEnd)
      const complex = containsShapingScript(slice)
      const last = segs[segs.length - 1]
      // 与阿语相同：复杂文种分组忽略颜色，避免拆段后 fillText 子串破坏连写
      const same =
        last &&
        last.complex === complex &&
        this.sameShapeStyle(last.glyphs[0], g) &&
        (complex || last.glyphs[0].style.color === g.style.color)
      if (same) {
        last.glyphs.push(g)
      } else {
        segs.push({ glyphs: [g], complex })
      }
    }
    for (const seg of segs) {
      if (seg.complex && seg.glyphs.length) {
        // 阿语逻辑：整段 fillText；多色则整段绘制 + clip，绝不逐字拆绘
        const logical = [...seg.glyphs].sort(
          (a, b) => a.charStart - b.charStart
        )
        const text = paragraphText.slice(
          logical[0].charStart,
          logical[logical.length - 1].charEnd
        )
        // 用笔位 left（不含 dx）：dx 是字形内偏移，计入 paintLeft 会把整段拽偏叠字
        const paintLeft = Math.min(...seg.glyphs.map(g => g.left))
        const mixedColor = seg.glyphs.some(
          g =>
            (g.style.color || '#000') !== (seg.glyphs[0].style.color || '#000')
        )
        const paintStyle = logical[0].style
        if (mixedColor) {
          this.fillJoinedMulticolor(
            ctx,
            text,
            seg.glyphs,
            originX,
            baselineY,
            paintLeft,
            paintStyle
          )
        } else {
          this.fillRaw(ctx, text, paintStyle, originX + paintLeft, baselineY)
        }
      } else {
        for (const g of seg.glyphs) {
          this.drawGlyph(ctx, g, originX, baselineY, paragraphText)
        }
      }
    }
  }

  /**
   * 多色连写：每次仍对完整子串 fillText（浏览器/系统连写），
   * 用各色字素的水平笔盒做 clip，只露出对应颜色。
   */
  private fillJoinedMulticolor(
    ctx: CanvasRenderingContext2D,
    text: string,
    glyphs: ShapedGlyph[],
    originX: number,
    baselineY: number,
    paintLeft: number,
    paintStyle: ShapedGlyph['style']
  ) {
    const fontSize = paintStyle.fontSize || 16
    const clipTop = baselineY - fontSize * 1.2
    const clipHeight = fontSize * 1.8
    const byColor = new Map<string, ShapedGlyph[]>()
    for (const g of glyphs) {
      const c = g.style.color || '#000'
      const list = byColor.get(c)
      if (list) list.push(g)
      else byColor.set(c, [g])
    }
    for (const [color, gs] of byColor) {
      ctx.save()
      ctx.beginPath()
      for (const range of this.mergeGlyphClipRanges(gs)) {
        ctx.rect(originX + range.left, clipTop, range.width, clipHeight)
      }
      ctx.clip()
      this.fillRaw(
        ctx,
        text,
        { ...paintStyle, color },
        originX + paintLeft,
        baselineY
      )
      ctx.restore()
    }
  }

  private mergeGlyphClipRanges(
    glyphs: ShapedGlyph[]
  ): Array<{ left: number; width: number }> {
    // 组合符号 advance 可能为 0：给最小裁切宽，避免印地/泰文加点色后 clip 为空
    const minW = Math.max(0.5, (glyphs[0]?.style.fontSize || 16) * 0.05)
    const boxes = glyphs
      .map(g => ({
        left: g.left,
        right: Math.max(g.right, g.left + minW)
      }))
      .sort((a, b) => a.left - b.left)
    const ranges: Array<{ left: number; width: number }> = []
    for (const box of boxes) {
      const last = ranges[ranges.length - 1]
      if (last && box.left <= last.left + last.width + 0.5) {
        const right = Math.max(last.left + last.width, box.right)
        last.width = right - last.left
      } else {
        ranges.push({ left: box.left, width: box.right - box.left })
      }
    }
    return ranges
  }

  /** 影响连写/度量的样式（不含 color） */
  private sameShapeStyle(a: ShapedGlyph, b: ShapedGlyph): boolean {
    return (
      a.style.fontFamily === b.style.fontFamily &&
      a.style.fontSize === b.style.fontSize &&
      !!a.style.bold === !!b.style.bold &&
      !!a.style.italic === !!b.style.italic
    )
  }

  private fillCluster(
    ctx: CanvasRenderingContext2D,
    glyph: ShapedGlyph,
    x: number,
    y: number,
    paragraphText?: string
  ) {
    if (glyph.ax <= 0.01 && !glyph.pathData) return
    const text =
      paragraphText && glyph.charEnd > glyph.charStart
        ? paragraphText.slice(glyph.charStart, glyph.charEnd)
        : ''
    if (!text) return
    this.fillRaw(ctx, text, glyph.style, x, y)
  }

  private fillRaw(
    ctx: CanvasRenderingContext2D,
    text: string,
    style: ShapedGlyph['style'],
    x: number,
    y: number
  ) {
    ctx.save()
    ctx.font = `${style.italic ? 'italic ' : ''}${
      style.bold ? 'bold ' : ''
    }${style.fontSize}px ${style.fontFamily}`
    ctx.fillStyle = style.color || '#000'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(text, x, y)
    ctx.restore()
  }
}
