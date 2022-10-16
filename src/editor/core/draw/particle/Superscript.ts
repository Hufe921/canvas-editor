import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { createSVGElement } from '../../../utils/svg'
import { Draw } from '../Draw'

export class SuperscriptParticle {

  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: SVGElement, element: IRowElement, x: number, y: number) {
    const text = createSVGElement('text')
    const { scale } = this.options
    const { italic, bold, actualSize, color, value } = element
    if (italic) {
      text.style.fontStyle = 'italic'
    }
    if (bold) {
      text.style.fontWeight = 'bold'
    }
    if (actualSize) {
      text.style.fontSize = `${actualSize * scale}px`
    }
    if (color) {
      text.style.fill = color
    }
    if (element.color) {
      text.style.fill = element.color
    }
    text.setAttribute('x', `${x}`)
    text.setAttribute('y', `${y - element.metrics.height / 2}`)
    text.append(document.createTextNode(value))
    ctx.append(text)
  }

}