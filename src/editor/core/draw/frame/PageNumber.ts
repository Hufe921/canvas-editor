import { PageMode } from '../../../dataset/enum/Editor'
import { RowFlex } from '../../../dataset/enum/Row'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class PageNumber {

  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const { pageNumber: { size, font, color, rowFlex }, scale, pageMode } = this.options
    const text = `${pageNo + 1}`
    const width = this.draw.getWidth()
    // 计算y位置
    const height = pageMode === PageMode.CONTINUITY
      ? this.draw.getCanvasHeight(pageNo)
      : this.draw.getHeight()
    const pageNumberBottom = this.draw.getPageNumberBottom()
    const y = height - pageNumberBottom
    ctx.save()
    ctx.fillStyle = color
    ctx.font = `${size * scale}px ${font}`
    // 计算x位置-居左、居中、居右
    let x = 0
    const margins = this.draw.getMargins()
    const { width: textWidth } = ctx.measureText(text)
    if (rowFlex === RowFlex.CENTER) {
      x = (width + textWidth) / 2
    } else if (rowFlex === RowFlex.RIGHT) {
      x = width - textWidth - margins[1]
    } else {
      x = margins[3]
    }
    ctx.fillText(text, x, y)
    ctx.restore()
  }

}