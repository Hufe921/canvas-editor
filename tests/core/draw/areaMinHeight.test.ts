import { describe, it, expect, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IElement } from '@/editor/interface/Element'
import { IRow } from '@/editor/interface/Row'
import { Highlight } from '@/editor/core/draw/richtext/Highlight'

const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}

function renderMain(main: IElement[]): Draw {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({ ...PAGE_OPTION })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render()
  return draw
}

function makeAreaDoc(minHeight?: number, hide = false): IElement[] {
  return [
    {
      type: ElementType.AREA,
      value: '',
      areaId: 'area-1',
      area: {
        ...(minHeight ? { minHeight } : {}),
        ...(hide ? { hide } : {})
      },
      valueList: [{ value: '区域内容\n' }]
    },
    { value: '区域外文字\n' }
  ]
}

// 区域内容高度：区域内连续行的（行高+行偏移）之和，扣除首行的区域顶部间距
function getAreaContentHeight(rowList: IRow[]): number {
  const firstRowIndex = rowList.findIndex(row =>
    row.elementList.some(el => el.areaId)
  )
  if (firstRowIndex < 0) return 0
  let lastRowIndex = firstRowIndex
  while (
    lastRowIndex + 1 < rowList.length &&
    rowList[lastRowIndex + 1].elementList.some(el => el.areaId)
  ) {
    lastRowIndex++
  }
  let height = -(rowList[firstRowIndex].offsetY || 0)
  for (let i = firstRowIndex; i <= lastRowIndex; i++) {
    height += rowList[i].height + (rowList[i].offsetY || 0)
  }
  return height
}

