import { FORMAT_PLACEHOLDER } from '../../../dataset/constant/PageNumber'
import { NumberType } from '../../../dataset/enum/Common'
import { RowFlex } from '../../../dataset/enum/Row'
import { TextDirection } from '../../../dataset/enum/TextDirection'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { convertNumberToChinese } from '../../../utils'
import {
  drawPlainText,
  measurePlainText
} from '../../text-engine-host/drawPlainText'
import { Draw } from '../Draw'

export class PageNumber {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  static formatNumberPlaceholder(
    text: string,
    pageNo: number,
    replaceReg: RegExp,
    numberType: NumberType
  ) {
    const pageNoText =
      numberType === NumberType.CHINESE
        ? convertNumberToChinese(pageNo)
        : `${pageNo}`
    return text.replace(replaceReg, pageNoText)
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const {
      scale,
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
      text = PageNumber.formatNumberPlaceholder(
        text,
        pageNo + startPageNo - fromPageNo,
        pageNoReg,
        numberType
      )
    }
    const pageCountReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_COUNT)
    if (pageCountReg.test(text)) {
      text = PageNumber.formatNumberPlaceholder(
        text,
        this.draw.getPageCount() - fromPageNo,
        pageCountReg,
        numberType
      )
    }
    // 混合纸张方向：按页取尺寸
    const { width, height, margins } = this.draw.getPageSize(pageNo)
    const pageNumberBottom = this.draw.getPageNumberBottom()
    const y = height - pageNumberBottom
    const fontSize = size * scale
    const style = {
      text,
      fontFamily: font,
      fontSize,
      color
    }
    const adapter = this.draw.getLayoutHostAdapter()
    // RTL：LEFT/RIGHT 物理侧互换，CENTER 保持居中
    const pageRows = this.draw.getPageRowList()[pageNo] || []
    const firstRow = pageRows.find(row => row.direction)
    const firstElement = this.draw
      .getOriginalMainElementList()
      .find(element => element.direction)
    const isRtl =
      firstRow?.direction === TextDirection.RTL ||
      firstElement?.direction === TextDirection.RTL ||
      this.options.defaultDirection === TextDirection.RTL
    const resolvedRowFlex =
      isRtl && rowFlex === RowFlex.LEFT
        ? RowFlex.RIGHT
        : isRtl && rowFlex === RowFlex.RIGHT
          ? RowFlex.LEFT
          : rowFlex
    ctx.save()
    const metrics = measurePlainText(adapter, style)
    if (metrics) {
      let x = margins[3]
      if (resolvedRowFlex === RowFlex.CENTER) {
        x = (width - metrics.width) / 2
      } else if (resolvedRowFlex === RowFlex.RIGHT) {
        x = width - metrics.width - margins[1]
      }
      drawPlainText(adapter, ctx, style, x, y)
    } else {
      ctx.fillStyle = color
      ctx.font = `${fontSize}px ${font}`
      const { width: textWidth } = ctx.measureText(text)
      let x = margins[3]
      if (resolvedRowFlex === RowFlex.CENTER) {
        x = (width - textWidth) / 2
      } else if (resolvedRowFlex === RowFlex.RIGHT) {
        x = width - textWidth - margins[1]
      }
      ctx.fillText(text, x, y)
    }
    ctx.restore()
  }
}
