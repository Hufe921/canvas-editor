import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class WhiteSpaceParticle {
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
    const {
      scale,
      whiteSpace: { color, radius }
    } = this.options
    const metrics = element.metrics
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x + metrics.width / 2, y, radius * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()
    ctx.restore()
  }
}
