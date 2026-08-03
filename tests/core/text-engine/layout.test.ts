import { describe, expect, it } from 'vitest'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { BrowserTextShaper } from '../../../src/editor/core/text-engine/shape/BrowserTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'
import { HitTestAdapter } from '../../../src/editor/core/text-engine-host/HitTestAdapter'

describe('TextLayoutEngine', () => {
  it('layouts ltr paragraph with browser shaper', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const result = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          text: 'Hi',
          style: { fontFamily: 'sans-serif', fontSize: 16, color: '#000' }
        }
      ],
      availableWidth: 500,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24
    })
    expect(result.lines.length).toBe(1)
    expect(result.lines[0].glyphs.length).toBeGreaterThan(0)
    expect(result.lines[0].glyphs[0].left).toBe(0)
  })

  it('places rtl glyphs in visual order with browser shaper', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const result = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          text: 'ا',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        },
        {
          logicalIndex: 2,
          text: 'ب',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        }
      ],
      availableWidth: 500,
      direction: 'rtl',
      align: 'right',
      lineHeight: 24
    })
    const glyphs = result.lines[0].glyphs
    expect(glyphs.length).toBe(2)
    // Visual order: ب then ا (logical index 2 then 1)
    expect(glyphs[0].logicalIndexStart).toBe(2)
    expect(glyphs[1].logicalIndexStart).toBe(1)
    expect(glyphs[0].left).toBeLessThan(glyphs[1].left)
  })

  it('caret after-index uses trailing edge; hit-test matches', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 0,
          text: 'abc',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        }
      ],
      availableWidth: 500,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24
    })
    const hit = new HitTestAdapter()
    const caret = hit.caretMetrics(layout, 0)
    expect(caret).not.toBeNull()
    // after 'a' → right edge of first glyph
    expect(caret!.x).toBeCloseTo(layout.lines[0].glyphs[0].right, 5)
    const idx = hit.pointToLogicalIndex(layout, caret!.x - 0.1, 0)
    expect(idx).toBe(0)
  })

  it('rtl caret after-index is on glyph left; visualNeighbor moves by screen x', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          text: 'ا',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        },
        {
          logicalIndex: 2,
          text: 'ب',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        }
      ],
      availableWidth: 500,
      direction: 'rtl',
      align: 'right',
      lineHeight: 24
    })
    const hit = new HitTestAdapter()
    const afterBa = hit.caretMetrics(layout, 2) // after ب (visual leftmost)
    expect(afterBa).not.toBeNull()
    expect(afterBa!.x).toBeCloseTo(layout.lines[0].glyphs[0].left, 5)
    // Screen-right from after ب should be after ا
    expect(hit.visualNeighbor(layout, 2, 1)).toBe(1)
    expect(hit.visualNeighbor(layout, 1, -1)).toBe(2)
  })

  it('alignment stretches non-last lines; last line stays at start side', () => {
    const fixedShaper = {
      shape(run: {
        text: string
        textStart: number
        style: { fontSize: number }
        logicalIndexAt: (o: number) => number
        direction: 'ltr' | 'rtl'
      }) {
        const ax = 10
        return [...run.text].map((_, i) => {
          const charStart = run.textStart + i
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
            bidiLevel: 0
          }
        })
      }
    }
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      fixedShaper as unknown as BrowserTextShaper
    )
    const text = 'abcdefghij'
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i,
      text: ch,
      style: { fontFamily: 'sans-serif', fontSize: 16 }
    }))
    // 10px/glyph, width 35 → 3+3+3+1 lines
    const layout = engine.layoutParagraph({
      spans,
      availableWidth: 35,
      direction: 'ltr',
      align: 'alignment',
      lineHeight: 24
    })
    expect(layout.lines.length).toBeGreaterThan(1)
    const first = layout.lines[0]
    const last = layout.lines[layout.lines.length - 1]
    expect(first.width).toBeCloseTo(35, 0)
    expect(first.glyphs[0].left).toBeLessThanOrEqual(0.01)
    // Last line of 两端对齐: left for LTR, not stretched to full width
    expect(last.width).toBeLessThan(35 - 0.5)
    expect(last.glyphs[0].left).toBeLessThanOrEqual(0.01)
  })

  it('justify stretches every line including the last', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const text = 'abcd'
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i,
      text: ch,
      style: { fontFamily: 'sans-serif', fontSize: 16 }
    }))
    const layout = engine.layoutParagraph({
      spans,
      availableWidth: 200,
      direction: 'ltr',
      align: 'justify',
      lineHeight: 24
    })
    expect(layout.lines.length).toBe(1)
    expect(layout.lines[0].width).toBeCloseTo(200, 0)
    expect(layout.lines[0].glyphs[0].left).toBeLessThanOrEqual(0.01)
    const last = layout.lines[0].glyphs[layout.lines[0].glyphs.length - 1]
    expect(last.right).toBeGreaterThan(100)
  })

  it('rtl alignment last/only line aligns to the right, not left', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          text: 'ا',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        },
        {
          logicalIndex: 2,
          text: 'ب',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        }
      ],
      availableWidth: 200,
      direction: 'rtl',
      align: 'alignment',
      lineHeight: 24
    })
    const line = layout.lines[0]
    // Single line = last line → no stretch, sit on RTL start (right)
    expect(line.width).toBeLessThan(200 - 0.5)
    expect(line.glyphs[0].left).toBeGreaterThan(50)
  })

  it('mixed ltr/rtl in rtl paragraph has continuous visual x', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const chars = 'Hi مرحبا'
    const spans = [...chars].map((ch, i) => ({
      logicalIndex: i + 1,
      text: ch,
      style: { fontFamily: 'sans-serif', fontSize: 16 }
    }))
    const layout = engine.layoutParagraph({
      spans,
      availableWidth: 500,
      direction: 'rtl',
      align: 'right',
      lineHeight: 24
    })
    const glyphs = layout.lines[0].glyphs
    expect(glyphs.length).toBe(chars.length)
    for (let i = 1; i < glyphs.length; i++) {
      expect(glyphs[i].left).toBeGreaterThanOrEqual(glyphs[i - 1].left - 0.01)
    }
  })

  it('line height follows max font size on the line', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          text: 'ab',
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        },
        {
          logicalIndex: 3,
          text: 'CD',
          style: { fontFamily: 'sans-serif', fontSize: 48 }
        }
      ],
      availableWidth: 500,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const line = layout.lines[0]
    expect(line.height).toBe(48 * 1.5)
    expect(line.ascent).toBe(line.height * 0.8)
  })
})
