import { EDITOR_PREFIX } from '../../../dataset/constant/Editor'
import { EditorMode } from '../../../dataset/enum/Editor'
import { IAreaInfo } from '../../../interface/Area'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import type { RenderPage } from '../../render/RenderBackend'

export class AreaTool {
  // 拖拽手柄高度
  private readonly BORDER_VALUE = 4
  // 区域拖拽允许的最小高度（未缩放单位）
  private readonly MIN_AREA_HEIGHT = 20

  private draw: Draw
  private canvas: RenderPage
  private options: DeepRequired<IEditorOption>
  private container: HTMLDivElement
  private toolBorder: HTMLDivElement | null
  private anchorLine: HTMLDivElement | null
  private mousedownY: number
  // 上次渲染的锚点（区域+页码+坐标），相同则不重复重建
  private lastAnchorKey: string | null

  constructor(draw: Draw) {
    this.draw = draw
    this.canvas = draw.getPage()
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    this.toolBorder = null
    this.anchorLine = null
    this.mousedownY = 0
    this.lastAnchorKey = null
  }

  public dispose() {
    this.toolBorder?.remove()
    this.toolBorder = null
    this.lastAnchorKey = null
  }

  public render() {
    const areaInfo = this.draw.getArea().getActiveAreaInfo()
    if (
      !areaInfo ||
      !areaInfo.area ||
      areaInfo.tableCell ||
      this.draw.isReadonly() ||
      this.draw.getMode() === EditorMode.FORM ||
      (areaInfo.area.hide && !this.draw.isAreaHideDisabled()) ||
      areaInfo.area.resizable === false
    ) {
      this.dispose()
      return
    }
    const { positionList } = areaInfo
    if (!positionList.length) {
      this.dispose()
      return
    }
    // 锚点未变化时不重复重建
    const { scale } = this.options
    const segmentList = areaInfo.paddingSegmentList || []
    const lastSegment = segmentList[segmentList.length - 1]
    const firstPosition = positionList[0]
    const lastPosition = positionList[positionList.length - 1]
    const areaY = Math.ceil(firstPosition.coordinate.leftTop[1])
    // 存在补高跨页结转时，区域视觉底部位于最后延续段
    const areaBottom = lastSegment
      ? Math.ceil(lastSegment.y + lastSegment.height)
      : Math.ceil(lastPosition.coordinate.rightBottom[1])
    const handlePageNo = lastSegment ? lastSegment.pageNo : lastPosition.pageNo
    const anchorKey = `${areaInfo.id}:${scale}:${areaY}:${handlePageNo}:${areaBottom}`
    if (anchorKey === this.lastAnchorKey) return
    this.dispose()
    // 区域高度为各页片段高度之和（坐标是页内相对值，跨页不能直接相减）
    let areaHeightPx = 0
    let fragmentPageNo = firstPosition.pageNo
    let fragmentStartY = firstPosition.coordinate.leftTop[1]
    let fragmentBottom = fragmentStartY
    for (const position of positionList) {
      if (position.pageNo !== fragmentPageNo) {
        areaHeightPx += fragmentBottom - fragmentStartY
        fragmentPageNo = position.pageNo
        fragmentStartY = position.coordinate.leftTop[1]
        fragmentBottom = fragmentStartY
      }
      fragmentBottom = Math.max(
        fragmentBottom,
        position.coordinate.rightBottom[1]
      )
    }
    areaHeightPx += fragmentBottom - fragmentStartY
    // 加上跨页结转的延续段高度
    for (const segment of segmentList) {
      areaHeightPx += segment.height
    }
    // 区域总高度取内容高度与最小高度的较大者
    const totalHeightPx = Math.max(
      areaHeightPx,
      (areaInfo.area.minHeight || 0) * scale
    )
    // 区域底部边框拖拽手柄（跨页区域锚定末尾片段所在页）
    const { x: pageLeft, y: pageTop } = this.draw.getPageOffset(handlePageNo)
    const border = document.createElement('div')
    border.classList.add(`${EDITOR_PREFIX}-area-tool__border`)
    border.style.left = `${this.draw.getMargins()[3] + pageLeft}px`
    border.style.top = `${areaBottom + pageTop - this.BORDER_VALUE / 2}px`
    border.style.width = `${this.draw.getInnerWidth()}px`
    border.style.height = `${this.BORDER_VALUE}px`
    border.onmousedown = evt => {
      this._mousedown(
        evt,
        areaInfo,
        totalHeightPx / scale,
        areaBottom + pageTop,
        handlePageNo
      )
    }
    this.container.append(border)
    this.toolBorder = border
    this.lastAnchorKey = anchorKey
  }

  private _mousedown(
    evt: MouseEvent,
    areaInfo: IAreaInfo,
    areaHeight: number,
    lineStartY: number,
    pageNo: number
  ) {
    // 光标与拖拽线锚定手柄所在页（跨页区域末尾片段可能不在当前活动页）
    this.canvas = this.draw.getPage(pageNo)
    const { scale } = this.options
    const { width } = this.draw.getPageSize(pageNo)
    const { x: pageLeft } = this.draw.getPageOffset(pageNo)
    this.mousedownY = evt.y
    const target = evt.target as HTMLDivElement
    // 改变光标
    const cursor = window.getComputedStyle(target).cursor
    document.body.style.cursor = cursor
    this.canvas.style.cursor = cursor
    // 拖拽线
    const anchorLine = document.createElement('div')
    anchorLine.classList.add(`${EDITOR_PREFIX}-area-anchor__line`)
    anchorLine.style.width = `${width}px`
    anchorLine.style.left = `${pageLeft}px`
    anchorLine.style.top = `${lineStartY}px`
    this.container.append(anchorLine)
    this.anchorLine = anchorLine
    // 追加全局事件
    let dy = 0
    const mousemoveFn = (evt: MouseEvent) => {
      dy = this._mousemove(evt, lineStartY)
    }
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener(
      'mouseup',
      () => {
        // dy为屏幕像素，区域度量均为未缩放单位，统一换算后计算
        let moveDy = dy / scale
        // 向上移动超出最小高度限定，则减少移动量
        if (moveDy < 0 && areaHeight + moveDy < this.MIN_AREA_HEIGHT) {
          moveDy = this.MIN_AREA_HEIGHT - areaHeight
        }
        if (moveDy) {
          areaInfo.area.minHeight = Math.round(areaHeight + moveDy)
          this.draw.render({ isSetCursor: false })
        }
        // 还原副作用
        anchorLine.remove()
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        this.canvas.style.cursor = 'text'
      },
      {
        once: true
      }
    )
    evt.preventDefault()
  }

  private _mousemove(evt: MouseEvent, startY: number): number {
    const dy = evt.y - this.mousedownY
    if (this.anchorLine) {
      this.anchorLine.style.top = `${startY + dy}px`
    }
    evt.preventDefault()
    return dy
  }
}
