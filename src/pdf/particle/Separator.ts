import { Context2d } from 'jspdf'
import { IRowElement } from '../../editor'
export class SeparatorParticle {

  public render(ctx: Context2d, element: IRowElement, x: number, y: number) {
    ctx.save()
    if (element.color) {
      ctx.strokeStyle = element.color
    }
    if (element.dashArray && element.dashArray.length) {
      ctx.setLineDash(element.dashArray)
    }
    ctx.translate(0, 0.5) // 从1处渲染，避免线宽度等于3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + element.width!, y)
    ctx.stroke()
    ctx.restore()
  }

}