import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { DeepRequired, IEditorOption } from '../../editor'

export class Header {

  private options: DeepRequired<IEditorOption>

  constructor(pdf: Pdf) {
    this.options = <DeepRequired<IEditorOption>>pdf.getOptions()
  }

  public render(ctx: Context2d) {
    const { header: { data, size, color, font }, scale, width, headerTop } = this.options
    if (!data) return
    ctx.save()
    ctx.fillStyle = color
    ctx.font = `${size! * scale}px ${font}`
    // 文字长度
    // const textWidth = ctx.measureText(`${data}`).width
    const textWidth = size
    // 偏移量
    const left = (width - textWidth) / 2
    ctx.fillText(`${data}`, left < 0 ? 0 : left, headerTop)
    ctx.restore()
  }

}