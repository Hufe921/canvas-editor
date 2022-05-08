import { Context2d } from 'jspdf'
import { IRowElement } from '../../editor'

export class SuperscriptParticle {

  public render(ctx: Context2d, element: IRowElement, x: number, y: number) {
    ctx.save()
    ctx.font = element.style
    if (element.color) {
      ctx.fillStyle = element.color
    }
    ctx.fillText(element.value, x, y - element.metrics.height / 2)
    ctx.restore()
  }

}