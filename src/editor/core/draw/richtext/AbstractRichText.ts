import { TextDecorationStyle } from '../../../dataset/enum/Text'
import { IElementFillRect } from '../../../interface/Element'
import type { IRenderContext } from '../../render/model/RenderContext'

export abstract class AbstractRichText {
  protected fillRect: IElementFillRect
  protected fillColor?: string
  protected fillDecorationStyle?: TextDecorationStyle

  constructor() {
    this.fillRect = this.clearFillInfo()
  }

  public clearFillInfo() {
    this.fillColor = undefined
    this.fillDecorationStyle = undefined
    this.fillRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
    return this.fillRect
  }

  public recordFillInfo(
    ctx: IRenderContext,
    x: number,
    y: number,
    width: number,
    height?: number,
    color?: string,
    decorationStyle?: TextDecorationStyle,
    isVisual = false
  ) {
    let isFirstRecord = !this.fillRect.width
    if (!isFirstRecord) {
      const isStyleChanged =
        this.fillColor !== color ||
        this.fillDecorationStyle !== decorationStyle
      // 方向文本按逻辑顺序记录，坐标可能倒退；视觉不相交时分段绘制
      const isDisjoint =
        isVisual &&
        (Math.abs(this.fillRect.y - y) >= 1 ||
          x > this.fillRect.x + this.fillRect.width + 0.5 ||
          x + width < this.fillRect.x - 0.5)
      if (isStyleChanged || isDisjoint) {
        this.render(ctx)
        this.clearFillInfo()
        isFirstRecord = true
      }
    }
    if (isFirstRecord) {
      this.fillRect.x = x
      this.fillRect.y = y
    }
    if (height && this.fillRect.height < height) {
      this.fillRect.height = height
    }
    if (isVisual) {
      const right = Math.max(
        this.fillRect.x + this.fillRect.width,
        x + width
      )
      this.fillRect.x = Math.min(this.fillRect.x, x)
      this.fillRect.width = right - this.fillRect.x
    } else {
      this.fillRect.width += width
    }
    this.fillColor = color
    this.fillDecorationStyle = decorationStyle
  }

  public abstract render(ctx: IRenderContext): void
}
