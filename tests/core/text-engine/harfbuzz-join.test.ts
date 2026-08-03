import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { FontManager } from '../../../src/editor/core/text-engine/font/FontManager'
import { HarfBuzzTextShaper } from '../../../src/editor/core/text-engine/shape/HarfBuzzTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'

describe('HarfBuzz Arabic joining', () => {
  it('shapes مرحبا with positive advances and connected glyph ids', async () => {
    const fontPath = resolve(
      __dirname,
      '../../../public/fonts/NotoNaskhArabic-Regular.ttf'
    )
    const data = readFileSync(fontPath).buffer
    const fm = new FontManager()
    await fm.init([{ family: 'Noto Naskh Arabic', data }])
    expect(fm.isReady()).toBe(true)

    const shaper = new HarfBuzzTextShaper(fm)
    const glyphs = shaper.shape({
      text: 'مرحبا',
      direction: 'rtl',
      style: {
        fontFamily: 'Noto Naskh Arabic',
        fontSize: 18,
        color: '#000'
      },
      textStart: 0,
      textEnd: 5,
      logicalIndexAt: o => o + 1
    })
    expect(glyphs.length).toBeGreaterThan(0)
    const width = glyphs.reduce((s, g) => s + g.ax, 0)
    expect(width).toBeGreaterThan(20)
    // At least one outline for joined drawing
    expect(glyphs.some(g => !!g.pathData)).toBe(true)
    // Cluster ends must be >= starts (RTL-safe)
    for (const g of glyphs) {
      expect(g.charEnd).toBeGreaterThan(g.charStart)
    }
  })

  it('keeps Arabic joining when only color changes mid-word', async () => {
    const fontPath = resolve(
      __dirname,
      '../../../public/fonts/NotoNaskhArabic-Regular.ttf'
    )
    const data = readFileSync(fontPath).buffer
    const fm = new FontManager()
    await fm.init([{ family: 'Noto Naskh Arabic', data }])
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new HarfBuzzTextShaper(fm)
    )
    const text = 'مرحبا'
    // Same size/font; mid letters different colors (as ElementBridge would emit)
    const colors = ['#000', '#000', '#f00', '#800080', '#f00']
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i + 1,
      text: ch,
      style: {
        fontFamily: 'Noto Naskh Arabic',
        fontSize: 18,
        color: colors[i]
      }
    }))
    const mono = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          text,
          style: {
            fontFamily: 'Noto Naskh Arabic',
            fontSize: 18,
            color: '#000'
          }
        }
      ],
      availableWidth: 500,
      direction: 'rtl',
      align: 'right',
      lineHeight: 27
    })
    const multi = engine.layoutParagraph({
      spans,
      availableWidth: 500,
      direction: 'rtl',
      align: 'right',
      lineHeight: 27
    })
    const monoW = mono.lines[0].width
    const multiW = multi.lines[0].width
    // Joined width should match mono-color shaping (not isolated pile)
    expect(Math.abs(multiW - monoW)).toBeLessThan(1)
    const colorsOnGlyphs = new Set(
      multi.lines[0].glyphs.map(g => g.style.color)
    )
    expect(colorsOnGlyphs.has('#f00')).toBe(true)
    expect(colorsOnGlyphs.has('#800080')).toBe(true)
  })

  it('layouts mixed Hello+Arabic without zero-width pile', async () => {
    const fontPath = resolve(
      __dirname,
      '../../../public/fonts/NotoNaskhArabic-Regular.ttf'
    )
    const data = readFileSync(fontPath).buffer
    const fm = new FontManager()
    await fm.init([{ family: 'Noto Naskh Arabic', data }])
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new HarfBuzzTextShaper(fm)
    )
    const text = 'Hello مرحبا'
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i + 1,
      text: ch,
      style: {
        fontFamily: 'Noto Naskh Arabic',
        fontSize: 16,
        color: '#000'
      }
    }))
    // Merge like ElementBridge
    const merged = spans.reduce<typeof spans>((acc, s) => {
      const last = acc[acc.length - 1]
      if (last && last.style.fontFamily === s.style.fontFamily) {
        last.text += s.text
        return acc
      }
      acc.push({ ...s })
      return acc
    }, [])
    const layout = engine.layoutParagraph({
      spans: merged,
      availableWidth: 500,
      direction: 'rtl',
      align: 'right',
      lineHeight: 24
    })
    const glyphs = layout.lines[0].glyphs
    expect(glyphs.length).toBeGreaterThan(5)
    const lefts = glyphs.map(g => g.left)
    const uniqueLefts = new Set(lefts.map(v => Math.round(v * 10)))
    // Must not pile every glyph on the same x
    expect(uniqueLefts.size).toBeGreaterThan(3)
    const span = Math.max(...glyphs.map(g => g.right)) - Math.min(...lefts)
    expect(span).toBeGreaterThan(40)
  })
})
