import { IEditorOption } from "../../interface/Editor"

export class Highlight {

  private ctx: CanvasRenderingContext2D
  private options: Required<IEditorOption>

  constructor(ctx: CanvasRenderingContext2D, options: Required<IEditorOption>) {
    this.ctx = ctx
    this.options = options
  }

  render(color: string, x: number, y: number, width: number, height: number) {
    const { highlightAlpha } = this.options
    this.ctx.save()
    this.ctx.globalAlpha = highlightAlpha
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, width, height)
    this.ctx.restore()
  }

}