import { IElement } from '../../..'
import { PUNCTUATION_LIST } from '../../../dataset/constant/Common'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class TextParticle {

  private ctx: CanvasRenderingContext2D
  private curX: number
  private curY: number
  private text: string
  private curStyle: string
  private curColor?: string
  public cacheMeasureText: Map<string, TextMetrics>

  constructor(draw: Draw) {
    this.ctx = draw.getCtx()
    this.curX = -1
    this.curY = -1
    this.text = ''
    this.curStyle = ''
    this.cacheMeasureText = new Map()
  }

  public measurePunctuationWidth(ctx: CanvasRenderingContext2D, element: IElement): number {
    if (!element || !PUNCTUATION_LIST.includes(element.value)) return 0
    return this.measureText(ctx, element).width
  }

  public measureText(ctx: CanvasRenderingContext2D, element: IElement): TextMetrics {
    const id = `${element.value}${ctx.font}`
    const cacheTextMetrics = this.cacheMeasureText.get(id)
    if (cacheTextMetrics) {
      return cacheTextMetrics
    }
    const textMetrics = ctx.measureText(element.value)
    this.cacheMeasureText.set(id, textMetrics)
    return textMetrics
  }

  public complete() {
    this._render()
    this.text = ''
  }

  public record(ctx: CanvasRenderingContext2D, element: IRowElement, x: number, y: number) {
    this.ctx = ctx
    // 主动完成的重设起始点
    if (!this.text) {
      this._setCurXY(x, y)
    }
    // 样式发生改变
    if (
      (this.curStyle && element.style !== this.curStyle) ||
      (element.color !== this.curColor)
    ) {
      this.complete()
      this._setCurXY(x, y)
    }
    this.text += element.value
    this.curStyle = element.style
    this.curColor = element.color
  }

  private _setCurXY(x: number, y: number) {
    this.curX = x
    this.curY = y
  }

  private _render() {
    if (!this.text || !~this.curX || !~this.curX) return
    this.ctx.save()
    this.ctx.font = this.curStyle
    if (this.curColor) {
      this.ctx.fillStyle = this.curColor
    }
    this.ctx.fillText(this.text, this.curX, this.curY)
    this.ctx.restore()
  }

}