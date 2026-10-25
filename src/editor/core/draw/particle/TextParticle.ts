import { ElementType, IEditorOption, IElement, RenderMode } from '../../..'
import { PUNCTUATION_LIST } from '../../../dataset/constant/Common'
import { DeepRequired } from '../../../interface/Common'
import { IRowElement } from '../../../interface/Row'
import { ITextMetrics } from '../../../interface/Text'
import { TextMeasurer } from '../../layout/TextMeasurer'
import type { IRenderContext } from '../../render/model/RenderContext'
import { DisplayList } from '../../render/model/DisplayList'
import { buildSourceTextKey } from '../../render/svg/scene/SceneKey'
import { Draw } from '../Draw'

export interface IMeasureWordResult {
  width: number
  endElement: IElement | null
}

export class TextParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  private ctx: IRenderContext
  private curX: number
  private curY: number
  private text: string
  private curStyle: string
  private curColor?: string
  private curSourceElement?: IElement
  private sourceKeys: WeakMap<IElement, string>
  private sourceKeyId: number
  private textMeasurer: TextMeasurer

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.ctx = new DisplayList()
    this.curX = -1
    this.curY = -1
    this.text = ''
    this.curStyle = ''
    this.sourceKeys = new WeakMap()
    this.sourceKeyId = 0
    this.textMeasurer = draw.getTextMeasurer()
  }

  public measureBasisWord(
    ctx: CanvasRenderingContext2D,
    font: string
  ): ITextMetrics {
    return this.textMeasurer.measureBasis(font, ctx)
  }

  public measureWord(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[],
    curIndex: number
  ): IMeasureWordResult {
    const LETTER_REG = this.draw.getLetterReg()
    let width = 0
    let endElement: IElement | null = null
    let i = curIndex
    while (i < elementList.length) {
      const element = elementList[i]
      if (
        (element.type && element.type !== ElementType.TEXT) ||
        !LETTER_REG.test(element.value)
      ) {
        endElement = element
        break
      }
      width += this.measureText(ctx, element).width
      i++
    }
    return {
      width,
      endElement
    }
  }

  public measurePunctuationWidth(
    ctx: CanvasRenderingContext2D,
    element: IElement
  ): number {
    if (!element || !PUNCTUATION_LIST.includes(element.value)) return 0
    ctx.font = this.draw.getElementFont(element)
    return this.measureText(ctx, element).width
  }

  public measureText(
    ctx: CanvasRenderingContext2D,
    element: IElement
  ): ITextMetrics {
    return this.textMeasurer.measure(element, ctx.font, ctx)
  }

  public getBasisWordBoundingBoxAscent(
    ctx: CanvasRenderingContext2D,
    font: string
  ): number {
    return this.measureBasisWord(ctx, font).actualBoundingBoxAscent
  }

  public complete() {
    this._render()
    this.text = ''
  }

  public record(
    ctx: IRenderContext,
    element: IRowElement,
    x: number,
    y: number
  ) {
    this.ctx = ctx
    // 兼容模式立即绘制
    if (this.options.renderMode === RenderMode.COMPATIBILITY) {
      this._setCurXY(x, y)
      this.text = element.value
      this.curStyle = element.style
      this.curColor = element.color
      this.curSourceElement = element
      this.complete()
      return
    }
    // 主动完成的重设起始点
    if (!this.text) {
      this._setCurXY(x, y)
      this.curSourceElement = element
    }
    // 样式发生改变
    if (
      (this.curStyle && element.style !== this.curStyle) ||
      element.color !== this.curColor
    ) {
      this.complete()
      this._setCurXY(x, y)
      this.curSourceElement = element
    }
    this.text += element.value
    this.curStyle = element.style
    this.curColor = element.color
  }

  private _setCurXY(x: number, y: number) {
    this.curX = x
    this.curY = y
  }

  private _getSourceKey(element: IElement): string {
    let key = this.sourceKeys.get(element)
    if (!key) {
      key = buildSourceTextKey(++this.sourceKeyId)
      this.sourceKeys.set(element, key)
    }
    return key
  }

  private _render() {
    if (!this.text || !~this.curX || !~this.curY) return
    this.ctx.save()
    this.ctx.font = this.curStyle
    this.ctx.fillStyle = this.curColor || this.options.defaultColor
    if (this.curSourceElement && this.ctx.fillTextWithSource) {
      this.ctx.fillTextWithSource(this.text, this.curX, this.curY, {
        key: this._getSourceKey(this.curSourceElement)
      })
    } else {
      this.ctx.fillText(this.text, this.curX, this.curY)
    }
    this.ctx.restore()
  }
}
