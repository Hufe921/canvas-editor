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
    const { pageNumber: { size, font, color, numberType, format, position, startAt }, scale, pageMode } = this.options
    // 处理页码格式
    let text = format
    const pageNoReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_NO)
    if (pageNoReg.test(text)) {
      const realPageNo = startAt === 0 ? pageNo : pageNo + startAt
      const pageNoText = numberType === NumberType.CHINESE ? convertNumberToChinese(realPageNo) : `${realPageNo}`
      text = text.replace(pageNoReg, pageNoText)
    }
    const pageCountReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_COUNT)
    if (pageCountReg.test(text)) {
      const pageCount = this.draw.getPageCount()
      const pageCountText = numberType === NumberType.CHINESE ? convertNumberToChinese(pageCount) : `${pageCount}`
      text = text.replace(pageCountReg, pageCountText)
    }
    const width = this.draw.getWidth()
    // 计算y位置
    const height = pageMode === PageMode.CONTINUITY
      ? this.draw.getCanvasHeight(pageNo)
      : this.draw.getHeight()
    const pageNumberTop = this.draw.getPageNumberTop()
    const pageNumberBottom = this.draw.getPageNumberBottom()
    ctx.save()
    ctx.fillStyle = color
    ctx.font = `${size * scale}px ${font}`
    const margins = this.draw.getMargins()
    const marginLeft = margins[3]
    const marginRight = margins[1]
    const { width: textWidth } = ctx.measureText(text)
    const centerPos = (width - textWidth) / 2
    const rightPos = width - textWidth - marginRight
    const bottomPos = height - pageNumberBottom
    switch (position) {
      case 'top-left':
        ctx.fillText(text, marginLeft, pageNumberTop)
        break
      case 'top-center':
        ctx.fillText(text, centerPos, pageNumberTop)
        break
      case 'top-right':
        ctx.fillText(text, rightPos, pageNumberTop)
        break
      case 'bottom-left':
        ctx.fillText(text, marginLeft, bottomPos)
        break
      case 'bottom-center':
        ctx.fillText(text, centerPos, bottomPos)
        break
      case 'bottom-right':
        ctx.fillText(text, rightPos, bottomPos)
        break
      case 'top-inner':
        if (pageNo % 2 === 0) {
          ctx.fillText(text, marginLeft, pageNumberTop)
        } else {
          ctx.fillText(text, rightPos, pageNumberTop)
        }
        break
      case 'top-outer':
        if (pageNo % 2 === 0) {
          ctx.fillText(text, rightPos, pageNumberTop)
        } else {
          ctx.fillText(text, marginLeft, pageNumberTop)
        }
        break
      case 'bottom-inner':
        if (pageNo % 2 === 0) {
          ctx.fillText(text, marginLeft, bottomPos)
        } else {
          ctx.fillText(text, rightPos, bottomPos)
        }
        break
      case 'bottom-outer':
        if (pageNo % 2 === 0) {
          ctx.fillText(text, rightPos, bottomPos)
        } else {
          ctx.fillText(text, marginLeft, bottomPos)
        }
        break
    }
    ctx.restore()
  }

}