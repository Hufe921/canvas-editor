import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Background {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const { backgroundColor } = this.options
    const width = this.draw.getCanvasWidth(pageNo)
    const height = this.draw.getCanvasHeight(pageNo)
    ctx.save()
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }
}
