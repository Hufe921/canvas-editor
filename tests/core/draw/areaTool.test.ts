import { describe, it, expect } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IElement } from '@/editor/interface/Element'

const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}

function renderMain(main: IElement[]): {
  draw: Draw
  container: HTMLDivElement
} {
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
  return { draw, container }
}

function makeAreaDoc(): IElement[] {
  return [
    {
      type: ElementType.AREA,
      value: '',
      areaId: 'area-1',
      area: {
        borderColor: '#000000'
      },
      valueList: [{ value: '区域内容\n' }]
    },
    { value: '区域外文字\n' }
  ]
}

function dragBorder(border: HTMLDivElement, dy: number) {
  border.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, clientY: 100 })
  )
  document.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: true, clientY: 100 + dy })
  )
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
}

describe('区域工具', () => {
  it('光标位于区域内时渲染底部拖拽手柄，离开时销毁', () => {
    const { draw, container } = renderMain(makeAreaDoc())
    const areaTool = draw.getAreaTool()
    // 光标在区域内（首个元素为区域前的补偿换行符，区域内容从索引 1 开始）
    draw.getRange().setRange(1, 1)
    areaTool.render()
    expect(container.querySelector('.ce-area-tool__border')).not.toBeNull()
    // 光标移出区域
    const elementList = draw.getElementList()
    draw.getRange().setRange(elementList.length - 1, elementList.length - 1)
    areaTool.render()
    expect(container.querySelector('.ce-area-tool__border')).toBeNull()
  })

  it('拖拽手柄向下拖动增大区域最小高度', () => {
    const { draw, container } = renderMain(makeAreaDoc())
    const areaTool = draw.getAreaTool()
    draw.getRange().setRange(1, 1)
    areaTool.render()
    const border = container.querySelector<HTMLDivElement>(
      '.ce-area-tool__border'
    )!
    expect(border).not.toBeNull()
    // 区域原始视觉高度
    const areaInfo = draw.getArea().getAreaInfo().get('area-1')!
    const positionList = areaInfo.positionList
    const originHeight =
      positionList[positionList.length - 1].coordinate.rightBottom[1] -
      positionList[0].coordinate.leftTop[1]
    // 向下拖拽 50px（scale 为 1）
    dragBorder(border, 50)
    expect(areaInfo.area.minHeight).toBe(Math.round(originHeight + 50))
    // 重绘后区域视觉高度增大
    const newPositionList = draw
      .getArea()
      .getAreaInfo()
      .get('area-1')!.positionList
    const newHeight =
      newPositionList[newPositionList.length - 1].coordinate.rightBottom[1] -
      newPositionList[0].coordinate.leftTop[1]
    expect(newHeight).toBeGreaterThan(originHeight)
  })

  it('向上拖拽不超过允许的最小高度', () => {
    const { draw, container } = renderMain(makeAreaDoc())
    const areaTool = draw.getAreaTool()
    draw.getRange().setRange(1, 1)
    areaTool.render()
    const border = container.querySelector<HTMLDivElement>(
      '.ce-area-tool__border'
    )!
    // 向上拖拽超出内容高度：被最小高度钳制
    dragBorder(border, -9999)
    const areaInfo = draw.getArea().getAreaInfo().get('area-1')!
    expect(areaInfo.area.minHeight).toBe(20)
  })

  it('跨页区域拖拽按各页片段高度累加计算', () => {
    // 构造跨页区域（内容超过一页可用高度）
    const valueList: IElement[] = []
    for (let i = 0; i < 60; i++) {
      valueList.push({ value: `区域第${i}行内容\n` })
    }
    const { draw, container } = renderMain([
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'area-1',
        area: { borderColor: '#000000' },
        valueList
      },
      { value: '区域外文字\n' }
    ])
    const areaTool = draw.getAreaTool()
    draw.getRange().setRange(1, 1)
    areaTool.render()
    const border = container.querySelector<HTMLDivElement>(
      '.ce-area-tool__border'
    )!
    expect(border).not.toBeNull()
    const areaInfo = draw.getArea().getAreaInfo().get('area-1')!
    const positionList = areaInfo.positionList
    // 确认确实跨页
    const firstPageNo = positionList[0].pageNo
    const lastPageNo = positionList[positionList.length - 1].pageNo
    expect(lastPageNo).toBeGreaterThan(firstPageNo)
    // 区域总高度 = 各页片段（页内底部 - 页内顶部）之和
    let totalHeight = 0
    let curPageNo = firstPageNo
    let fragmentTop = positionList[0].coordinate.leftTop[1]
    let fragmentBottom = fragmentTop
    for (const position of positionList) {
      if (position.pageNo !== curPageNo) {
        totalHeight += fragmentBottom - fragmentTop
        curPageNo = position.pageNo
        fragmentTop = position.coordinate.leftTop[1]
        fragmentBottom = fragmentTop
      }
      fragmentBottom = Math.max(
        fragmentBottom,
        position.coordinate.rightBottom[1]
      )
    }
    totalHeight += fragmentBottom - fragmentTop
    // 手柄应位于末尾片段所在页底部
    const pageTop = draw.getPageOffset(lastPageNo).y
    expect(Number(border.style.top.replace('px', ''))).toBeCloseTo(
      positionList[positionList.length - 1].coordinate.rightBottom[1] +
        pageTop -
        2
    )
    // 向下拖拽 30px：minHeight 基于跨页总高度累加
    dragBorder(border, 30)
    expect(areaInfo.area.minHeight).toBe(Math.round(totalHeight + 30))
  })

  it('补高跨页结转时拖拽手柄锚定延续段底部', () => {
    // 页高 1123、下边距 100 => 正文底部界限 y = 1023
    // 用两次渲染的区域顶部差值测量填充行高
    const probeAreaTop = (filler: number) => {
      const { draw } = renderMain([
        { value: '充\n'.repeat(filler) },
        {
          type: ElementType.AREA,
          value: '',
          areaId: 'area-1',
          area: { borderColor: '#000000' },
          valueList: [{ value: '区域内容\n' }]
        }
      ])
      return draw
        .getPosition()
        .getPositionList()
        .find(p => p.value === '区')!.coordinate.leftTop[1]
    }
    const rowHeight = (probeAreaTop(13) - probeAreaTop(3)) / 10
    // 构造填充行数，使区域末行距页底仅剩约 200px
    const fillerCount = Math.max(1, Math.round((923 - 200 - 64) / rowHeight))
    const makeDoc = (minHeight?: number): IElement[] => [
      { value: '充\n'.repeat(fillerCount) },
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'area-1',
        area: {
          borderColor: '#000000',
          ...(minHeight ? { minHeight } : {})
        },
        valueList: [{ value: '区域内容\n' }]
      },
      { value: '区域外文字\n' }
    ]
    // 测量当前页剩余空间，令 minHeight 超出剩余空间 100px（触发跨页结转）
    const { draw: base } = renderMain(makeDoc())
    const baseAreaInfo = base.getArea().getAreaInfo().get('area-1')!
    const baseLastPosition =
      baseAreaInfo.positionList[baseAreaInfo.positionList.length - 1]
    expect(baseLastPosition.pageNo).toBe(0)
    const remaining = 1023 - baseLastPosition.coordinate.rightBottom[1]
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThan(400)
    const baseContentHeight =
      baseLastPosition.coordinate.rightBottom[1] -
      baseAreaInfo.positionList[0].coordinate.leftTop[1]
    const minHeight = Math.round(baseContentHeight + remaining + 100)
    const { draw, container } = renderMain(makeDoc(minHeight))
    // 区域内容留在第一页并填满页底
    const areaInfo = draw.getArea().getAreaInfo().get('area-1')!
    const lastPosition =
      areaInfo.positionList[areaInfo.positionList.length - 1]
    expect(lastPosition.pageNo).toBe(0)
    expect(lastPosition.coordinate.rightBottom[1]).toBeCloseTo(1023, 0)
    // 剩余补高结转至下一页形成延续段
    const segmentList = areaInfo.paddingSegmentList!
    expect(segmentList.length).toBe(1)
    const segment = segmentList[0]
    expect(segment.pageNo).toBe(1)
    // 渲染拖拽手柄：锚定下一页延续段底部
    const areaTool = draw.getAreaTool()
    const areaElementIndex = draw
      .getElementList()
      .findIndex(el => el.areaId === 'area-1')
    draw.getRange().setRange(areaElementIndex, areaElementIndex)
    areaTool.render()
    const border = container.querySelector<HTMLDivElement>(
      '.ce-area-tool__border'
    )!
    expect(border).not.toBeNull()
    const pageTop = draw.getPageOffset(1).y
    expect(Number(border.style.top.replace('px', ''))).toBeCloseTo(
      Math.ceil(segment.y + segment.height) + pageTop - 2,
      0
    )
    // 向下拖拽 30px：minHeight 在原最小高度基础上累加
    dragBorder(border, 30)
    expect(draw.getArea().getAreaInfo().get('area-1')!.area.minHeight).toBe(
      minHeight + 30
    )
  })

  it('配置 resizable 为 false 时不渲染拖拽手柄', () => {
    const { draw, container } = renderMain([
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'area-1',
        area: {
          borderColor: '#000000',
          resizable: false
        },
        valueList: [{ value: '区域内容\n' }]
      },
      { value: '区域外文字\n' }
    ])
    const areaTool = draw.getAreaTool()
    draw.getRange().setRange(1, 1)
    areaTool.render()
    expect(container.querySelector('.ce-area-tool__border')).toBeNull()
  })

  it('区域位于文档末尾时拖拽手柄锚定空白延续页', () => {
    // 页高 1123、下边距 100 => 正文底部界限 y = 1023
    const probeAreaTop = (filler: number) => {
      const { draw } = renderMain([
        { value: '充\n'.repeat(filler) },
        {
          type: ElementType.AREA,
          value: '',
          areaId: 'area-1',
          area: { backgroundColor: '#f0f0f0' },
          valueList: [{ value: 'hufe' }]
        }
      ])
      return draw
        .getPosition()
        .getPositionList()
        .find(p => p.value === 'h')!
        .coordinate.leftTop[1]
    }
    const rowHeight = (probeAreaTop(13) - probeAreaTop(3)) / 10
    // 构造填充行数，使区域末行距页底仅剩约 200px
    const fillerCount = Math.max(1, Math.round((923 - 200 - 64) / rowHeight))
    // 区域为文档最后一个元素（复刻 demo mock 场景）
    const makeDoc = (minHeight?: number): IElement[] => [
      { value: '充\n'.repeat(fillerCount) },
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'area-1',
        area: {
          backgroundColor: '#f0f0f0',
          ...(minHeight ? { minHeight } : {})
        },
        valueList: [{ value: 'hufe' }]
      }
    ]
    // 测量当前页剩余空间，令 minHeight 超出剩余空间 100px
    const { draw: base } = renderMain(makeDoc())
    const baseAreaInfo = base.getArea().getAreaInfo().get('area-1')!
    const baseLastPosition =
      baseAreaInfo.positionList[baseAreaInfo.positionList.length - 1]
    expect(baseLastPosition.pageNo).toBe(0)
    const remaining = 1023 - baseLastPosition.coordinate.rightBottom[1]
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThan(400)
    const baseContentHeight =
      baseLastPosition.coordinate.rightBottom[1] -
      baseAreaInfo.positionList[0].coordinate.leftTop[1]
    const minHeight = Math.round(baseContentHeight + remaining + 100)
    const { draw, container } = renderMain(makeDoc(minHeight))
    // 生成空白延续页，结转段位于其顶部
    const areaInfo = draw.getArea().getAreaInfo().get('area-1')!
    expect(draw.getPageRowList().length).toBe(2)
    const segmentList = areaInfo.paddingSegmentList!
    expect(segmentList.length).toBe(1)
    const segment = segmentList[0]
    expect(segment.pageNo).toBe(1)
    // 渲染拖拽手柄：锚定空白延续页的延续段底部
    const areaTool = draw.getAreaTool()
    const areaElementIndex = draw
      .getElementList()
      .findIndex(el => el.areaId === 'area-1')
    draw.getRange().setRange(areaElementIndex, areaElementIndex)
    areaTool.render()
    const border = container.querySelector<HTMLDivElement>(
      '.ce-area-tool__border'
    )!
    expect(border).not.toBeNull()
    const pageTop = draw.getPageOffset(1).y
    expect(Number(border.style.top.replace('px', ''))).toBeCloseTo(
      Math.ceil(segment.y + segment.height) + pageTop - 2,
      0
    )
    // 向下拖拽 30px：minHeight 在原最小高度基础上累加
    dragBorder(border, 30)
    expect(draw.getArea().getAreaInfo().get('area-1')!.area.minHeight).toBe(
      minHeight + 30
    )
  })
})
