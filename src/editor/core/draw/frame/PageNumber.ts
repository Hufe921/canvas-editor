import { FORMAT_PLACEHOLDER } from '../../../dataset/constant/PageNumber'
import { NumberType } from '../../../dataset/enum/Common'
import { PageMode } from '../../../dataset/enum/Editor'
import { RowFlex } from '../../../dataset/enum/Row'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { convertNumberToChinese } from '../../../utils'
import { Draw } from '../Draw'

export class PageNumber {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const {
      scale,
      pageMode,
      pageNumber: {
        size,
        font,
        color,
        rowFlex,
        numberType,
        format,
        startPageNo,
        fromPageNo
      }
    } = this.options
    if (pageNo < fromPageNo) return
    // 处理页码格式
    let text = format
    const pageNoReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_NO)
    if (pageNoReg.test(text)) {
      const realPageNo = pageNo + startPageNo - fromPageNo
      const pageNoText =
        numberType === NumberType.CHINESE
          ? convertNumberToChinese(realPageNo)
          : `${realPageNo}`
      text = text.replace(pageNoReg, pageNoText)
    }
    const pageCountReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_COUNT)
    if (pageCountReg.test(text)) {
      const pageCount = this.draw.getPageCount() - fromPageNo
      const pageCountText =
        numberType === NumberType.CHINESE
          ? convertNumberToChinese(pageCount)
          : `${pageCount}`
      text = text.replace(pageCountReg, pageCountText)
    }
    const width = this.draw.getWidth()
    // 计算y位置
    const height =
      pageMode === PageMode.CONTINUITY
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
      x = (width - textWidth) / 2
    } else if (rowFlex === RowFlex.RIGHT) {
      x = width - textWidth - margins[1]
    } else {
      x = margins[3]
    }
    ctx.fillText(text, x, y)
    ctx.restore()
  }
}
