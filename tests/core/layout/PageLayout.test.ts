import { describe, expect, it } from 'vitest'
import {
  computeMultiplePageLayout,
  computeSinglePageLayout
} from '@/editor/core/layout/PageLayout'

describe('PageLayout', () => {
  it('单页模式保持垂直排列并居中较窄页面', () => {
    const result = computeSinglePageLayout(
      [
        { width: 300, height: 400 },
        { width: 400, height: 300 },
        { width: 300, height: 400 }
      ],
      20
    )

    expect(result).toEqual({
      width: 400,
      height: 1160,
      offsetList: [
        { x: 50, y: 0 },
        { x: 0, y: 420 },
        { x: 50, y: 740 }
      ],
      isMultiPage: false
    })
  })

  it('多页模式按可用宽度装页并独立居中每一行', () => {
    const result = computeMultiplePageLayout(
      Array.from({ length: 5 }, () => ({ width: 300, height: 400 })),
      20,
      900
    )

    expect(result.width).toBe(900)
    expect(result.height).toBe(1260)
    expect(result.offsetList).toEqual([
      { x: 140, y: 0 },
      { x: 460, y: 0 },
      { x: 140, y: 420 },
      { x: 460, y: 420 },
      { x: 300, y: 840 }
    ])
    expect(result.isMultiPage).toBe(true)
  })

  it('混合纸张尺寸时按行内最大页高推进下一行', () => {
    const result = computeMultiplePageLayout(
      [
        { width: 300, height: 400 },
        { width: 400, height: 300 },
        { width: 300, height: 400 }
      ],
      20,
      900
    )

    expect(result.offsetList).toEqual([
      { x: 90, y: 0 },
      { x: 410, y: 0 },
      { x: 300, y: 420 }
    ])
    expect(result.height).toBe(840)
  })

  it('可用宽度小于单页宽度时不产生负偏移或重叠', () => {
    const result = computeMultiplePageLayout(
      [
        { width: 300, height: 400 },
        { width: 300, height: 400 }
      ],
      20,
      100
    )

    expect(result.width).toBe(300)
    expect(result.offsetList).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 420 }
    ])
    expect(result.isMultiPage).toBe(false)
  })

  it('缩放后的宽度恰好容纳整行时不额外换行', () => {
    const result = computeMultiplePageLayout(
      Array.from({ length: 3 }, () => ({ width: 200, height: 300 })),
      10,
      620
    )

    expect(result.offsetList.map(offset => offset.y)).toEqual([0, 0, 0])
  })

  it('空文档返回空布局', () => {
    expect(computeMultiplePageLayout([], 20, 900)).toEqual({
      width: 0,
      height: 0,
      offsetList: [],
      isMultiPage: false
    })
  })
})
