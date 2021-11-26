import { IEditorOption } from "../../../interface/Editor"
import { Draw } from "../Draw"

export class Background {

  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.options
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }

}