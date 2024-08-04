import { LineNumberType } from '../../../dataset/enum/LineNumber'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class LineNumber {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const {
      scale,
      lineNumber: { color, size, font, right, type }
    } = this.options
    const textParticle = this.draw.getTextParticle()
    const margins = this.draw.getMargins()
    const positionList = this.draw.getPosition().getOriginalMainPositionList()
    const pageRowList = this.draw.getPageRowList()
    const rowList = pageRowList[pageNo]
    ctx.save()
    ctx.fillStyle = color
    ctx.font = `${size * scale}px ${font}`
    for (let i = 0; i < rowList.length; i++) {
      const row = rowList[i]
      const {
        coordinate: { leftBottom }
      } = positionList[row.startIndex]
      const seq = type === LineNumberType.PAGE ? i + 1 : row.rowIndex + 1
      const textMetrics = textParticle.measureText(ctx, {
        value: `${seq}`
      })
      const x = margins[3] - (textMetrics.width + right) * scale
      const y = leftBottom[1] - textMetrics.actualBoundingBoxAscent * scale
      ctx.fillText(`${seq}`, x, y)
    }
    ctx.restore()
  }
}
