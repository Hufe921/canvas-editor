import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { createSVGElement, measureText } from '../../../utils/svg'
import { Draw } from '../Draw'

export class Header {

  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = <DeepRequired<IEditorOption>>draw.getOptions()
  }

  public render(ctx: SVGElement) {
    const { header: { data, size, color, font }, scale } = this.options
    if (!data) return
    const width = this.draw.getWidth()
    const top = this.draw.getHeaderTop()
    // 文字长度
    const textMeasure = measureText({
      data,
      font,
      size: size! * scale
    })
    if (!textMeasure) return
    const textWidth = textMeasure.width
    // 偏移量
    const left = (width - textWidth) / 2
    // 追加文本
    const text = createSVGElement('text')
    text.style.fill = color
    text.style.fontSize = `${size! * scale}px`
    text.style.fontFamily = font
    text.setAttribute('x', `${left < 0 ? 0 : left}`)
    text.setAttribute('y', `${top}`)
    text.append(document.createTextNode(data))
    ctx.append(text)
  }

}