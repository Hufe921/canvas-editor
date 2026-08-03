import { containsShapingScript } from '../utils/scriptFont'
import { ShapedGlyph, StyleRun } from '../types'
import { ITextShaper } from './ITextShaper'

/**
 * Canvas measureText shaper.
 * Complex scripts use prefix widths on the full string so advances match joined fillText.
 */
export class BrowserTextShaper implements ITextShaper {
  private ctx: CanvasRenderingContext2D | null = null

  private getCtx(): CanvasRenderingContext2D | null {
    if (this.ctx) return this.ctx
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    this.ctx = canvas.getContext('2d')
    return this.ctx
  }

  shape(run: StyleRun): ShapedGlyph[] {
    const ctx = this.getCtx()
    const font = `${run.style.italic ? 'italic ' : ''}${
      run.style.bold ? 'bold ' : ''
    }${run.style.fontSize}px ${run.style.fontFamily}`
    if (ctx) ctx.font = font
    const letterSpacing = run.style.letterSpacing || 0
    // 与阿语相同：复杂文种用整串前缀宽，保证与整段 fillText 连写一致
    const joinWidths = containsShapingScript(run.text)
    const glyphs: ShapedGlyph[] = []
    let prevWidth = 0
    for (let i = 0; i < run.text.length; ) {
      const cp = run.text.codePointAt(i)!
      const len = cp > 0xffff ? 2 : 1
      const ch = run.text.slice(i, i + len)
      const charStart = run.textStart + i
      const charEnd = charStart + len
      let ax: number
      if (ctx && joinWidths) {
        const prefixWidth = ctx.measureText(run.text.slice(0, i + len)).width
        ax = Math.max(0, prefixWidth - prevWidth) + letterSpacing
        prevWidth = prefixWidth
      } else {
        ax =
          (ctx ? ctx.measureText(ch).width : run.style.fontSize * 0.5) +
          letterSpacing
      }
      glyphs.push({
        glyphId: 0,
        cluster: i,
        ax,
        dx: 0,
        dy: 0,
        charStart,
        charEnd,
        logicalIndexStart: run.logicalIndexAt(charStart),
        logicalIndexEnd: run.logicalIndexAt(charEnd - 1),
        left: 0,
        right: 0,
        style: run.style,
        bidiLevel: run.direction === 'rtl' ? 1 : 0
      })
      i += len
    }
    return glyphs
  }
}
