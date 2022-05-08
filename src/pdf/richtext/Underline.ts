import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption } from '../../editor'

export class Underline {

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, color: string, x: number, y: number, width: number) {
    const { underlineColor } = this.options
    ctx.save()
    ctx.strokeStyle = color || underlineColor
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.stroke()
    ctx.restore()
  }

}