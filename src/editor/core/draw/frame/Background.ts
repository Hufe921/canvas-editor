import { Draw } from '../Draw'

export class Background {
  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
  }

  public render(ctx: CanvasRenderingContext2D) {
    const width = this.draw.getOriginalWidth()
    const height = this.draw.getOriginalHeight()
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }
}
