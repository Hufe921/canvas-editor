import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { Footer } from './Footer'
import { Header } from './Header'

export class PageBorder {
  private draw: Draw
  private header: Header
  private footer: Footer
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.header = draw.getHeader()
    this.footer = draw.getFooter()
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    const {
      scale,
      pageBorder: { color, lineWidth, padding }
    } = this.options
    ctx.save()
    ctx.translate(0.5, 0.5)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth * scale
    const margins = this.draw.getMargins()
    // x：左边距 - 左距离正文距离
    const x = margins[3] - padding[3] * scale
    // y：页眉上边距 + 页眉高度 - 上距离正文距离
    const y = margins[0] + this.header.getExtraHeight() - padding[0] * scale
    // width：页面宽度 + 左右距离正文距离
    const width = this.draw.getInnerWidth() + (padding[1] + padding[3]) * scale
    // height：页面高度 - 正文起始位置 - 页脚高度 - 下边距 - 下距离正文距离
    const height =
      this.draw.getHeight() -
      y -
      this.footer.getExtraHeight() -
      margins[2] +
      padding[2] * scale
    ctx.rect(x, y, width, height)
    ctx.stroke()
    ctx.restore()
  }
}
