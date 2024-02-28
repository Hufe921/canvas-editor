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
    }
    if (height && this.fillRect.height < height) {
      this.fillRect.height = height
    }
    this.fillRect.width += width
    this.fillColor = color
    this.fillDecorationStyle = decorationStyle
  }

  public abstract render(ctx: CanvasRenderingContext2D): void
}
