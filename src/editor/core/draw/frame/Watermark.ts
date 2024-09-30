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
    ctx.save()
    const x = width / 2
    const y = height / 2

    ctx.globalAlpha = opacity
    ctx.font = `${size * scale}px ${font}`
    ctx.fillStyle = color
    const measureText = ctx.measureText(data)
    if (repeat) {
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
      const patternWidth = diagonalLength + 2 * gap[0]
      const patternHeight = diagonalLength + 2 * gap[1]

      temporaryCanvas.width = patternWidth
      temporaryCanvas.height = patternHeight

      temporaryCtx.translate(patternWidth / 2, patternHeight / 2)
      temporaryCtx.rotate((-45 * Math.PI) / 180)
      temporaryCtx.translate(-patternWidth / 2, -patternHeight / 2)

      temporaryCtx.globalAlpha = opacity
      temporaryCtx.font = `${size * scale}px ${font}`
      temporaryCtx.fillStyle = color
      temporaryCtx.fillText(
        data,
        (patternWidth - measureText.width) / 2,
        (patternHeight + measureText.actualBoundingBoxAscent) / 2
      )
      // 创建平铺模式
      const pattern = ctx.createPattern(temporaryCanvas, 'repeat')
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, width, height)
      }
    } else {

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
