import { IEditorOption } from "../../../interface/Editor"
import { Draw } from "../Draw"

export class PageNumber {

  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const { pageNumberBottom, width, height } = this.options
    ctx.save()
    ctx.fillStyle = '#00000'
    ctx.font = '12px'
    ctx.fillText(`${pageNo + 1}`, width / 2, height - pageNumberBottom)
    ctx.restore()
  }

}