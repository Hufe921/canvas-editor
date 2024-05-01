import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { IElementFillRect } from '../../../../interface/Element'
import { Draw } from '../../Draw'

export class ControlBorder {
  protected borderRect: IElementFillRect
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.borderRect = this.clearBorderInfo()
    this.options = draw.getOptions()
  }

  public clearBorderInfo() {
    this.borderRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
    return this.borderRect
  }

  public recordBorderInfo(x: number, y: number, width: number, height: number) {
    const isFirstRecord = !this.borderRect.width
    if (isFirstRecord) {
      this.borderRect.x = x
      this.borderRect.y = y
      this.borderRect.height = height
    }
    this.borderRect.width += width
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.borderRect.width) return
    const {
      scale,
      control: { borderWidth, borderColor }
    } = this.options
    const { x, y, width, height } = this.borderRect
    ctx.save()
    ctx.translate(0, 1 * scale)
    ctx.lineWidth = borderWidth * scale
    ctx.strokeStyle = borderColor
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.stroke()
    ctx.restore()
    this.clearBorderInfo()
  }
}
