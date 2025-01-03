import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'
import { CERenderingContext } from '../../../interface/CERenderingContext'

export class SeparatorParticle {
  private options: DeepRequired<IEditorOption>

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
      separator: { lineWidth, strokeStyle }
    } = this.options

    const width = lineWidth * scale
    const lineProp = {
      lineWidth: width,
      color: element.color || strokeStyle,
      lineDash: element.dashArray
    }

    const offsetY = Math.round(y) // 四舍五入避免绘制模糊

    ctx.line(lineProp)
      .beforeDraw(v => v.translate(0, width/2))
      .path(x, offsetY, x + element.width! * scale, offsetY)
      .draw()
  }
}
