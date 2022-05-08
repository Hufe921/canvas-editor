import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption, IElement } from '../../editor'

export class ImageParticle {

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, element: IElement, x: number, y: number) {
    const { scale } = this.options
    const width = element.width! * scale
    const height = element.height! * scale
    ctx.drawImage(element.value, x, y, width, height)
  }

}