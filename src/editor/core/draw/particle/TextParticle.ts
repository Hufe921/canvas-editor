import { ElementType, IEditorOption, IElement } from '../../..'
import { PUNCTUATION_LIST } from '../../../dataset/constant/Common'
import { DeepRequired } from '../../../interface/Common'
import { IRowElement } from '../../../interface/Row'
import { ITextMetrics } from '../../../interface/Text'
import { Draw } from '../Draw'

export interface IMeasureWordResult {
  width: number
  endElement: IElement
}

export class TextParticle {
  private textArr: { value: string; X: number, Y: number, style: string, color: string }[]
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private ctx: CanvasRenderingContext2D
  public cacheMeasureText: Map<string, TextMetrics>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.ctx = draw.getCtx()
    this.textArr = []
    this.cacheMeasureText = new Map()
  }

  public measureWord(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[],
    curIndex: number
  ): IMeasureWordResult {
    const LETTER_REG = this.draw.getLetterReg()
    let width = 0
    let endElement: IElement = elementList[curIndex]
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
    return this.measureText(ctx, element).width
  }

  public measureText(
    ctx: CanvasRenderingContext2D,
    element: IElement
  ): ITextMetrics {
    // 优先使用自定义字宽设置
    if (element.width) {
      const textMetrics = ctx.measureText(element.value)
      // TextMetrics是类无法解构
      return {
        width: element.width,
        actualBoundingBoxAscent: textMetrics.actualBoundingBoxAscent,
        actualBoundingBoxDescent: textMetrics.actualBoundingBoxDescent,
        actualBoundingBoxLeft: textMetrics.actualBoundingBoxLeft,
        actualBoundingBoxRight: textMetrics.actualBoundingBoxRight,
        fontBoundingBoxAscent: textMetrics.fontBoundingBoxAscent,
        fontBoundingBoxDescent: textMetrics.fontBoundingBoxDescent
      }
    }
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
    this.textArr = []
  }

  public record(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    this.ctx = ctx
    // 主动完成的重设起始点
    if (!this.textArr.length) {
      this.textArr.push({
        value: '',
        X:x,
        Y:y,
        style: '',
        color:''
      })
    }
    let lastTextDes =  this.textArr[this.textArr.length-1]
    // 样式发生改变
    if (
      (lastTextDes.style && element.style !== lastTextDes.style) ||
      element.color !== lastTextDes.color
    ) {
      lastTextDes = {
        value: '',
        X:x,
        Y:y,
        style: '',
        color:''
      }
      this.textArr.push(lastTextDes)
    }
    lastTextDes.value += element.value
    lastTextDes.style = element.style
    lastTextDes.color = element.color
  }


  private _render() {
    if (!this.textArr.length ) return
    for(const item of this.textArr){
      if(!item.value || !~item.X || !~item.Y) continue
      this.ctx.save()
      this.ctx.font = item.style
      this.ctx.fillStyle = item.color || this.options.defaultColor
      this.ctx.fillText(item.value, item.X, item.Y)
      this.ctx.restore()
    }
  }
}
