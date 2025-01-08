import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { CERenderingContext } from '../../../interface/CERenderingContext'

export class Strikeout extends AbstractRichText {
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  public render(ctx: CERenderingContext) {
    if (!this.fillRect.width) return
    const { scale, strikeoutColor } = this.options
    const { x, y, width } = this.fillRect
    const adjustY = y + 0.5 // 从1处渲染，避免线宽度等于3
    ctx.line({
      lineWidth: scale, color: strikeoutColor
    }).path(x, adjustY, x+width, adjustY).draw()
    this.clearFillInfo()
  }
}
