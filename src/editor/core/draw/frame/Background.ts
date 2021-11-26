export class Background {

  public render(ctx: CanvasRenderingContext2D, canvasRect: DOMRect) {
    const { width, height } = canvasRect
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }

}