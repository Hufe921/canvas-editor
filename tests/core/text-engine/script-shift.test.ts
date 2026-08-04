import { describe, expect, it } from 'vitest'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { BrowserTextShaper } from '../../../src/editor/core/text-engine/shape/BrowserTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'

describe('superscript / subscript scriptShift', () => {
  it('applies vertical baselineShift independent of RTL, keeps LTR order inside run', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const text = '对齐ab'
    // RTL paragraph; "ab" is superscript — horizontal still follows bidi
    const spans = [...text].map((ch, i) => ({
      logicalIndex: i + 1,
      text: ch,
      style: {
        fontFamily: 'sans-serif',
        fontSize: i >= 2 ? Math.ceil(16 * 0.6) : 16,
        color: '#000',
        scriptShift: i >= 2 ? ('super' as const) : undefined
      }
    }))
    const layout = engine.layoutParagraph({
      spans,
      availableWidth: 800,
      direction: 'rtl',
      align: 'right',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const line = layout.lines[0]
    const supers = line.glyphs.filter(g => g.style.scriptShift === 'super')
    const normals = line.glyphs.filter(g => !g.style.scriptShift)
    expect(supers.length).toBe(2)
    expect(normals.length).toBe(2)
    for (const g of supers) {
      expect(g.baselineShift).toBeCloseTo(-(g.style.fontSize || 0) / 2, 5)
      expect(g.style.fontSize).toBe(Math.ceil(16 * 0.6))
    }
    for (const g of normals) {
      expect(g.baselineShift || 0).toBe(0)
    }
    // Superscript Latin stays visually contiguous (not stretched by wrong particle x)
    const [a, b] = [...supers].sort((x, y) => x.left - y.left)
    expect(b.left).toBeGreaterThanOrEqual(a.right - 0.5)
    expect(b.left - a.left).toBeLessThan((a.style.fontSize || 10) * 2)
  })

  it('subscript shifts down and expands line descent', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          text: '对齐',
          logicalIndices: [1, 1],
          style: {
            fontFamily: 'sans-serif',
            fontSize: Math.ceil(16 * 0.6),
            scriptShift: 'sub'
          }
        }
      ],
      availableWidth: 800,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const line = layout.lines[0]
    expect(line.glyphs.every(g => (g.baselineShift || 0) > 0)).toBe(true)
    const fs = line.glyphs[0].style.fontSize || 10
    expect(line.descent).toBeGreaterThanOrEqual(fs / 2)
  })
})
