import { NBSP, ZERO } from '../../../dataset/constant/Common'
import { VerticalAlign } from '../../../dataset/enum/VerticalAlign'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { IRow, IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

interface ICheckboxRenderOption {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  row: IRow
  index: number
}

export class CheckboxParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public setSelect(element: IElement) {
    const { checkbox } = element
    if (checkbox) {
      checkbox.value = !checkbox.value
    } else {
      element.checkbox = {
        value: true
      }
    }
    this.draw.render({
      isCompute: false,
      isSetCursor: false
    })
  }

  public render(payload: ICheckboxRenderOption) {
    const { ctx, x, index, row } = payload
    let { y } = payload
    const {
      checkbox: { gap, lineWidth, fillStyle, strokeStyle, verticalAlign },
      scale
    } = this.options
    const { metrics, checkbox } = row.elementList[index]
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
    // 绘制勾选状态
    if (checkbox?.value) {
      // 边框
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = fillStyle
      ctx.rect(left, top, width, height)
      ctx.stroke()
      // 背景色
      ctx.beginPath()
      ctx.fillStyle = fillStyle
      ctx.fillRect(left, top, width, height)
      // 勾选对号
      ctx.beginPath()
      ctx.strokeStyle = strokeStyle
      ctx.lineWidth = lineWidth * 2 * scale
      ctx.moveTo(left + 2 * scale, top + height / 2)
      ctx.lineTo(left + width / 2, top + height - 3 * scale)
      ctx.lineTo(left + width - 2 * scale, top + 3 * scale)
      ctx.stroke()
    } else {
      ctx.lineWidth = lineWidth
      ctx.rect(left, top, width, height)
      ctx.stroke()
    }
    ctx.closePath()
    ctx.restore()
  }
}
