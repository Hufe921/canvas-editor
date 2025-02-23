import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'
export class SeparatorParticle {
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    ctx.save()
    const {
      scale,
      separator: { lineWidth, strokeStyle }
    } = this.options
    ctx.lineWidth = lineWidth * scale
    ctx.strokeStyle = element.color || strokeStyle
    if (element.dashArray?.length) {
      ctx.setLineDash(element.dashArray)
    }
    const offsetY = Math.round(y) // 四舍五入避免绘制模糊
    ctx.translate(0, ctx.lineWidth / 2)
    ctx.beginPath()
    ctx.moveTo(x, offsetY)
    ctx.lineTo(x + element.width! * scale, offsetY)
    ctx.stroke()
    ctx.restore()
  }
}
