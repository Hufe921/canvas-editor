import { describe, expect, it } from 'vitest'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { BrowserTextShaper } from '../../../src/editor/core/text-engine/shape/BrowserTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'

describe('rtl cjk overlap', () => {
  it('rtl paragraph of cjk/latin should not overlap or pull trailing punct to line start', () => {
    const text =
      '编辑删除 options.textEngine = harfbuzz。正文为纯文本段落，可测方向、混排、光标与逻辑删除。'
    const bidi = new BidiResolver()
    const fixedShaper = {
      shape(run: {
        text: string
        textStart: number
        style: { fontSize: number }
        logicalIndexAt: (o: number) => number
        direction: 'ltr' | 'rtl'
      }) {
        return [...run.text].map((ch, i) => {
          const charStart = run.textStart + i
          const ax = /[\u4e00-\u9fff]/.test(ch) ? 14 : 8
          return {
            glyphId: 0,
            cluster: i,
            ax,
            dx: 0,
            dy: 0,
            charStart,
            charEnd: charStart + 1,
            logicalIndexStart: run.logicalIndexAt(charStart),
            logicalIndexEnd: run.logicalIndexAt(charStart),
            left: 0,
            right: 0,
            style: run.style,
            bidiLevel: run.direction === 'rtl' ? 1 : 0
          }
        })
      }
    }
    const engine = new TextLayoutEngine(
      bidi,
      fixedShaper as unknown as BrowserTextShaper
    )
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i + 1,
      text: ch,
      style: { fontFamily: 'sans-serif', fontSize: 14, color: '#666' }
    }))
    const layout = engine.layoutParagraph({
      spans,
      availableWidth: 400,
      direction: 'rtl',
      align: 'right',
      lineHeight: 21
    })
    expect(layout.lines.length).toBeGreaterThan(1)
    for (const line of layout.lines) {
      const gs = line.glyphs
      const chars = gs.map(g => text.slice(g.charStart, g.charEnd)).join('')
      // Logical-contiguous: first glyph charStart <= last
      const starts = gs.map(g => g.charStart)
      expect(Math.max(...starts) - Math.min(...starts) + 1).toBeGreaterThanOrEqual(
        gs.length
      )
      // Must not start with the paragraph-final '。' pulled from the end
      if (line === layout.lines[0]) {
        expect(chars.startsWith('。')).toBe(false)
        expect(chars.startsWith('编')).toBe(true)
      }
      let bad = 0
      for (let i = 1; i < gs.length; i++) {
        if (gs[i].left < gs[i - 1].left - 0.01) bad++
        if (gs[i].left < gs[i - 1].right - 1) bad++
      }
      expect(bad).toBe(0)
    }
  })
})
