import { IRowElement } from '../../../interface/Row'
import { IRenderContext } from '../../render/model/RenderContext'

export class SubscriptParticle {
  // 向下偏移字高的一半
  public getOffsetY(element: IRowElement): number {
    return element.metrics.height / 2
  }

  public render(
    ctx: IRenderContext,
    element: IRowElement,
    x: number,
    y: number,
    direction?: CanvasDirection
  ) {
    ctx.save()
    ctx.font = element.style
    if (direction) ctx.direction = direction
    if (element.color) {
      ctx.fillStyle = element.color
    }
    ctx.fillText(element.value, x, y + this.getOffsetY(element))
    ctx.restore()
  }
}
