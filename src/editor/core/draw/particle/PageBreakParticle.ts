import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { I18n } from '../../i18n/I18n'
import { Draw } from '../Draw'
import { CERenderingContext, FontProperty, LineProperty } from '../../../interface/CERenderingContext'

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
    ctx: CERenderingContext,
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
    const textMeasure = ctx.measureText(displayName, {
      font, size
    })
    const halfX = (elementWidth - textMeasure.width) / 2
    // 线段
    const lineProp: LineProperty = {
      lineDash
    }
    ctx.line(lineProp)
      .beforeDraw(c=>c.translate(0, 0.5 + offsetY))
      .path(x,y, x + halfX, y)
      .path(x + halfX + textMeasure.width, y,x + elementWidth, y)
      .draw()
    // 文字
    const fontProp: FontProperty = {
      font, size, translate: [0, 0.5 + offsetY]
    }
    ctx.text(displayName, x + halfX, y + textMeasure.actualBoundingBoxAscent - size / 2, fontProp)
  }
}
