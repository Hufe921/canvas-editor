import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { resolveCursorInkMetrics } from '../../../src/editor/core/cursor/Cursor'

describe('resolveCursorInkMetrics', () => {
  it('uses nominal size for superscript instead of actualSize', () => {
    const result = resolveCursorInkMetrics({
      element: {
        type: ElementType.SUPERSCRIPT,
        size: 16,
        actualSize: 10
      },
      metrics: {
        height: 10,
        boundingBoxAscent: 13, // actualSize*0.8 + actualSize/2
        boundingBoxDescent: 0
      },
      defaultSize: 16,
      scale: 1
    })
    expect(result.fontSize).toBe(16)
    expect(result.inkAscent).toBeCloseTo(12.8)
    expect(result.inkDescent).toBeCloseTo(3.2)
  })

  it('keeps actualSize path for normal text when not inflated', () => {
    const result = resolveCursorInkMetrics({
      element: { size: 16 },
      metrics: {
        height: 16,
        boundingBoxAscent: 12.8,
        boundingBoxDescent: 3.2
      },
      defaultSize: 16,
      scale: 1
    })
    expect(result.fontSize).toBe(16)
    expect(result.inkAscent).toBeCloseTo(12.8)
  })

  it('deflates IMAGE metrics to text-sized ink (not full image height)', () => {
    const result = resolveCursorInkMetrics({
      element: { type: ElementType.IMAGE, size: 16 },
      metrics: {
        height: 80,
        boundingBoxAscent: 0,
        boundingBoxDescent: 80
      },
      defaultSize: 16,
      scale: 1
    })
    expect(result.fontSize).toBe(16)
    expect(result.inkAscent).toBeCloseTo(12.8)
    expect(result.inkDescent).toBeCloseTo(3.2)
  })
})
