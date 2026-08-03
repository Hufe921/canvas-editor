import { Buffer as HbBuffer, Direction, shape } from 'harfbuzzjs'
import { FontManager } from '../font/FontManager'
import { containsShapingScript } from '../utils/scriptFont'
import { ShapedGlyph, StyleRun } from '../types'
import { BrowserTextShaper } from './BrowserTextShaper'
import { ITextShaper } from './ITextShaper'

/**
 * HarfBuzz shaping for complex scripts (Arabic / Indic / SEA …).
 * Outlines from opentype.js (canvas Y-down). Falls back to BrowserTextShaper.
 */
export class HarfBuzzTextShaper implements ITextShaper {
  private browser = new BrowserTextShaper()

  constructor(private fontManager: FontManager) {}

  shape(run: StyleRun): ShapedGlyph[] {
    const fontInst = this.fontManager.getFont(run.style)
    if (!fontInst || !run.text.length) {
      return this.browser.shape(run)
    }
    // Never HB-shape simple scripts (CJK/Latin) — wrong face → .notdef ax≈0 重叠
    if (!containsShapingScript(run.text)) {
      return this.browser.shape(run)
    }

    const buffer = new HbBuffer()
    buffer.addText(run.text)
    buffer.setDirection(
      run.direction === 'rtl' ? Direction.RTL : Direction.LTR
    )
    buffer.guessSegmentProperties()
    shape(fontInst.hbFont, buffer)
    const paired = buffer.getGlyphInfosAndPositions() as Array<{
      codepoint: number
      cluster: number
      xAdvance: number
      xOffset: number
      yOffset: number
    }>
    buffer.clearContents()
    if (!paired?.length) return this.browser.shape(run)

    const scale = fontInst.pxPerUnit
    const textLen = run.text.length
    const glyphs = paired.map((g, i) => {
      const clusterEnd = this.clusterEnd(paired, i, textLen)
      const charStart = run.textStart + g.cluster
      const charEnd = run.textStart + Math.max(clusterEnd, g.cluster + 1)
      const shaped: ShapedGlyph = {
        glyphId: g.codepoint,
        cluster: g.cluster,
        ax: g.xAdvance * scale,
        dx: g.xOffset * scale,
        dy: g.yOffset * scale,
        charStart,
        charEnd,
        logicalIndexStart: run.logicalIndexAt(charStart),
        logicalIndexEnd: run.logicalIndexAt(
          Math.max(charStart, charEnd - 1)
        ),
        left: 0,
        right: 0,
        style: run.style,
        bidiLevel: run.direction === 'rtl' ? 1 : 0
      }
      try {
        const otGlyph = fontInst.otFont?.glyphs.get(g.codepoint)
        if (otGlyph) {
          shaped.pathData = otGlyph
            .getPath(0, 0, fontInst.size)
            .toPathData(1)
        }
      } catch {
        /* optional */
      }
      return shaped
    })

    // 与阿语相同：复杂文种无可用轮廓时回退浏览器前缀宽整形
    if (
      containsShapingScript(run.text) &&
      !glyphs.some(g => !!g.pathData && g.ax > 0.01)
    ) {
      return this.browser.shape(run)
    }
    // 绘制走整段 fillText，布局宽须与 measureText 一致，否则墨迹溢出叠到邻段
    return this.alignAdvancesToBrowser(glyphs, run)
  }

  /**
   * Scale HB advances so sum(ax) matches BrowserTextShaper (fillText) width.
   * Skip when browser metrics look unreliable (missing face in Node / vitest).
   */
  private alignAdvancesToBrowser(
    glyphs: ShapedGlyph[],
    run: StyleRun
  ): ShapedGlyph[] {
    if (!glyphs.length) return glyphs
    const browserGlyphs = this.browser.shape(run)
    const target = browserGlyphs.reduce((s, g) => s + Math.max(g.ax, 0), 0)
    const sum = glyphs.reduce((s, g) => s + Math.max(g.ax, 0), 0)
    if (target <= 0.01 || sum <= 0.01) return glyphs
    // 浏览器测宽远小于 HB：多半未加载对应字体，保持 HB 避免行宽被压扁叠字
    if (target < sum * 0.5 || target > sum * 2) return glyphs
    const k = target / sum
    if (Math.abs(k - 1) < 0.001) return glyphs
    for (const g of glyphs) {
      g.ax *= k
      g.dx *= k
    }
    return glyphs
  }

  /** Next greater cluster in input order (RTL-safe). */
  private clusterEnd(
    paired: Array<{ cluster: number }>,
    index: number,
    textLen: number
  ): number {
    const cluster = paired[index].cluster
    let end = textLen
    for (let j = 0; j < paired.length; j++) {
      const c = paired[j].cluster
      if (c > cluster && c < end) end = c
    }
    return end
  }
}
