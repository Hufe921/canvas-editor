import { IAreaBadge, IBadge } from '../../../interface/Badge'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import type { IRenderContext } from '../../render/model/RenderContext'
import { Draw } from '../Draw'

export class Badge {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private imageCache: Map<string, HTMLImageElement>
  private pendingImageMap: Map<string, { renderCount: number }>
  private mainBadge: IBadge | null
  private areaBadgeMap: Map<string, IBadge>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.imageCache = new Map()
    this.pendingImageMap = new Map()
    this.mainBadge = null
    this.areaBadgeMap = new Map()
  }

  public setMainBadge(payload: IBadge | null) {
    this.mainBadge = payload
  }

  public setAreaBadgeMap(payload: IAreaBadge[]) {
    this.areaBadgeMap.clear()
    payload.forEach(areaBadge => {
      this.areaBadgeMap.set(areaBadge.areaId, areaBadge.badge)
    })
  }

  private _drawImage(
    ctx: IRenderContext,
    x: number,
    y: number,
    width: number,
    height: number,
    value: string
  ) {
    if (this.imageCache.has(value)) {
      const img = this.imageCache.get(value)!
      ctx.drawImage(img, x, y, width, height)
    } else {
      const renderCount = this.draw.getRenderCount()
      const pending = this.pendingImageMap.get(value)
      if (pending) {
        pending.renderCount = renderCount
        return
      }
      const request = { renderCount }
      this.pendingImageMap.set(value, request)
      const img = new Image()
      img.setAttribute('crossOrigin', 'Anonymous')
      img.src = value
      img.onload = () => {
        this.imageCache.set(value, img)
        this.pendingImageMap.delete(value)
        if (request.renderCount !== this.draw.getRenderCount()) return
        this.draw.render({
          isCompute: false,
          isSetCursor: false,
          isSubmitHistory: false
        })
      }
    }
  }

  public render(ctx: IRenderContext, pageNo: number) {
    // 文档签章
    if (pageNo === 0 && this.mainBadge) {
      const { scale, badge } = this.options
      const { left, top, width, height, value } = this.mainBadge
      // 默认从页眉下开始
      const headerTop =
        this.draw.getMargins()[0] + this.draw.getHeader().getExtraHeight()
      const x = (left || badge.left) * scale
      const y = (top || badge.top) * scale + headerTop
      this._drawImage(ctx, x, y, width * scale, height * scale, value)
    }
    // 区域签章
    if (this.areaBadgeMap.size) {
      const areaInfo = this.draw.getArea().getAreaInfo()
      if (areaInfo.size) {
        const { scale, badge } = this.options
        for (const areaItem of areaInfo) {
          // 忽略非本页区域
          const { positionList } = areaItem[1]
          const firstPosition = positionList[0]
          if (firstPosition.pageNo !== pageNo) continue
          // 忽略未设置签章区域
          const badgeItem = this.areaBadgeMap.get(areaItem[0])
          if (!badgeItem) continue
          const { left, top, width, height, value } = badgeItem
          const x = (left || badge.left) * scale
          const y =
            (top || badge.top) * scale + firstPosition.coordinate.leftTop[1]
          this._drawImage(ctx, x, y, width * scale, height * scale, value)
        }
      }
    }
  }
}
