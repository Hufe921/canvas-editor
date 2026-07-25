import { describe, it, expect } from 'vitest'
import {
  getColgroupWidth,
  scaleColgroupToWidth,
  shrinkColgroupToWidth
} from '@/editor/utils/table'
import { IColgroup } from '@/editor/interface/table/Colgroup'

describe('表格列宽缩放工具', () => {
  it('getColgroupWidth 返回列宽之和', () => {
    expect(getColgroupWidth([{ width: 100 }, { width: 200 }])).toBe(300)
  })

  it('shrinkColgroupToWidth 未超宽时不处理', () => {
    const colgroup: IColgroup[] = [{ width: 100 }, { width: 200 }]
    shrinkColgroupToWidth(colgroup, 400, 40)
    expect(colgroup.map(col => col.width)).toEqual([100, 200])
  })

  it('shrinkColgroupToWidth 超宽时等比例压缩', () => {
    const colgroup: IColgroup[] = [{ width: 400 }, { width: 400 }]
    shrinkColgroupToWidth(colgroup, 400, 40)
    expect(colgroup.map(col => col.width)).toEqual([200, 200])
  })

  it('shrinkColgroupToWidth 列宽不低于最小宽度', () => {
    const colgroup: IColgroup[] = [{ width: 900 }, { width: 45 }]
    shrinkColgroupToWidth(colgroup, 500, 40)
    expect(colgroup[1].width).toBe(40)
    expect(colgroup[0].width).toBe(460)
  })

  it('shrinkColgroupToWidth 低于最小宽度的列保持，可压缩列继续分摊', () => {
    const colgroup: IColgroup[] = [{ width: 1000 }, { width: 30 }]
    shrinkColgroupToWidth(colgroup, 500, 40)
    expect(colgroup[1].width).toBe(30)
    expect(colgroup[0].width).toBe(470)
  })

  it('shrinkColgroupToWidth 全部列到达下限仍超宽时保持', () => {
    const colgroup: IColgroup[] = [{ width: 45 }, { width: 42 }]
    shrinkColgroupToWidth(colgroup, 50, 40)
    expect(colgroup.map(col => col.width)).toEqual([40, 40])
  })

  it('shrinkColgroupToWidth 重复调用结果幂等', () => {
    const colgroup: IColgroup[] = [{ width: 1000 }, { width: 30 }]
    shrinkColgroupToWidth(colgroup, 500, 40)
    const firstWidthList = colgroup.map(col => col.width)
    shrinkColgroupToWidth(colgroup, 500, 40)
    expect(colgroup.map(col => col.width)).toEqual(firstWidthList)
  })

  it('scaleColgroupToWidth 等比放大至目标宽度', () => {
    const colgroup: IColgroup[] = [{ width: 100 }, { width: 300 }]
    scaleColgroupToWidth(colgroup, 800)
    expect(colgroup.map(col => col.width)).toEqual([200, 600])
  })

  it('scaleColgroupToWidth 等比缩小至目标宽度', () => {
    const colgroup: IColgroup[] = [{ width: 400 }, { width: 400 }]
    scaleColgroupToWidth(colgroup, 400)
    expect(colgroup.map(col => col.width)).toEqual([200, 200])
  })

  it('scaleColgroupToWidth 总宽为 0 时不处理', () => {
    const colgroup: IColgroup[] = [{ width: 0 }, { width: 0 }]
    scaleColgroupToWidth(colgroup, 400)
    expect(colgroup.map(col => col.width)).toEqual([0, 0])
  })
})
