import { Draw } from '../Draw'

export class Background {
  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const width = this.draw.getCanvasWidth(pageNo)
    const height = this.draw.getCanvasHeight(pageNo)
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }
}
