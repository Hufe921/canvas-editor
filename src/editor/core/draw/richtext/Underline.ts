import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Underline extends AbstractRichText {
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.fillRect.width) return
    const { underlineColor } = this.options
    const { x, y, width } = this.fillRect
    ctx.save()
    ctx.strokeStyle = this.fillColor || underlineColor
    const adjustY = Math.floor(y + 2 * ctx.lineWidth) + 0.5 // +0.5从1处渲染，避免线宽度等于3
    ctx.beginPath()
    ctx.moveTo(x, adjustY)
    ctx.lineTo(x + width, adjustY)
    ctx.stroke()
    ctx.restore()
    this.clearFillInfo()
  }
}
