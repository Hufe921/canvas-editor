import { IRowElement } from "../../../interface/Row"
import { Draw } from "../Draw"

export class SeparatorParticle {

  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
  }

  public render(ctx: CanvasRenderingContext2D, element: IRowElement, x: number, y: number) {
    const innerWidth = this.draw.getInnerWidth()
    ctx.save()
    if (element.color) {
      ctx.strokeStyle = element.color
    }
    ctx.translate(0.5, 0.5)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + innerWidth, y)
    ctx.stroke()
    ctx.restore()
  }

}