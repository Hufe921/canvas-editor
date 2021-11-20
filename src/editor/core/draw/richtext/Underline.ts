import { IEditorOption } from "../../../interface/Editor"

export class Underline {

  private ctx: CanvasRenderingContext2D
  private options: Required<IEditorOption>

  constructor(ctx: CanvasRenderingContext2D, options: Required<IEditorOption>) {
    this.ctx = ctx
    this.options = options
  }

  render(x: number, y: number, width: number) {
    const { underlineColor } = this.options
    this.ctx.save()
    this.ctx.strokeStyle = underlineColor
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x + width, y)
    this.ctx.stroke()
    this.ctx.restore()
  }

}