import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption } from '../../editor'

export class Highlight {

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, color: string, x: number, y: number, width: number, height: number) {
    const { highlightAlpha } = this.options
    ctx.save()
    ctx.globalAlpha = highlightAlpha
    ctx.fillStyle = color
    ctx.fillRect(x, y, width, height)
    ctx.restore()
  }

}