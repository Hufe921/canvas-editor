import { IEditorOption } from '../../..'
import { DeepRequired } from '../../../interface/Common'
import { createSVGElement, measureText } from '../../../utils/svg'
import { Draw } from '../Draw'

export class Watermark {

  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = <DeepRequired<IEditorOption>>draw.getOptions()
  }

  public render(ctx: SVGElement) {
    const { watermark: { data, opacity, font, size, color }, scale } = this.options
    const width = this.draw.getWidth()
    const height = this.draw.getHeight()
    const x = width / 2
    const y = height / 2
    const textMeasure = measureText({
      data,
      size: size * scale,
      font
    })
    if (!textMeasure) return
    // 移动到中心位置再旋转
    const text = createSVGElement('text')
    text.style.opacity = `${opacity}`
    text.style.fill = color
    text.style.fontSize = `${size * scale}px`
    text.style.fontFamily = font

    const centerY = (textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent) / 2
    text.style.transform = `translate(${x}px,${y}px) rotate(${-45}deg) translate(${-x}px,${-y}px)`
    text.setAttribute('x', `${-((textMeasure.width - width) / 2)}`)
    text.setAttribute('y', `${y + centerY}`)
    text.append(document.createTextNode(data))
    ctx.append(text)
  }

}