import { PageMode } from '../../../dataset/enum/Editor'
import { IEditorOption } from '../../../interface/Editor'
import { CanvasPath2SvgPath, createSVGElement } from '../../../utils/svg'
import { Draw } from '../Draw'

export class Margin {

  private draw: Draw
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public render(ctx: SVGElement) {
    const { marginIndicatorColor, pageMode } = this.options
    const width = this.draw.getWidth()
    const height = pageMode === PageMode.CONTINUITY
      ? this.draw.getCanvasHeight()
      : this.draw.getHeight()
    const margins = this.draw.getMargins()
    const marginIndicatorSize = this.draw.getMarginIndicatorSize()

    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    const rightTopPoint: [number, number] = [width - margins[1], margins[0]]
    const leftBottomPoint: [number, number] = [margins[3], height - margins[2]]
    const rightBottomPoint: [number, number] = [width - margins[1], height - margins[2]]
    const g = createSVGElement('g')
    const pathList: string[] = []
    // 上左
    const topLeftCtx = new CanvasPath2SvgPath()
    topLeftCtx.moveTo(leftTopPoint[0] - marginIndicatorSize, leftTopPoint[1])
    topLeftCtx.lineTo(...leftTopPoint)
    topLeftCtx.lineTo(leftTopPoint[0], leftTopPoint[1] - marginIndicatorSize)
    pathList.push(topLeftCtx.toString())

    // 上右
    const topRightCtx = new CanvasPath2SvgPath()
    topRightCtx.moveTo(rightTopPoint[0] + marginIndicatorSize, rightTopPoint[1])
    topRightCtx.lineTo(...rightTopPoint)
    topRightCtx.lineTo(rightTopPoint[0], rightTopPoint[1] - marginIndicatorSize)
    pathList.push(topRightCtx.toString())

    // 下左
    const bottomLeftCtx = new CanvasPath2SvgPath()
    bottomLeftCtx.moveTo(leftBottomPoint[0] - marginIndicatorSize, leftBottomPoint[1])
    bottomLeftCtx.lineTo(...leftBottomPoint)
    bottomLeftCtx.lineTo(leftBottomPoint[0], leftBottomPoint[1] + marginIndicatorSize)
    pathList.push(bottomLeftCtx.toString())

    // 下右
    const bottomRightCtx = new CanvasPath2SvgPath()
    bottomRightCtx.moveTo(rightBottomPoint[0] + marginIndicatorSize, rightBottomPoint[1])
    bottomRightCtx.lineTo(...rightBottomPoint)
    bottomRightCtx.lineTo(rightBottomPoint[0], rightBottomPoint[1] + marginIndicatorSize)
    pathList.push(bottomRightCtx.toString())

    // 追加
    pathList.forEach(path => {
      const pathElement = createSVGElement('path')
      pathElement.setAttribute('d', path)
      pathElement.setAttribute('stroke', marginIndicatorColor)
      pathElement.setAttribute('fill', 'none')
      g.append(pathElement)
    })

    ctx.append(g)
  }

}