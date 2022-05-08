import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption, IRowElement } from '../../editor'

export class HyperlinkParticle {

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, element: IRowElement, x: number, y: number) {
    ctx.save()
    ctx.font = element.style
    if (!element.color) {
      element.color = this.options.defaultHyperlinkColor
    }
    ctx.fillStyle = element.color
    if (element.underline === undefined) {
      element.underline = true
    }
    ctx.fillText(element.value, x, y)
    ctx.restore()
  }

}