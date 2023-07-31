import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Highlight extends AbstractRichText {
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.fillRect.width) return
    const { highlightAlpha } = this.options
    const { x, y, width, height } = this.fillRect
    ctx.save()
    ctx.globalAlpha = highlightAlpha
    ctx.fillStyle = this.fillColor!
    ctx.fillRect(x, y, width, height)
    ctx.restore()
    this.clearFillInfo()
  }
}
