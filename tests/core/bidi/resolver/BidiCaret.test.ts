import { describe, expect, it } from 'vitest'
import type { IElementPosition } from '@/editor/interface/Element'
import {
  getBidiCaretList,
  getBidiCaretX,
  getNearestBidiCaret,
  getVisualBidiCaret
} from '@/editor/core/bidi/resolver/BidiCaret'

function createPosition(
  index: number,
  x: number,
  bidiLevel: number,
  isFirstLetter = false
): IElementPosition {
  return {
    index,
    value: 'a',
    pageNo: 0,
    rowNo: 0,
    rowIndex: 0,
    ascent: 12,
    lineHeight: 20,
    left: x,
    bidiLevel,
    metrics: {
      width: 10,
      height: 16,
      boundingBoxAscent: 12,
      boundingBoxDescent: 4
    },
    isFirstLetter,
    isLastLetter: false,
    coordinate: {
      leftTop: [x, 0],
      rightTop: [x + 10, 0],
      leftBottom: [x, 20],
      rightBottom: [x + 10, 20]
    }
  }
}

const positions = [
  createPosition(0, 0, 0, true),
  createPosition(1, 20, 1),
  createPosition(2, 10, 1)
]

describe('BidiCaret', () => {
  it('根据文字方向选择字符前后两侧', () => {
    expect(getBidiCaretX(positions[0], 'before')).toBe(0)
    expect(getBidiCaretX(positions[0], 'after')).toBe(10)
    expect(getBidiCaretX(positions[1], 'before')).toBe(30)
    expect(getBidiCaretX(positions[1], 'after')).toBe(20)
  })

  it('BiDi 边界的同一逻辑位置可对应两个视觉光标', () => {
    const carets = getBidiCaretList(positions)
    expect(
      carets.filter(caret => caret.index === 0).map(caret => caret.x)
    ).toEqual([10, 30])
  })

  it('左右键按视觉顺序移动并保留目标亲和性', () => {
    const target = getVisualBidiCaret(positions, positions[0], 1, 'after')
    expect(target).toMatchObject({ index: 1, affinity: 'after', x: 20 })
    const previous = getVisualBidiCaret(
      positions,
      positions[0],
      -1,
      'after'
    )
    expect(previous).toMatchObject({ index: -1, x: 0 })
  })

  it('行外点击返回距离最近的视觉光标', () => {
    expect(getNearestBidiCaret(positions, 29)).toMatchObject({
      index: 0,
      affinity: 'before',
      x: 30
    })
  })
})
