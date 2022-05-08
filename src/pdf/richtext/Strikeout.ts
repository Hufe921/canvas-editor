import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption } from '../../editor'

export class Strikeout {

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, x: number, y: number, width: number) {
    const { strikeoutColor } = this.options
    ctx.save()
    ctx.strokeStyle = strikeoutColor
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.stroke()
    ctx.restore()
  }

}