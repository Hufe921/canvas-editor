import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class CheckboxParticle {

  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, element: IRowElement, x: number, y: number) {
    const { checkbox: { gap } } = this.options
    const { metrics } = element
    ctx.rect(x + gap, y - metrics.height, metrics.width - gap * 2, metrics.height)
    ctx.stroke()
  }

}