import { IEditorOption } from "../../interface/Editor"
import { IRange } from "../../interface/Range"

export class RangeManager {

  private ctx: CanvasRenderingContext2D
  private options: Required<IEditorOption>
  private range: IRange

  constructor(ctx: CanvasRenderingContext2D, options: Required<IEditorOption>,) {
    this.ctx = ctx
    this.options = options
    this.range = {
      startIndex: 0,
      endIndex: 0
    }
  }

  public getRange(): IRange {
    return this.range
  }

  public setRange(startIndex: number, endIndex: number) {
    this.range.startIndex = startIndex
    this.range.endIndex = endIndex
  }

  public drawRange(x: number, y: number, width: number, height: number) {
    const { startIndex, endIndex } = this.range
    if (startIndex !== endIndex) {
      this.ctx.save()
      this.ctx.globalAlpha = this.options.rangeAlpha
      this.ctx.fillStyle = this.options.rangeColor
      this.ctx.fillRect(x, y, width, height)
      this.ctx.restore()
    }
  }

}