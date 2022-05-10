import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption, IRowElement } from '../../editor'

export class HyperlinkParticle {

  private pdf: Pdf
  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.pdf = pdf
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, element: IRowElement, x: number, y: number) {
    const doc = this.pdf.getDoc()
    ctx.save()
    ctx.font = element.style
    if (!element.color) {
      element.color = this.options.defaultHyperlinkColor
    }
    ctx.fillStyle = element.color
    if (element.underline === undefined) {
      element.underline = true
    }
    doc.textWithLink(element.value, x, y, {
      url: element.url
    })
    ctx.restore()
  }

}