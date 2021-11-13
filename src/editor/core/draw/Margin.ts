import { IEditorOption } from "../../interface/Editor"

export class Margin {

  private ctx: CanvasRenderingContext2D
  private options: Required<IEditorOption>

  constructor(ctx: CanvasRenderingContext2D, options: Required<IEditorOption>) {
    this.ctx = ctx
    this.options = options
  }

  render(canvasRect: DOMRect) {
    const { width, height } = canvasRect
    const { marginIndicatorColor, marginIndicatorSize, margins } = this.options
    this.ctx.save()
    this.ctx.strokeStyle = marginIndicatorColor
    this.ctx.beginPath()
    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    const rightTopPoint: [number, number] = [width - margins[1], margins[0]]
    const leftBottomPoint: [number, number] = [margins[3], height - margins[2]]
    const rightBottomPoint: [number, number] = [width - margins[1], height - margins[2]]
    // 上左
    this.ctx.moveTo(leftTopPoint[0] - marginIndicatorSize, leftTopPoint[1])
    this.ctx.lineTo(...leftTopPoint)
    this.ctx.lineTo(leftTopPoint[0], leftTopPoint[1] - marginIndicatorSize)
    // 上右
    this.ctx.moveTo(rightTopPoint[0] + marginIndicatorSize, rightTopPoint[1])
    this.ctx.lineTo(...rightTopPoint)
    this.ctx.lineTo(rightTopPoint[0], rightTopPoint[1] - marginIndicatorSize)
    // 下左
    this.ctx.moveTo(leftBottomPoint[0] - marginIndicatorSize, leftBottomPoint[1])
    this.ctx.lineTo(...leftBottomPoint)
    this.ctx.lineTo(leftBottomPoint[0], leftBottomPoint[1] + marginIndicatorSize)
    // 下右
    this.ctx.moveTo(rightBottomPoint[0] + marginIndicatorSize, rightBottomPoint[1])
    this.ctx.lineTo(...rightBottomPoint)
    this.ctx.lineTo(rightBottomPoint[0], rightBottomPoint[1] + marginIndicatorSize)
    this.ctx.stroke()
    this.ctx.restore()
  }

}