import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { CanvasPath2SvgPath, createSVGElement } from '../../../utils/svg'
import { Draw } from '../Draw'

export class CheckboxParticle {

  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: SVGElement, element: IRowElement, x: number, y: number) {
    const { checkbox: { gap, lineWidth, fillStyle, fontStyle }, scale } = this.options
    const { metrics, checkbox } = element
    // left top 四舍五入避免1像素问题
    const left = Math.round(x + gap)
    const top = Math.round(y - metrics.height + lineWidth)
    const width = metrics.width - gap * 2 * scale
    const height = metrics.height
    const g = createSVGElement('g')
    g.style.transform = `translate(0.5px, 0.5px)`
    // 绘制勾选状态
    if (checkbox?.value) {
      // 边框
      const rect = createSVGElement('rect')
      rect.setAttribute('stroke-width', `${lineWidth}`)
      rect.setAttribute('fill', fillStyle)
      rect.setAttribute('stroke', fillStyle)
      rect.setAttribute('x', `${left}`)
      rect.setAttribute('y', `${top}`)
      rect.setAttribute('width', `${width}`)
      rect.setAttribute('height', `${height}`)
      g.append(rect)
      // 勾选对号
      const path = createSVGElement('path')
      path.setAttribute('stroke', fontStyle)
      path.setAttribute('stroke-width', `${lineWidth * 2}`)
      const svgCtx = new CanvasPath2SvgPath()
      svgCtx.moveTo(left + 2 * scale, top + 7 * scale)
      svgCtx.lineTo(left + 7 * scale, top + 11 * scale)
      svgCtx.moveTo(left + 6.5 * scale, top + 11 * scale)
      svgCtx.lineTo(left + 12 * scale, top + 3 * scale)
      path.setAttribute('d', svgCtx.toString())
      g.append(path)
    } else {
      const rect = createSVGElement('rect')
      rect.setAttribute('stroke-width', `${lineWidth}`)
      rect.setAttribute('fill', 'none')
      rect.setAttribute('stroke', '#000000')
      rect.setAttribute('x', `${left}`)
      rect.setAttribute('y', `${top}`)
      rect.setAttribute('width', `${width}`)
      rect.setAttribute('height', `${height}`)
      g.append(rect)
    }
    ctx.append(g)
  }

}