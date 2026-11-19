import { describe, expect, it } from 'vitest'
import type { IElementPosition } from '@/editor/interface/Element'
import { getVisualRangeRects } from '@/editor/core/bidi/resolver/BidiGeometry'

function createPosition(
  index: number,
  x: number,
  width: number,
  rowNo = 0,
  pageNo = 0
): IElementPosition {
  return {
    index,
    value: 'a',
    pageNo,
    rowNo,
    rowIndex: rowNo,
    ascent: 12,
    lineHeight: 20,
    left: x,
    metrics: {
      width,
      height: 16,
      boundingBoxAscent: 12,
      boundingBoxDescent: 4
    },
    isFirstLetter: index === 0,
    isLastLetter: false,
    coordinate: {
      leftTop: [x, 100],
      rightTop: [x + width, 100],
      leftBottom: [x, 120],
      rightBottom: [x + width, 120]
    }
  }
}

describe('BidiGeometry', () => {
  it('将逻辑连续但视觉分离的选区拆成多个矩形', () => {
    const rects = getVisualRangeRects([
      createPosition(0, 0, 10),
      createPosition(1, 30, 10),
      createPosition(2, 10, 10)
    ])
    expect(rects.map(({ x, width }) => ({ x, width }))).toEqual([
      { x: 0, width: 20 },
      { x: 30, width: 10 }
    ])
  })

  it('保留页码和行信息并使用指定行高', () => {
    const rects = getVisualRangeRects(
      [createPosition(0, 0, 10, 2, 1)],
      24
    )
    expect(rects).toEqual([
      expect.objectContaining({
        x: 0,
        y: 100,
        width: 10,
        height: 24,
        pageNo: 1,
        rowNo: 2,
        rowIndex: 2
      })
    ])
  })
})
