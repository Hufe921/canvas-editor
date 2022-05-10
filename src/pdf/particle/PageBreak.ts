import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IEditorOption, IRowElement } from '../../editor'

export class PageBreakParticle {

  private pdf: Pdf
  static readonly font: string = 'Yahei'
  static readonly fontSize: number = 12
  static readonly displayName: string = '分页符'
  static readonly lineDash: number[] = [3, 1]

  private options: Required<IEditorOption>

  constructor(pdf: Pdf) {
    this.pdf = pdf
    this.options = pdf.getOptions()
  }

  public render(ctx: Context2d, element: IRowElement, x: number, y: number) {
    const { font, fontSize, displayName, lineDash } = PageBreakParticle
    const { defaultRowMargin, defaultBasicRowMarginHeight } = this.options
    const elementWidth = element.width!
    const offsetY = defaultBasicRowMarginHeight * defaultRowMargin
    ctx.save()
    const style = ctx.font = `${fontSize}px ${font}`
    const textMeasure = this.pdf.measureText(style, displayName)
    const halfX = (elementWidth - textMeasure.width) / 2

    // 线段
    ctx.setLineDash(lineDash)
    ctx.translate(0, 0.5 + offsetY)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + halfX, y)
    ctx.moveTo(x + halfX + textMeasure.width, y)
    ctx.lineTo(x + elementWidth, y)
    ctx.stroke()
    // 文字
    ctx.fillText(displayName, x + halfX, y + textMeasure.actualBoundingBoxAscent - fontSize / 2)
    ctx.restore()
  }

}
