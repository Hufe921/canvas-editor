import { describe, expect, it } from 'vitest'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { detectParagraphDirection } from '../../../src/editor/core/text-engine/utils/resolveDirection'
import { mergeVisualRects } from '../../../src/editor/core/text-engine/utils/mergeVisualRects'

describe('text-engine bidi', () => {
  it('detects arabic as rtl', () => {
    expect(detectParagraphDirection('سلام')).toBe('rtl')
    expect(detectParagraphDirection('Hello')).toBe('ltr')
  })

  it('builds level runs for mixed text', () => {
    const resolver = new BidiResolver()
    const runs = resolver.getLevelRuns('Hello سلام', 'rtl')
    expect(runs.length).toBeGreaterThan(1)
    expect(runs.some(r => r.direction === 'rtl')).toBe(true)
    expect(runs.some(r => r.direction === 'ltr')).toBe(true)
  })

  it('returns visual indices for rtl arabic', () => {
    const resolver = new BidiResolver()
    const indices = resolver.getVisualIndices('اب', 'rtl')
    expect(indices).toEqual([1, 0])
  })
})

describe('mergeVisualRects', () => {
  it('merges adjacent boxes on same band', () => {
    const merged = mergeVisualRects([
      { left: 0, right: 10, y: 0, height: 16 },
      { left: 10, right: 20, y: 0, height: 16 }
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0].left).toBe(0)
    expect(merged[0].right).toBe(20)
  })

  it('does not merge when visually discontinuous', () => {
    const merged = mergeVisualRects([
      { left: 30, right: 40, y: 0, height: 16 },
      { left: 0, right: 10, y: 0, height: 16 }
    ])
    expect(merged.length).toBeGreaterThanOrEqual(1)
    // After sort: 0-10 then 30-40 → two rects
    expect(merged).toHaveLength(2)
  })
})
