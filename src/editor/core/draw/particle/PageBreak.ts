import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { CanvasPath2SvgPath, createSVGElement, measureText } from '../../../utils/svg'
import { Draw } from '../Draw'

export class PageBreakParticle {

  static readonly font: string = 'Yahei'
  static readonly fontSize: number = 12
  static readonly displayName: string = '分页符'
  static readonly lineDash: number[] = [3, 1]

  private draw: Draw
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: SVGElement, element: IRowElement, x: number, y: number) {
    const { font, fontSize, displayName, lineDash } = PageBreakParticle
    const { scale, defaultRowMargin } = this.options
    const size = fontSize * scale
    const elementWidth = element.width!
    const offsetY = this.draw.getDefaultBasicRowMarginHeight() * defaultRowMargin
    const textMeasure = measureText({
      data: displayName,
      size,
      font
    })
    if (!textMeasure) return
    const halfX = (elementWidth - textMeasure.width) / 2
    const g = createSVGElement('g')
    g.style.transform = `translate(0px, ${0.5 + offsetY}px)`
    // 线段
    const path = createSVGElement('path')
    path.setAttribute('stroke-dasharray', `${lineDash.join(',')}`)
    const svgCtx = new CanvasPath2SvgPath()
    svgCtx.moveTo(x, y)
    svgCtx.lineTo(x + halfX, y)
    svgCtx.moveTo(x + halfX + textMeasure.width, y)
    svgCtx.lineTo(x + elementWidth, y)
    path.setAttribute('d', svgCtx.toString())
    path.setAttribute('stroke', '#000000')
    path.setAttribute('fill', 'none')
    g.append(path)
    // 文字
    const text = createSVGElement('text')
    text.style.fontSize = `${size}px`
    text.style.fontFamily = `${font}`
    text.append(document.createTextNode(displayName))
    text.setAttribute('x', `${x + halfX}`)
    text.setAttribute('y', `${y + textMeasure.actualBoundingBoxAscent - size / 2}`)
    g.append(text)
    ctx.append(g)
  }

}