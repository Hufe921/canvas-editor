import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { FontManager } from '../../../src/editor/core/text-engine/font/FontManager'
import { HarfBuzzTextShaper } from '../../../src/editor/core/text-engine/shape/HarfBuzzTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'
import { containsShapingScript } from '../../../src/editor/core/text-engine/utils/scriptFont'

describe('DEFER-011 Arabic kashida for justify', () => {
  function createEngine() {
    const fontPath = resolve('public/fonts/NotoNaskhArabic-Regular.ttf')
    const data = readFileSync(fontPath).buffer
    const fm = new FontManager()
    return fm.init([{ family: 'Noto Naskh Arabic', data }]).then(() => {
      const shaper = new HarfBuzzTextShaper(fm)
      return new TextLayoutEngine(new BidiResolver(), shaper)
    })
  }

  function spansOf(text: string, start = 1) {
    return [...text].map((ch, i) => ({
      logicalIndex: start + i,
      text: ch,
      style: {
        fontFamily: containsShapingScript(ch)
          ? 'Noto Naskh Arabic'
          : 'sans-serif',
        fontSize: 18
      }
    }))
  }

  it('justified Arabic line fills the width and inserts kashida strokes', async () => {
    const engine = await createEngine()
    const text = 'النص العربي الطويل من أجل اختبار التبرير والتوسعة'
    // narrow enough to wrap; intermediate lines get kashida
    const layout = engine.layoutParagraph({
      spans: spansOf(text),
      availableWidth: 240,
      direction: 'rtl',
      align: 'justify',
      lineHeight: 27,
      wordBreak: 'break-word'
    })
    expect(layout.lines.length).toBeGreaterThan(1)
    // kashida strokes (TATWEEL) are part of the shaped text
    const hasTatweel = layout.paragraphText.includes('\u0640')
    expect(hasTatweel).toBe(true)
    // every non-last line is justified to the available width
    for (const line of layout.lines.slice(0, -1)) {
      expect(line.width).toBeGreaterThanOrEqual(239)
    }
  })

  it('does not insert kashida when the line already fits', async () => {
    const engine = await createEngine()
    const text = 'النص'
    const layout = engine.layoutParagraph({
      spans: spansOf(text),
      availableWidth: 330,
      direction: 'rtl',
      align: 'justify',
      lineHeight: 27,
      wordBreak: 'break-word'
    })
    expect(layout.paragraphText.includes('\u0640')).toBe(false)
  })

  it('space-stretch justifies Latin text without kashida', async () => {
    const engine = await createEngine()
    const text = 'The quick brown fox jumps over'
    const layout = engine.layoutParagraph({
      spans: spansOf(text),
      availableWidth: 300,
      direction: 'ltr',
      align: 'justify',
      lineHeight: 24,
      wordBreak: 'break-word'
    })
    expect(layout.lines[0].width).toBeGreaterThanOrEqual(299)
    expect(layout.paragraphText.includes('\u0640')).toBe(false)
  })
})
