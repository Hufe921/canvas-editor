import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { I18n } from '../../i18n/I18n'
import {
  drawPlainText,
  measurePlainText
} from '../../text-engine-host/drawPlainText'
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
    const style = {
      text: displayName,
      fontFamily: font,
      fontSize: size,
      color: this.options.defaultColor
    }
    const adapter = this.draw.getLayoutHostAdapter()
    ctx.save()
    ctx.translate(0, 0.5 + offsetY)
    ctx.setLineDash(lineDash)
    const metrics = measurePlainText(adapter, style)
    if (metrics) {
      const halfX = (elementWidth - metrics.width) / 2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + halfX, y)
      ctx.moveTo(x + halfX + metrics.width, y)
      ctx.lineTo(x + elementWidth, y)
      ctx.stroke()
      drawPlainText(
        adapter,
        ctx,
        style,
        x + halfX,
        y + metrics.ascent - size / 2
      )
    } else {
      ctx.font = `${size}px ${font}`
      const textMeasure = ctx.measureText(displayName)
      const halfX = (elementWidth - textMeasure.width) / 2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + halfX, y)
      ctx.moveTo(x + halfX + textMeasure.width, y)
      ctx.lineTo(x + elementWidth, y)
      ctx.stroke()
      ctx.fillText(
        displayName,
        x + halfX,
        y + textMeasure.actualBoundingBoxAscent - size / 2
      )
    }
    ctx.restore()
  }
}
