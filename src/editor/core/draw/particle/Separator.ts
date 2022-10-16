import { IRowElement } from '../../../interface/Row'
import { createSVGElement } from '../../../utils/svg'
export class SeparatorParticle {

  public render(ctx: SVGElement, element: IRowElement, x: number, y: number) {
    const line = createSVGElement('line')
    line.setAttribute('stroke', element.color || '#000000')
    if (element.dashArray && element.dashArray.length) {
      line.setAttribute('stroke-dasharray', `${element.dashArray.join(',')}`)
    }
    line.style.transform = 'translate(0px, 0.5px)' // 从1处渲染，避免线宽度等于3
    line.setAttribute('x1', `${x}`)
    line.setAttribute('y1', `${y}`)
    line.setAttribute('x2', `${x + element.width!}`)
    line.setAttribute('y2', `${y}`)
    ctx.append(line)
  }

}