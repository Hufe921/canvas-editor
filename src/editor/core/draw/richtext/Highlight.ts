import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { CERenderingContext } from '../../../interface/CERenderingContext'

export class Highlight extends AbstractRichText {
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  public render(ctx: CERenderingContext) {
    if (!this.fillRect.width) return
    const { highlightAlpha } = this.options
    const { x, y, width, height } = this.fillRect
    ctx.fillRect(x, y, width, height,  { fillColor: this.fillColor, alpha: highlightAlpha})
    this.clearFillInfo()
  }
}
