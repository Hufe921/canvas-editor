import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Strikeout {

  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
    const { strikeoutColor } = this.options
    ctx.save()
    ctx.strokeStyle = strikeoutColor
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.stroke()
    ctx.restore()
  }

}