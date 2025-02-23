import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { I18n } from '../../i18n/I18n'
import { Draw } from '../Draw'

export class PageBreakParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private i18n: I18n

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.i18n = draw.getI18n()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      pageBreak: { font, fontSize, lineDash }
    } = this.options
    const displayName = this.i18n.t('pageBreak.displayName')
    const { scale, defaultRowMargin } = this.options
    const size = fontSize * scale
    const elementWidth = element.width! * scale
    const offsetY =
      this.draw.getDefaultBasicRowMarginHeight() * defaultRowMargin
    ctx.save()
    ctx.font = `${size}px ${font}`
    const textMeasure = ctx.measureText(displayName)
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
    ctx.fillText(
      displayName,
      x + halfX,
      y + textMeasure.actualBoundingBoxAscent - size / 2
    )
    ctx.restore()
  }
}
