import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'
import { CERenderingContext } from '../../../interface/CERenderingContext'

export class LineBreakParticle {
  private options: DeepRequired<IEditorOption>
  public static readonly WIDTH = 12
  public static readonly HEIGHT = 9
  public static readonly GAP = 3 // 距离左边间隙

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(
    ctx: CERenderingContext,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      scale,
      lineBreak: { color, lineWidth }
    } = this.options
    // 换行符尺寸设置为9像素
    const top = y - (LineBreakParticle.HEIGHT * scale) / 2
    const left = x + element.metrics.width
    // 移动位置并设置缩放
    ctx.line({
      color, lineWidth, lineCap: 'round', lineJoin: 'round'
    })
      .beforeDraw((c) => {
        c.translate(left, top)
        c.scale(scale, scale)
      })
       // 回车折线
      .path(8, 0, 12, 0)
      .path(12, 6)
      .path(3, 6)
       // 箭头向上
      .path(3, 6, 6, 3)
       // 箭头向下
      .path(3, 6, 6, 9)
      .draw()
  }
}
