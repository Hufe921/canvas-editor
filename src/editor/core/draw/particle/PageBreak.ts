import { IEditorOption } from "../../../interface/Editor"
import { IRowElement } from "../../../interface/Row"
import { Draw } from "../Draw"

export class PageBreakParticle {

  static readonly font: string = 'Yahei'
  static readonly fontSize: number = 12
  static readonly displayName: string = '分页符'
  static readonly lineDash: number[] = [3, 1]

  private draw: Draw
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, element: IRowElement, x: number, y: number) {
    const { font, fontSize, displayName, lineDash } = PageBreakParticle
    const { scale, defaultRowMargin } = this.options
    const size = fontSize * scale
    const elementWidth = element.width!
    const offsetY = this.draw.getDefaultBasicRowMarginHeight() * defaultRowMargin
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
    ctx.fillText(displayName, x + halfX, y + textMeasure.actualBoundingBoxAscent - size / 2)
    ctx.restore()
  }

}