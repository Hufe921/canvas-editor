import { IEditorOption } from "../../../interface/Editor"
import { Draw } from "../Draw"

export class PageNumber {

  private draw: Draw
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const { pageNumberSize, pageNumberFont, scale } = this.options
    const width = this.draw.getWidth()
    const height = this.draw.getHeight()
    const pageNumberBottom = this.draw.getPageNumberBottom()
    ctx.save()
    ctx.fillStyle = '#00000'
    ctx.font = `${pageNumberSize * scale}px ${pageNumberFont}`
    ctx.fillText(`${pageNo + 1}`, width / 2, height - pageNumberBottom)
    ctx.restore()
  }

}