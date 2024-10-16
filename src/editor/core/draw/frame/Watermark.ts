import { IEditorOption } from '../../..'
import { DeepRequired } from '../../../interface/Common'
import { Draw } from '../Draw'

export class Watermark {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = <DeepRequired<IEditorOption>>draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    const {
      watermark: { data, opacity, font, size, color, repeat, gap },
      scale
    } = this.options
    const width = this.draw.getWidth()
    const height = this.draw.getHeight()
    // 开始绘制
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.font = `${size * scale}px ${font}`
    const measureText = ctx.measureText(data)
    if (repeat) {
      const dpr = this.draw.getPagePixelRatio()
      const temporaryCanvas = document.createElement('canvas')
      const temporaryCtx = temporaryCanvas.getContext('2d')!
      // 勾股定理计算旋转后的宽高对角线尺寸 a^2 + b^2 = c^2
      const textWidth = measureText.width
      const textHeight =
        measureText.actualBoundingBoxAscent +
        measureText.actualBoundingBoxDescent
      const diagonalLength = Math.sqrt(
        Math.pow(textWidth, 2) + Math.pow(textHeight, 2)
      )
      // 加上 gap 间距
      const patternWidth = diagonalLength + 2 * gap[0] * scale
      const patternHeight = diagonalLength + 2 * gap[1] * scale
      // 宽高设置
      temporaryCanvas.width = patternWidth
      temporaryCanvas.height = patternHeight
      temporaryCanvas.style.width = `${patternWidth * dpr}px`
      temporaryCanvas.style.height = `${patternHeight * dpr}px`
      // 旋转45度
      temporaryCtx.translate(patternWidth / 2, patternHeight / 2)
      temporaryCtx.rotate((-45 * Math.PI) / 180)
      temporaryCtx.translate(-patternWidth / 2, -patternHeight / 2)
      // 绘制文本
      temporaryCtx.font = `${size * scale}px ${font}`
      temporaryCtx.fillStyle = color
      temporaryCtx.fillText(
        data,
        (patternWidth - textWidth) / 2,
        (patternHeight - textHeight) / 2 + measureText.actualBoundingBoxAscent
      )
      // 创建平铺模式
      const pattern = ctx.createPattern(temporaryCanvas, 'repeat')
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, width, height)
      }
    } else {
      const x = width / 2
      const y = height / 2
      ctx.fillStyle = color
      ctx.translate(x, y)
      ctx.rotate((-45 * Math.PI) / 180)
      ctx.fillText(
        data,
        -measureText.width / 2,
        measureText.actualBoundingBoxAscent - size / 2
      )
    }
    ctx.restore()
  }
}
