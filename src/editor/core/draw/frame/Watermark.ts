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
      watermark: { data, opacity, font, size, color },
      scale
    } = this.options
    const width = this.draw.getWidth()
    const height = this.draw.getHeight()
    const x = width / 2
    const y = height / 2
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.font = `${size * scale}px ${font}`
    ctx.fillStyle = color
    // 移动到中心位置再旋转
    const measureText = ctx.measureText(data)
    ctx.translate(x, y)
    ctx.rotate((-45 * Math.PI) / 180)
    ctx.fillText(
      data,
      -measureText.width / 2,
      measureText.actualBoundingBoxAscent - size / 2
    )
    ctx.restore()
  }
}
