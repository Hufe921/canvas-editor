import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Header {

  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = <DeepRequired<IEditorOption>>draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { header: { data, size, color, font }, scale } = this.options
    if (!data) return
    const width = this.draw.getWidth()
    const top = this.draw.getHeaderTop()
    ctx.save()
    ctx.fillStyle = color
    ctx.font = `${size! * scale}px ${font}`
    // 文字长度
    const textWidth = ctx.measureText(`${data}`).width
    // 偏移量
    const left = (width - textWidth) / 2
    ctx.fillText(`${data}`, left < 0 ? 0 : left, top)
    ctx.restore()
  }

}