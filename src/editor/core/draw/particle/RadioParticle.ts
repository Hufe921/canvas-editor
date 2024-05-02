import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

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

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      radio: { gap, lineWidth, fillStyle, strokeStyle },
      scale
    } = this.options
    const { metrics, radio } = element
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
