import {
  drawPlainText,
  measurePlainText
} from '../../text-engine-host/drawPlainText'
import { LineNumberType } from '../../../dataset/enum/LineNumber'
import { TextDirection } from '../../../dataset/enum/TextDirection'
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
    const adapter = this.draw.getLayoutHostAdapter()
    if (!adapter.isReady()) return
    const { width, margins } = this.draw.getPageSize(pageNo)
    const positionList = this.draw.getPosition().getOriginalMainPositionList()
    const pageRowList = this.draw.getLayoutPages()
    const rowList = pageRowList[pageNo] || []
    ctx.save()
    for (let i = 0; i < rowList.length; i++) {
      const row = rowList[i]
      const {
        coordinate: { leftBottom }
      } = row.fragmentPosition || positionList[row.startIndex]
      const seq = type === LineNumberType.PAGE ? i + 1 : row.rowIndex + 1
      const style = {
        text: `${seq}`,
        fontFamily: font,
        fontSize: size * scale,
        color
      }
      const textMetrics = measurePlainText(adapter, style)
      if (!textMetrics) continue
      const element = this.draw.getOriginalMainElementList()[row.startIndex]
      const isRtl =
        row.direction === TextDirection.RTL ||
        element?.direction === TextDirection.RTL ||
        this.options.defaultDirection === TextDirection.RTL
      const x = isRtl
        ? width - margins[1] + right * scale
        : margins[3] - textMetrics.width - right * scale
      const y = leftBottom[1] - textMetrics.descent
      drawPlainText(adapter, ctx, style, x, y)
    }
    ctx.restore()
  }
}
