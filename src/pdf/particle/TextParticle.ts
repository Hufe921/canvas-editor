import { Context2d } from 'jspdf'
import { Pdf } from '..'
import { IElement, IRowElement } from '../../editor'

export class TextParticle {

  private pdf: Pdf
  private ctx: Context2d | null
  private curX: number
  private curY: number
  private text: string
  private curStyle: string
  private curColor?: string
  public cacheMeasureText: Map<string, TextMetrics>

  constructor(pdf: Pdf) {
    this.pdf = pdf
    this.ctx = null
    this.curX = -1
    this.curY = -1
    this.text = ''
    this.curStyle = ''
    this.cacheMeasureText = new Map()
  }

  public measureText(element: IElement): TextMetrics {
    const font = this.pdf.getFont(element)
    const value = element.value === `\n` ? '' : element.value
    const id = `${element.value}${font}`
    const cacheTextMetrics = this.cacheMeasureText.get(id)
    if (cacheTextMetrics) {
      return cacheTextMetrics
    }
    const textMetrics = this.pdf.measureText(font, value)
    this.cacheMeasureText.set(id, textMetrics)
    return textMetrics
  }

  public complete() {
    this._render()
    this.text = ''
  }

  public record(ctx: Context2d, element: IRowElement, x: number, y: number) {
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
    if (!this.text || !~this.curX || !~this.curX || !this.ctx) return
    const text = this.text.replace(/\n/g, '')
    this.ctx.save()
    this.ctx.font = this.curStyle
    if (this.curColor) {
      this.ctx.fillStyle = this.curColor
    }
    this.ctx.fillText(text, this.curX, this.curY)
    this.ctx.restore()
  }

}