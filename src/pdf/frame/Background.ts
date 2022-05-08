import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption } from '../../editor'

export class Background {

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d) {
    const { width, height } = this.options
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }

}