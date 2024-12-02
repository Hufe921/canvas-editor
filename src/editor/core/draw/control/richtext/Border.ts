import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { IElementFillRect } from '../../../../interface/Element'
import { Draw } from '../../Draw'
import { CERenderingContext } from '../../../../interface/CERenderingContext'

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

  public render(ctx: CERenderingContext) {
    if (!this.borderRect.width) return
    const {
      scale,
      control: { borderWidth, borderColor }
    } = this.options
    const { x, y, width, height } = this.borderRect
    ctx.strokeRect(x, y, width, height, {
      lineWidth: borderWidth * scale, color: borderColor, translate: [0, 1 * scale]
    })
    this.clearBorderInfo()
  }
}
