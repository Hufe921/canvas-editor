import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

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

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      checkbox: { gap, lineWidth, fillStyle, strokeStyle },
      scale
    } = this.options
    const { metrics, checkbox } = element
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
