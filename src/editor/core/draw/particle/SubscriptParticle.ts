import { IRowElement } from '../../../interface/Row'
import { CERenderingContext } from '../../../interface/CERenderingContext'

export class SubscriptParticle {
  // 向下偏移字高的一半
  public getOffsetY(element: IRowElement): number {
    return element.metrics.height / 2
  }

  public render(
    ctx: CERenderingContext,
    element: IRowElement,
    x: number,
    y: number
  ) {
    ctx.text(element.value, x, y + this.getOffsetY(element), {
      font: element.style, color: element.color
    })
  }
}
