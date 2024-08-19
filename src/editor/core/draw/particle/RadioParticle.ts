import { NBSP, ZERO } from '../../../dataset/constant/Common'
import { VerticalAlign } from '../../../dataset/enum/VerticalAlign'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { IRow, IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

interface IRadioRenderOption {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  row: IRow
  index: number
}

export class RadioParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public setSelect(element: IElement) {
    const { radio } = element
    if (radio) {
      radio.value = !radio.value
    } else {
      element.radio = {
        value: true
      }
    }
    this.draw.render({
      isCompute: false,
      isSetCursor: false
    })
  }

  public render(payload: IRadioRenderOption) {
    const { ctx, x, index, row } = payload
    let { y } = payload
    const {
      radio: { gap, lineWidth, fillStyle, strokeStyle, verticalAlign },
      scale
    } = this.options
    const { metrics, radio } = row.elementList[index]
    // 垂直布局设置
    if (
      verticalAlign === VerticalAlign.TOP ||
      verticalAlign === VerticalAlign.MIDDLE
    ) {
      let nextIndex = index + 1
      let nextElement: IRowElement | null = null
      while (nextIndex < row.elementList.length) {
        nextElement = row.elementList[nextIndex]
        if (nextElement.value !== ZERO && nextElement.value !== NBSP) break
        nextIndex++
      }
      // 以后一个非空格元素为基准
      if (nextElement) {
        const {
          metrics: { boundingBoxAscent, boundingBoxDescent }
        } = nextElement
        const textHeight = boundingBoxAscent + boundingBoxDescent
        if (textHeight > metrics.height) {
          if (verticalAlign === VerticalAlign.TOP) {
            y -= boundingBoxAscent - metrics.height
          } else if (verticalAlign === VerticalAlign.MIDDLE) {
            y -= (textHeight - metrics.height) / 2
          }
        }
      }
    }
    // left top 四舍五入避免1像素问题
    const left = Math.round(x + gap * scale)
    const top = Math.round(y - metrics.height + lineWidth)
    const width = metrics.width - gap * 2 * scale
    const height = metrics.height
    ctx.save()
    ctx.beginPath()
    ctx.translate(0.5, 0.5)
    // 边框
    ctx.strokeStyle = radio?.value ? fillStyle : strokeStyle
    ctx.lineWidth = lineWidth
    ctx.arc(left + width / 2, top + height / 2, width / 2, 0, Math.PI * 2)
    ctx.stroke()
    // 填充选中色
    if (radio?.value) {
      ctx.beginPath()
      ctx.fillStyle = fillStyle
      ctx.arc(left + width / 2, top + height / 2, width / 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.closePath()
    ctx.restore()
  }
}
