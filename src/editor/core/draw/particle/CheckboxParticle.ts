import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class CheckboxParticle {

  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, element: IRowElement, x: number, y: number) {
    const { checkbox: { gap, lineWidth } } = this.options
    const { metrics, checkbox } = element
    // left top 四舍五入避免1像素问题
    const left = Math.round(x + gap)
    const top = Math.round(y - metrics.height + lineWidth)
    const width = metrics.width - gap * 2
    const height = metrics.height
    ctx.save()
    ctx.beginPath()
    ctx.translate(0.5, 0.5)
    ctx.lineWidth = lineWidth
    ctx.rect(left, top, width, height)
    ctx.stroke()
    // 绘制勾选状态
    if (checkbox?.value) {
      ctx.moveTo(left + 2, top + 7)
      ctx.lineTo(left + 6, top + 12)
      ctx.lineTo(left + 12, top + 3)
      ctx.stroke()
    }
    ctx.closePath()
    ctx.restore()
  }

}