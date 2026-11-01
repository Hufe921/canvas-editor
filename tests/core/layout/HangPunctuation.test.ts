import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { ZERO } from '@/editor/dataset/constant/Common'
import { RowFlex } from '@/editor/dataset/enum/Row'
import type { IElement } from '@/editor/interface/Element'
import type { IRow } from '@/editor/interface/Row'

/**
 * 避头标点行尾悬挂：标点悬挂行尾不占行宽，下一行不以标点开头
 */

// 测试环境字符宽度固定 1px 且段首 ZERO 占 1px：版心 554 => 553 字满行
const FILL_COUNT = 553
const ROW_CAPACITY = 554
const HANG_SET = '，。、；：？！…—～）】》〉」』”’'

function createHangDoc(
  trailing: string,
  rowFlex?: RowFlex,
  options?: Record<string, unknown>
): {
  ctx: TestEditorContext
  draw: Draw
  rows: IRow[]
} {
  const value = '测'.repeat(FILL_COUNT) + trailing
  const data: IElement[] = [{ value, ...(rowFlex ? { rowFlex } : {}) }]
  const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
  const ctx = createTestEditor({
    data,
    options: {
      hangPunctuation: true,
      header: { disabled: true },
      footer: { disabled: true },
      ...options
    } as any
  })
  const draw = computeSpy.mock.contexts[0] as Draw
  const rows = (draw as unknown as { rawRowList: IRow[] }).rawRowList
  return { ctx, draw, rows }
}

describe('避头标点行尾悬挂', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('标点悬挂行尾：前一个字不换行、行宽不含标点、下一行无行首标点', () => {
    const { ctx, rows } = createHangDoc('，后文')
    expect(rows.length).toBe(2)
    // 行1 = ZERO + 553 个测字 + 悬挂逗号，行宽仅含文字
    expect(rows[0].width).toBe(ROW_CAPACITY)
    const row1Last = rows[0].elementList[rows[0].elementList.length - 1]
    expect(row1Last.value).toBe('，')
    expect(row1Last.hang).toBe(true)
    // 行2 以文字开头（前一个字未被连带换行，标点也未落到行首）
    expect(rows[1].elementList[0].value).toBe('后')
    // 文档数据完整
    const text = ctx.editor.command
      .getValue()
      .data.main.map((el: IElement) => el.value)
      .join('')
    expect(text.startsWith('测'.repeat(FILL_COUNT) + '，后文')).toBe(true)
  })

  it('连续避头标点跟随悬挂', () => {
    const { rows } = createHangDoc('。」后文')
    expect(rows.length).toBe(2)
    const row1 = rows[0].elementList
    expect(row1[row1.length - 2].value).toBe('。')
    expect(row1[row1.length - 2].hang).toBe(true)
    expect(row1[row1.length - 1].value).toBe('」')
    expect(row1[row1.length - 1].hang).toBe(true)
    expect(rows[1].elementList[0].value).toBe('后')
  })

  it('悬挂标点溢出绘制：坐标越过右边界', () => {
    const { draw } = createHangDoc('，后文')
    const positionList = draw.getPosition().getPositionList()
    const comma = positionList.find(p => p.value === '，')
    expect(comma).toBeTruthy()
    // 版心右边界 674：逗号盒 [674, 675) 越过边界
    expect(comma!.coordinate.leftTop[0]).toBe(674)
    expect(comma!.coordinate.rightTop[0]).toBeGreaterThan(674)
  })

  it('右对齐：行宽不含悬挂标点，文字贴边、标点溢出', () => {
    const { draw } = createHangDoc('，后文', RowFlex.RIGHT)
    const positionList = draw.getPosition().getPositionList()
    const firstChar = positionList.find(p => p.value === '测')
    // 行宽 554 不含逗号：右对齐行起点 = 120 + (554 - 554) = 120，
    // 首个测字在 ZERO（测试环境占 1px）之后 => 121（若行宽含逗号则为 120）
    expect(firstChar!.coordinate.leftTop[0]).toBe(121)
    const comma = positionList.find(p => p.value === '，')
    expect(comma!.coordinate.rightTop[0]).toBeGreaterThan(674)
  })

  it('两端对齐：悬挂标点不参与撑开', () => {
    const { rows } = createHangDoc('，后文', RowFlex.JUSTIFY)
    const row1Last = rows[0].elementList[rows[0].elementList.length - 1]
    expect(row1Last.value).toBe('，')
    expect(row1Last.hang).toBe(true)
    // 撑开只作用于文字，悬挂标点宽度保持原样
    expect(row1Last.metrics.width).toBe(1)
  })

  it('西文单词与半角句点仍整体换行（预占宽度不回退）', () => {
    const { rows } = createHangDoc('word.后')
    // 行1 = ZERO + 553 个测字（无悬挂），行2 = word. 后
    expect(rows[0].elementList[rows[0].elementList.length - 1].value).toBe('测')
    const row2Values = rows[1].elementList.map(el => el.value)
    expect(row2Values[0]).toBe('w')
    expect(row2Values).toContain('.')
  })

  it('各行行首不是避头标点（换行符行除外）', () => {
    const { rows } = createHangDoc(
      '，后文，测试，标点，符号，校验，内容，补充，覆盖，多行，场景，用例，样例，数据，验证'
    )
    expect(rows.length).toBeGreaterThanOrEqual(2)
    for (const row of rows) {
      const first = row.elementList[0]
      if (first.value === ZERO) continue
      expect(HANG_SET.includes(first.value)).toBe(false)
    }
  })

  it('默认关闭：保持原有换行行为（标点连带前一个字换行，无悬挂）', () => {
    const { rows } = createHangDoc('，后文', undefined, {
      hangPunctuation: false
    })
    expect(rows.length).toBe(2)
    // 原行为：行内剩余宽度不足时预占标点宽度，前一个测字与标点一起换行
    expect(rows[0].elementList[rows[0].elementList.length - 1].value).toBe('测')
    expect(rows[1].elementList.map(el => el.value).slice(0, 2)).toEqual([
      '测',
      '，'
    ])
    for (const row of rows) {
      for (const el of row.elementList) {
        expect(el.hang).toBeFalsy()
      }
    }
  })
})
