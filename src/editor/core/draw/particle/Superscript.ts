import { IRowElement } from '../../../interface/Row'

export class SuperscriptParticle {
  // 向上偏移字高的一半
  public getOffsetY(element: IRowElement): number {
    return -element.metrics.height / 2
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    ctx.save()
    ctx.font = element.style
    if (element.color) {
      ctx.fillStyle = element.color
    }
    ctx.fillText(element.value, x, y + this.getOffsetY(element))
    ctx.restore()
  }
}
