import { LineNumberType } from '../../../dataset/enum/LineNumber'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import type { IRenderContext } from '../../render/model/RenderContext'
import { Draw } from '../Draw'

export class LineNumber {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: IRenderContext, pageNo: number) {
    const {
      scale,
      lineNumber: { color, size, font, right, type }
    } = this.options
    const { margins } = this.draw.getPageSize(pageNo)
    const positionList = this.draw.getPosition().getOriginalMainPositionList()
    const pageRowList = this.draw.getPageRowList()
    const rowList = pageRowList[pageNo]
    const fontStyle = `${size * scale}px ${font}`
    ctx.save()
    ctx.fillStyle = color
    ctx.font = fontStyle
    for (let i = 0; i < rowList.length; i++) {
      const row = rowList[i]
      const {
        coordinate: { leftBottom }
      } = row.fragmentPosition || positionList[row.startIndex]
      const seq = type === LineNumberType.PAGE ? i + 1 : row.rowIndex + 1
      const textMetrics = this.draw
        .getTextMeasurer()
        .measure({ value: `${seq}` }, fontStyle)
      const x = margins[3] - textMetrics.width - right * scale
      const y = leftBottom[1] - textMetrics.actualBoundingBoxAscent
      ctx.fillText(`${seq}`, x, y)
    }
    ctx.restore()
  }
}
