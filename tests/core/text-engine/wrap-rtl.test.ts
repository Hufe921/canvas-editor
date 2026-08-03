import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { FontManager } from '../../../src/editor/core/text-engine/font/FontManager'
import { HarfBuzzTextShaper } from '../../../src/editor/core/text-engine/shape/HarfBuzzTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'

describe('rtl wrap', () => {
  it('break-word keeps latin words intact', () => {
    const fixedShaper = {
      shape(run: {
        text: string
        textStart: number
        style: { fontSize: number }
        logicalIndexAt: (o: number) => number
        direction: 'ltr' | 'rtl'
      }) {
        return [...run.text].map((_, i) => {
          const charStart = run.textStart + i
          return {
            glyphId: 0,
            cluster: i,
            ax: 10,
            dx: 0,
            dy: 0,
            charStart,
            charEnd: charStart + 1,
            logicalIndexStart: run.logicalIndexAt(charStart),
            logicalIndexEnd: run.logicalIndexAt(charStart),
            left: 0,
            right: 0,
            style: run.style,
            bidiLevel: 0
          }
        })
      }
    }
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      fixedShaper as never
    )
    const text = 'Hello Canvas Editor'
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i,
      text: ch,
      style: { fontFamily: 'sans-serif', fontSize: 16 }
    }))
    // Hello=50, space, Canvas=60 — width 55 should break after Hello, not inside Canvas
    const layout = engine.layoutParagraph({
      spans,
      availableWidth: 55,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24,
      wordBreak: 'break-word'
    })
    expect(layout.lines.length).toBeGreaterThan(1)
    const line0 = layout.lines[0].glyphs
      .map(g => text.slice(g.charStart, g.charEnd))
      .join('')
    expect(line0.includes('Can')).toBe(false)
    expect(line0.trimEnd()).toBe('Hello')
  })

  it('arabic rtl wraps when narrow and pen boxes stay monotonic', async () => {
    const fontPath = resolve('public/fonts/NotoNaskhArabic-Regular.ttf')
    const data = readFileSync(fontPath).buffer
    const fm = new FontManager()
    await fm.init([{ family: 'Noto Naskh Arabic', data }])
    const shaper = new HarfBuzzTextShaper(fm)
    const text = '2. RTL：مرحبا بالعالم — النص من اليمين إلى اليسار.'
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i + 1,
      text: ch,
      style: {
        fontFamily: /[\u0600-\u06FF]/.test(ch)
          ? 'Noto Naskh Arabic'
          : 'sans-serif',
        fontSize: 18
      }
    }))

    const engine = new TextLayoutEngine(new BidiResolver(), shaper)
    const layout = engine.layoutParagraph({
      spans,
      availableWidth: 120,
      direction: 'rtl',
      align: 'right',
      lineHeight: 27,
      wordBreak: 'break-word'
    })
    expect(layout.lines.length).toBeGreaterThan(1)
    // مرحبا / بالعالم should not be split across lines when space allows word wrap
    const joined = layout.lines.map(l =>
      l.glyphs.map(g => text.slice(g.charStart, g.charEnd)).join('')
    )
    for (const line of joined) {
      expect(line.includes('مرح') && !line.includes('مرحبا')).toBe(false)
    }
    for (const line of layout.lines) {
      if (line.glyphs.length < 2) continue
      const span =
        Math.max(...line.glyphs.map(g => g.right)) -
        Math.min(...line.glyphs.map(g => g.left))
      expect(span).toBeGreaterThan(8)
      for (let i = 1; i < line.glyphs.length; i++) {
        expect(line.glyphs[i].left + 0.01).toBeGreaterThanOrEqual(
          line.glyphs[i - 1].left
        )
      }
      expect(line.width).toBeLessThanOrEqual(120 + 0.5)
    }
  })
})
