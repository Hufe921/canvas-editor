import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { createSVGElement } from '../../../utils/svg'

export class Highlight extends AbstractRichText {

  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  public render(ctx: SVGElement) {
    if (!this.fillRect.width) return
    const { highlightAlpha } = this.options
    const { x, y, width, height } = this.fillRect
    const rect = createSVGElement('rect')
    rect.style.opacity = `${highlightAlpha}`
    rect.style.fill = this.fillColor!
    rect.setAttribute('x', `${x}`)
    rect.setAttribute('y', `${y}`)
    rect.setAttribute('width', `${width}`)
    rect.setAttribute('height', `${height}`)
    ctx.append(rect)
    this.clearFillInfo()
  }

}