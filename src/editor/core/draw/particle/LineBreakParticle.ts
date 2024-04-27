import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class LineBreakParticle {
  private options: DeepRequired<IEditorOption>
  public static readonly WIDTH = 12
  public static readonly HEIGHT = 9
  public static readonly GAP = 3 // 距离左边间隙

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      scale,
      lineBreak: { color, lineWidth }
    } = this.options
    ctx.save()
    ctx.beginPath()
    // 换行符尺寸设置为9像素
    const top = y - (LineBreakParticle.HEIGHT * scale) / 2
    const left = x + element.metrics.width
    // 移动位置并设置缩放
    ctx.translate(left, top)
    ctx.scale(scale, scale)
    // 样式设置
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    // 回车折线
    ctx.moveTo(8, 0)
    ctx.lineTo(12, 0)
    ctx.lineTo(12, 6)
    ctx.lineTo(3, 6)
    // 箭头向上
    ctx.moveTo(3, 6)
    ctx.lineTo(6, 3)
    // 箭头向下
    ctx.moveTo(3, 6)
    ctx.lineTo(6, 9)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }
}
