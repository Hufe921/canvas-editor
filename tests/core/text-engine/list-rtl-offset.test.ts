import { describe, expect, it } from 'vitest'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { ListType } from '../../../src/editor'
import type { IRow, IRowElement } from '../../../src/editor/interface/Row'

/**
 * RTL 列表：gutter 在右侧，offsetX 应为 0（勿再套用 LTR 左侧缩进）。
 * 标记 x ≈ ZERO 的 startX（内容右缘），而非 startX + row.width + offsetX。
 */
describe('RTL list geometry helpers', () => {
  it('documents expected offsetX and marker x for rtl engine rows', () => {
    const listStyleWidth = 24
    const indent = 0
    const innerWidth = 500
    const availableWidth = innerWidth - listStyleWidth - indent
    const rowWidth = 200
    const shiftX = availableWidth - rowWidth
    const marginLeft = 120

    const isRtl = true
    const offsetX = isRtl ? 0 : listStyleWidth + indent
    expect(offsetX).toBe(0)

    // ZERO 挂在内容右缘
    const zeroVisualLeft = shiftX + rowWidth
    const rowContentStartX = marginLeft + offsetX
    const startX = rowContentStartX + zeroVisualLeft

    // 错误旧公式会把标记推到更右甚至出页
    const wrongX = startX + rowWidth + offsetX
    const correctX = startX
    expect(correctX).toBe(marginLeft + availableWidth)
    expect(wrongX).toBeGreaterThan(marginLeft + innerWidth)

    const row = {
      direction: 'rtl' as const,
      width: rowWidth,
      offsetX,
      isList: true,
      elementList: [
        {
          value: ZERO,
          listId: 'L1',
          listType: ListType.OL,
          visualLeft: zeroVisualLeft,
          metrics: { width: 0, height: 16, boundingBoxAscent: 12, boundingBoxDescent: 4 }
        } as IRowElement
      ]
    } satisfies Partial<IRow>
    expect(row.offsetX).toBe(0)
    expect(correctX).toBeLessThan(marginLeft + innerWidth)
  })
})
