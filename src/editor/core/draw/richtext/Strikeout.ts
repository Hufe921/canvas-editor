import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { CanvasPath2SvgPath, createSVGElement } from '../../../utils/svg'

export class Strikeout extends AbstractRichText {

  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  public render(ctx: SVGElement) {
    if (!this.fillRect.width) return
    const { strikeoutColor } = this.options
    const { x, y, width } = this.fillRect
    const path = createSVGElement('path')
    path.style.fill = strikeoutColor
    const adjustY = y + 0.5 // 从1处渲染，避免线宽度等于3
    // 路径
    const svgCtx = new CanvasPath2SvgPath()
    svgCtx.moveTo(x, adjustY)
    svgCtx.lineTo(x + width, adjustY)
    path.setAttribute('d', svgCtx.toString())
    ctx.append(path)
    this.clearFillInfo()
  }

}