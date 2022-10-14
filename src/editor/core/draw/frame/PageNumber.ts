import { PageMode } from '../../../dataset/enum/Editor'
import { IEditorOption } from '../../../interface/Editor'
import { createSVGElement } from '../../../utils/svg'
import { Draw } from '../Draw'

export class PageNumber {

  private draw: Draw
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: SVGElement, pageNo: number) {
    const { pageNumberSize, pageNumberFont, scale, pageMode } = this.options
    const width = this.draw.getWidth()
    const height = pageMode === PageMode.CONTINUITY
      ? this.draw.getCanvasHeight()
      : this.draw.getHeight()
    const pageNumberBottom = this.draw.getPageNumberBottom()
    const text = createSVGElement('text')
    text.style.fill = '#00000'
    text.style.fontSize = `${pageNumberSize * scale}px`
    text.style.fontFamily = pageNumberFont
    text.append(document.createTextNode(`${pageNo + 1}`))
    text.setAttribute('x', `${width / 2}`)
    text.setAttribute('y', `${height - pageNumberBottom}`)
    ctx.append(text)
  }

}