import { IEditorOption, IElement } from '../../..'
import { DeepRequired } from '../../../interface/Common'
import { IRowElement } from '../../../interface/Row'
import { createSVGElement } from '../../../utils/svg'
import { Draw } from '../Draw'

export class TextParticle {

  private options: DeepRequired<IEditorOption>
  private ctx: SVGElement
  private curX: number
  private curY: number
  private text: string
  private curStyle: string
  private curElement?: IElement | null
  public cacheMeasureText: Map<string, TextMetrics>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
    this.ctx = draw.getCtx()
    this.curX = -1
    this.curY = -1
    this.text = ''
    this.curStyle = ''
    this.curElement = null
    this.cacheMeasureText = new Map()
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

  public record(ctx: SVGElement, element: IRowElement, x: number, y: number) {
    this.ctx = ctx
    // 主动完成的重设起始点
    if (!this.text) {
      this._setCurXY(x, y)
    }
    // 样式发生改变
    if (
      (this.curStyle && element.style !== this.curStyle) ||
      (element.color !== this.curElement?.color)
    ) {
      this.complete()
      this._setCurXY(x, y)
    }
    this.text += element.value
    this.curStyle = element.style
    this.curElement = element
  }

  private _setCurXY(x: number, y: number) {
    this.curX = x
    this.curY = y
  }

  private _render() {
    if (!this.text || !~this.curX || !~this.curX || !this.curElement) return
    const text = createSVGElement('text')
    const { scale } = this.options
    const { italic, bold, size, color } = this.curElement
    if (italic) {
      text.style.fontStyle = 'italic'
    }
    if (bold) {
      text.style.fontWeight = 'bold'
    }
    if (size) {
      text.style.fontSize = `${size * scale}px`
    }
    if (color) {
      text.style.fill = color
    }
    text.setAttribute('x', `${this.curX}`)
    text.setAttribute('y', `${this.curY}`)
    text.append(document.createTextNode(this.text))
    this.ctx.append(text)
  }

}