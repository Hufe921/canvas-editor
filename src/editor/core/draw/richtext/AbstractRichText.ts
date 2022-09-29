import { IElementFillRect } from '../../../interface/Element'

export abstract class AbstractRichText {
  public fillRect: IElementFillRect
  public fillColor?: string

  constructor() {
    this.fillRect = this.clearFillInfo()
  }

  public clearFillInfo() {
    this.fillColor = undefined
    return this.fillRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
  }

  public recordFillInfo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height?: number, color?: string) {
    const isFirstRecord = !this.fillRect.width
    if (!isFirstRecord && this.fillColor && this.fillColor !== color) {
      this.render(ctx)
      this.clearFillInfo()
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
  }

  public abstract render(ctx: CanvasRenderingContext2D): void

}