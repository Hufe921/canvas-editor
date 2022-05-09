import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { DeepRequired, IEditorOption } from '../../editor'

export class Watermark {

  private pdf: Pdf
  private options: DeepRequired<IEditorOption>

  constructor(pdf: Pdf) {
    this.pdf = pdf
    this.options = <DeepRequired<IEditorOption>>pdf.getOptions()
  }

  public render(ctx: Context2d) {
    const { watermark: { data, opacity, font, size, color }, width, height } = this.options
    const x = width / 2
    const y = height / 2
    ctx.save()
    const style = ctx.font = `${size}px ${font}`
    ctx.globalAlpha = opacity
    ctx.fillStyle = color
    // 移动到中心位置再旋转
    const measureText = this.pdf.measureText(style, data)
    ctx.translate(x, y)
    ctx.rotate(-45 * Math.PI / 180)
    ctx.fillText(data, - measureText.width / 2, measureText.actualBoundingBoxAscent - size / 2)
    ctx.restore()
  }

}