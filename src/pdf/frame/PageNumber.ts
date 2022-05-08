import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption } from '../../editor'

export class PageNumber {

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, pageNo: number) {
    const { pageNumberSize, pageNumberFont, scale, width, height, pageNumberBottom } = this.options
    ctx.save()
    ctx.fillStyle = '#00000'
    ctx.font = `${pageNumberSize * scale}px ${pageNumberFont}`
    ctx.fillText(`${pageNo + 1}`, width / 2, height - pageNumberBottom)
    ctx.restore()
  }

}