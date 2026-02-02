import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class LabelParticle {
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      scale,
      label: {
        defaultBackgroundColor,
        defaultColor,
        defaultBorderRadius,
        defaultPadding
      }
    } = this.options

    // 默认样式
    const backgroundColor =
      element.label?.backgroundColor || defaultBackgroundColor
    const color = element.label?.color || defaultColor
    const borderRadius = element.label?.borderRadius || defaultBorderRadius
    const padding = element.label?.padding || defaultPadding

    // 设置字体大小
    ctx.save()
    ctx.font = element.style
    const { width, height, boundingBoxAscent } = element.metrics

    // 绘制圆角矩形背景
    ctx.fillStyle = backgroundColor
    this._drawRoundedRect(
      ctx,
      x,
      y - boundingBoxAscent,
      width,
      height + (padding[0] + padding[3]) * scale,
      borderRadius * scale
    )
    ctx.fill()

    // 绘制文本
    ctx.fillStyle = color
    ctx.fillText(element.value, x + padding[3] * scale, y)
    ctx.restore()
  }

  private _drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
}
