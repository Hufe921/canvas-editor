import { PageMode } from '../../../dataset/enum/Editor'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { CERenderingContext } from '../../../interface/CERenderingContext'

export class Margin {
  private draw: Draw
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: CERenderingContext, pageNo: number) {
    const { marginIndicatorColor, pageMode } = this.options
    const width = this.draw.getWidth()
    const height =
      pageMode === PageMode.CONTINUITY
        ? this.draw.getCanvasHeight(pageNo) / this.draw.getPagePixelRatio()
        : this.draw.getHeight()
    const margins = this.draw.getMargins()
    const marginIndicatorSize = this.draw.getMarginIndicatorSize()
    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    const rightTopPoint: [number, number] = [width - margins[1], margins[0]]
    const leftBottomPoint: [number, number] = [margins[3], height - margins[2]]
    const rightBottomPoint: [number, number] = [
      width - margins[1],
      height - margins[2]
    ]
    ctx.line({
      color: marginIndicatorColor
    }).beforeDraw(c => c.translate(.5,.5))
    // 上左
      .path(leftTopPoint[0] - marginIndicatorSize, leftTopPoint[1], ...leftTopPoint)
      .path(leftTopPoint[0], leftTopPoint[1] - marginIndicatorSize)
    // 上右
      .path(rightTopPoint[0] + marginIndicatorSize, rightTopPoint[1], ...rightTopPoint)
      .path(rightTopPoint[0], rightTopPoint[1] - marginIndicatorSize)
    // 下左
      .path(leftBottomPoint[0] - marginIndicatorSize, leftBottomPoint[1], ...leftBottomPoint)
      .path(leftBottomPoint[0], leftBottomPoint[1] + marginIndicatorSize)
    // 下右
      .path(rightBottomPoint[0] + marginIndicatorSize, rightBottomPoint[1], ...rightBottomPoint)
      .path(rightBottomPoint[0], rightBottomPoint[1] + marginIndicatorSize)
      .draw()
  }
}