describe('区域最小高度', () => {
  it('内容高度不足 minHeight 时补充至最小高度', () => {
    const baseDraw = renderMain(makeAreaDoc())
    const baseHeight = getAreaContentHeight(baseDraw.getRowList())

    const draw = renderMain(makeAreaDoc(200))
    const rowList = draw.getRowList()
    const contentHeight = getAreaContentHeight(rowList)
    expect(contentHeight).toBeCloseTo(200)
    expect(contentHeight).toBeGreaterThan(baseHeight)
    // 区域外后续内容随补高下移（“区域内容”与“区域外文字”均以“区”开头，取最后一个）
    const outerPosition = draw
      .getPosition()
      .getPositionList()
      .filter(p => p.value === '区')
      .pop()!
    const baseOuterPosition = baseDraw
      .getPosition()
      .getPositionList()
      .filter(p => p.value === '区')
      .pop()!
    expect(
      outerPosition.coordinate.leftTop[1] -
        baseOuterPosition.coordinate.leftTop[1]
    ).toBeCloseTo(200 - baseHeight)
  })

  it('内容高度超过 minHeight 时不补高', () => {
    const baseDraw = renderMain(makeAreaDoc())
    const draw = renderMain(makeAreaDoc(10))
    const baseRowList = baseDraw.getRowList()
    const rowList = draw.getRowList()
    expect(rowList.length).toBe(baseRowList.length)
    for (let i = 0; i < rowList.length; i++) {
      expect(rowList[i].height).toBeCloseTo(baseRowList[i].height)
      expect(rowList[i].offsetY || 0).toBeCloseTo(baseRowList[i].offsetY || 0)
    }
  })

  it('隐藏区域不应用最小高度', () => {
    const draw = renderMain(makeAreaDoc(200, true))
    expect(getAreaContentHeight(draw.getRowList())).toBe(0)
  })

  it('选区与高亮高度不受末行补高影响', () => {
    const makeDoc = (minHeight?: number): IElement[] => [
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'area-1',
        area: {
          ...(minHeight ? { minHeight } : {})
        },
        valueList: [{ value: '区域内容\n', highlight: '#F2F27F' }]
      },
      { value: '区域外文字\n' }
    ]
    // 采集选区与高亮的绘制高度（强制立即渲染，懒渲染依赖浏览器观察者）
    const capture = (draw: Draw) => {
      draw.getRange().setRange(2, 5)
      const rangeSpy = vi.spyOn(draw.getRange(), 'render')
      const highlightSpy = vi.spyOn(Highlight.prototype, 'recordFillInfo')
      draw.render({ isLazy: false })
      const rangeHeight = rangeSpy.mock.calls[0]?.[4]
      const highlightHeight = highlightSpy.mock.calls[0]?.[4]
      rangeSpy.mockRestore()
      highlightSpy.mockRestore()
      return { rangeHeight, highlightHeight }
    }
    const base = capture(renderMain(makeDoc()))
    expect(base.rangeHeight).toBeGreaterThan(0)
    expect(base.highlightHeight).toBeGreaterThan(0)
    // 补高 200 后选区/高亮高度应与未补高时一致（补高部分不参与绘制）
    const padded = capture(renderMain(makeDoc(200)))
    expect(padded.rangeHeight).toBe(base.rangeHeight)
    expect(padded.highlightHeight).toBe(base.highlightHeight)
  })

  it('补高超过当前页剩余空间时填满页底并结转至下一页', () => {
    // 页高 1123、下边距 100 => 正文底部界限 y = 1023
    const PAGE_BOTTOM = 1023
    // 用两次渲染的区域顶部差值测量填充行高（同一行内字符 y 相同，不能直接测）
    const probeAreaTop = (filler: number) => {
      const probeDraw = renderMain([
        { value: '充\n'.repeat(filler) },
        ...makeAreaDoc()
      ])
      return probeDraw
        .getPosition()
        .getPositionList()
        .find(p => p.value === '区')!.coordinate.leftTop[1]
    }
    const rowHeight = (probeAreaTop(13) - probeAreaTop(3)) / 10
    expect(rowHeight).toBeGreaterThan(0)
    const areaContentHeight = getAreaContentHeight(
      renderMain([{ value: '充\n'.repeat(3) }, ...makeAreaDoc()]).getRowList()
    )
    // 构造填充行数，使区域末行距页底仅剩约 200px
    const fillerCount = Math.max(
      1,
      Math.round((923 - 200 - areaContentHeight) / rowHeight)
    )
    const doc = (minHeight?: number): IElement[] => [
      { value: '充\n'.repeat(fillerCount) },
      ...makeAreaDoc(minHeight)
    ]
    const base = renderMain(doc())
    const baseAreaInfo = base.getArea().getAreaInfo().get('area-1')!
    const baseLastPosition =
      baseAreaInfo.positionList[baseAreaInfo.positionList.length - 1]
    // 区域内容应在第一页且距页底不足 400px
    expect(baseLastPosition.pageNo).toBe(0)
    const remaining = PAGE_BOTTOM - baseLastPosition.coordinate.rightBottom[1]
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThan(400)
    // 补高超过当前页剩余空间 100px
    const contentHeight = getAreaContentHeight(base.getRowList())
    const minHeight = Math.round(contentHeight + remaining + 100)
    const draw = renderMain(doc(minHeight))
    // 区域内容没有被推入下一页
    const areaInfo = draw.getArea().getAreaInfo().get('area-1')!
    expect(areaInfo.positionList[0].pageNo).toBe(0)
    const lastPosition = areaInfo.positionList[areaInfo.positionList.length - 1]
    expect(lastPosition.pageNo).toBe(0)
    // 本页区域框填满至页底
    expect(lastPosition.coordinate.rightBottom[1]).toBeCloseTo(PAGE_BOTTOM, 0)
    // 不生成空白延续行
    expect(
      draw.getRowList().every(row => row.elementList.length > 0)
    ).toBeTruthy()
    // 剩余补高结转为区域外后续行的顶部间距
    const carryRow = draw.getMainRowList().find(row => row.areaPaddingCarry)
    expect(carryRow?.areaPaddingCarry?.areaId).toBe('area-1')
    const carryHeight = carryRow!.areaPaddingCarry!.height
    expect(carryHeight).toBeGreaterThan(0)
    // 区域外后续内容被挤到下一页，且顶部偏移包含结转补高
    const outerPosition = draw
      .getPosition()
      .getPositionList()
      .filter(p => p.value === '区')
      .pop()!
    expect(outerPosition.pageNo).toBe(1)
    expect(outerPosition.coordinate.leftTop[1]).toBeCloseTo(
      100 + carryRow!.offsetY!,
      0
    )
    // 延续段供区域框在下一页顶部延续绘制
    const segmentList = areaInfo.paddingSegmentList!
    expect(segmentList.length).toBe(1)
    expect(segmentList[0].pageNo).toBe(1)
    expect(segmentList[0].y).toBeCloseTo(100, 0)
    expect(segmentList[0].height).toBeCloseTo(carryHeight, 5)
    // minHeight 被完整满足：页底填满部分 + 结转延续段
    const totalHeight =
      PAGE_BOTTOM -
      areaInfo.positionList[0].coordinate.leftTop[1] +
      segmentList[0].height
    expect(Math.abs(totalHeight - minHeight)).toBeLessThanOrEqual(1)
  })

  it('区域位于文档末尾时剩余补高以空白页延续', () => {
    // 页高 1123、下边距 100 => 正文底部界限 y = 1023
    const PAGE_BOTTOM = 1023
    const probeAreaTop = (filler: number) => {
      const probeDraw = renderMain([
        { value: '充\n'.repeat(filler) },
        {
          type: ElementType.AREA,
          value: '',
          areaId: 'area-1',
          valueList: [{ value: '区域内容\n' }]
        }
      ])
      return probeDraw
        .getPosition()
        .getPositionList()
        .find(p => p.value === '区')!.coordinate.leftTop[1]
    }
    const rowHeight = (probeAreaTop(13) - probeAreaTop(3)) / 10
    const areaContentHeight = getAreaContentHeight(
      renderMain([
        { value: '充\n'.repeat(3) },
        {
          type: ElementType.AREA,
          value: '',
          areaId: 'area-1',
          valueList: [{ value: '区域内容\n' }]
        }
      ]).getRowList()
    )
    // 构造填充行数，使区域末行距页底仅剩约 200px
    const fillerCount = Math.max(
      1,
      Math.round((923 - 200 - areaContentHeight) / rowHeight)
    )
    // 区域为文档最后一个元素（之后没有任何内容）
    const doc = (minHeight?: number): IElement[] => [
      { value: '充\n'.repeat(fillerCount) },
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'area-1',
        area: {
          ...(minHeight ? { minHeight } : {})
        },
        valueList: [{ value: '区域内容\n' }]
      }
    ]
    const base = renderMain(doc())
    const baseAreaInfo = base.getArea().getAreaInfo().get('area-1')!
    const baseLastPosition =
      baseAreaInfo.positionList[baseAreaInfo.positionList.length - 1]
    expect(baseLastPosition.pageNo).toBe(0)
    const remaining = PAGE_BOTTOM - baseLastPosition.coordinate.rightBottom[1]
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThan(400)
    // 补高超过当前页剩余空间 100px
    const contentHeight = getAreaContentHeight(base.getRowList())
    const minHeight = Math.round(contentHeight + remaining + 100)
    const draw = renderMain(doc(minHeight))
    // 区域内容没有被推入下一页，本页区域框填满至页底
    const areaInfo = draw.getArea().getAreaInfo().get('area-1')!
    const lastPosition = areaInfo.positionList[areaInfo.positionList.length - 1]
    expect(lastPosition.pageNo).toBe(0)
    expect(lastPosition.coordinate.rightBottom[1]).toBeCloseTo(PAGE_BOTTOM, 0)
    // 结转标记在区域末行自身，且生成空白延续页
    const carryRow = draw.getMainRowList().find(row => row.areaPaddingCarry)
    expect(carryRow?.areaPaddingCarry?.areaId).toBe('area-1')
    expect(
      carryRow!.elementList.some(el => el.areaId === 'area-1')
    ).toBeTruthy()
    const pageRowList = draw.getPageRowList()
    expect(pageRowList.length).toBe(2)
    expect(pageRowList[1].length).toBe(0)
    // 延续段位于空白页顶部，minHeight 被完整满足
    const segmentList = areaInfo.paddingSegmentList!
    expect(segmentList.length).toBe(1)
    expect(segmentList[0].pageNo).toBe(1)
    expect(segmentList[0].y).toBeCloseTo(100, 0)
    expect(segmentList[0].height).toBeCloseTo(
      carryRow!.areaPaddingCarry!.height,
      5
    )
    const totalHeight =
      PAGE_BOTTOM -
      areaInfo.positionList[0].coordinate.leftTop[1] +
      segmentList[0].height
    expect(Math.abs(totalHeight - minHeight)).toBeLessThanOrEqual(1)
  })
})
