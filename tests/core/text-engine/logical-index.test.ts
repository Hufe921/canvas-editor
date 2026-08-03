import { describe, expect, it } from 'vitest'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { BrowserTextShaper } from '../../../src/editor/core/text-engine/shape/BrowserTextShaper'
import { TextLayoutEngine } from '../../../src/editor/core/text-engine/layout/TextLayoutEngine'
import { mapLayoutToRows } from '../../../src/editor/core/text-engine-host/mapToLegacyRow'
import { IElement } from '../../../src/editor/interface/Element'

describe('multi-code-unit grapheme logical index', () => {
  it('does not steal following element indices for Segmenter-style graphemes', () => {
    // Intl.Segmenter often keeps नमस्ते as one IElement with multiple UTF-16 units
    const grapheme = 'नमस्ते'
    const tip = '提示'
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: '7' },
      { value: grapheme },
      { value: '\u200B' },
      { value: tip[0] },
      { value: tip[1] }
    ]
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 1,
          logicalIndices: [1],
          text: '7',
          style: { fontFamily: 'sans-serif', fontSize: 16, color: '#000' }
        },
        {
          logicalIndex: 2,
          logicalIndices: new Array(grapheme.length).fill(2),
          text: grapheme,
          style: { fontFamily: 'sans-serif', fontSize: 16, color: '#000' }
        }
      ],
      availableWidth: 800,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const line = layout.lines[0]
    expect(line.logicalStart).toBe(1)
    expect(line.logicalEnd).toBe(2)
    for (const g of line.glyphs) {
      expect(g.logicalIndexStart).toBeGreaterThanOrEqual(1)
      expect(g.logicalIndexEnd).toBeLessThanOrEqual(2)
    }
    const rows = mapLayoutToRows({
      layout,
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    const rowIndices = rows[0].elementList.map(el => elementList.indexOf(el))
    expect(rowIndices).toEqual([1, 2])
    // 提示段元素绝不能被 Object.assign 进 Indic 行
    expect(rows[0].elementList.some(el => el.value === tip[0])).toBe(false)
    expect(
      (elementList[4] as IElement & { visualLeft?: number }).visualLeft
    ).toBeUndefined()
  })

  it('fallback without logicalIndices maps whole span to one element', () => {
    const grapheme = 'नमस्ते'
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: [
        {
          logicalIndex: 5,
          text: grapheme,
          style: { fontFamily: 'sans-serif', fontSize: 16 }
        }
      ],
      availableWidth: 800,
      direction: 'ltr',
      align: 'left',
      lineHeight: 24
    })
    for (const g of layout.lines[0].glyphs) {
      expect(g.logicalIndexStart).toBe(5)
      expect(g.logicalIndexEnd).toBe(5)
    }
  })
})
