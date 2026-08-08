import { TextDecorationStyle } from '../../../dataset/enum/Text'
import { IElementFillRect } from '../../../interface/Element'

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
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height?: number,
    color?: string,
    decorationStyle?: TextDecorationStyle
  ) {
    const isFirstRecord = !this.fillRect.width
    // 颜色不同时立即绘制
    if (
      !isFirstRecord &&
      (this.fillColor !== color || this.fillDecorationStyle !== decorationStyle)
    ) {
      this.render(ctx)
      this.clearFillInfo()
      // 重新记录
      this.recordFillInfo(ctx, x, y, width, height, color, decorationStyle)
      return
    }
    if (isFirstRecord) {
      this.fillRect.x = x
      this.fillRect.y = y
      if (height) this.fillRect.height = height
      this.fillRect.width = width
      this.fillColor = color
      this.fillDecorationStyle = decorationStyle
      return
    }
    // 视觉区间合并：左右相邻/重叠均可并入（兼容 RTL 逻辑序回扫）
    const curLeft = this.fillRect.x
    const curRight = this.fillRect.x + this.fillRect.width
    const nextLeft = x
    const nextRight = x + width
    const adjacent =
      nextLeft <= curRight + 1 && nextRight >= curLeft - 1
    if (!adjacent) {
      this.render(ctx)
      this.clearFillInfo()
      this.recordFillInfo(ctx, x, y, width, height, color, decorationStyle)
      return
    }
    if (height && this.fillRect.height < height) {
      this.fillRect.height = height
    }
    const mergedLeft = Math.min(curLeft, nextLeft)
    const mergedRight = Math.max(curRight, nextRight)
    this.fillRect.x = mergedLeft
    this.fillRect.width = mergedRight - mergedLeft
    this.fillColor = color
    this.fillDecorationStyle = decorationStyle
  }

  public abstract render(ctx: CanvasRenderingContext2D): void
}
