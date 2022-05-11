import { Context2d, GState } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption } from '../../editor'

export class Highlight {

  private pdf: Pdf
  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.pdf = pdf
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, color: string, x: number, y: number, width: number, height: number) {
    const { highlightAlpha } = this.options
    const doc = this.pdf.getDoc()
    ctx.save()
    doc.setGState(new GState({
      opacity: highlightAlpha
    }))
    ctx.globalAlpha = highlightAlpha
    ctx.fillStyle = color
    ctx.fillRect(x, y, width, height)
    doc.setGState(new GState({
      opacity: 1
    }))
    ctx.restore()
  }

}