import { IEditorOption } from "../../../interface/Editor"
import { Draw } from "../Draw"

export class Underline {

  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
    const { underlineColor } = this.options
    ctx.save()
    ctx.strokeStyle = underlineColor
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.stroke()
    ctx.restore()
  }

}