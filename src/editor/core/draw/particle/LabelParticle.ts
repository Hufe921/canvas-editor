import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class LabelParticle {
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  /** 标签文字色；引擎行跳过 Particle 文字时也须先调用，供 GlyphRenderer */
  public ensureDefaults(element: IElement) {
    const { defaultColor } = this.options.label
    if (!element.color) {
      element.color = element.label?.color || defaultColor
    }
  }

  /** 仅圆角背景（引擎行文字由 GlyphRenderer 绘制） */
  public renderBackground(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      label: { defaultBackgroundColor, defaultBorderRadius }
    } = this.options
    const backgroundColor =
      element.label?.backgroundColor || defaultBackgroundColor
    const borderRadius = element.label?.borderRadius || defaultBorderRadius
    const { width, height, boundingBoxAscent } = element.metrics
    ctx.save()
    ctx.fillStyle = backgroundColor
    this._drawRoundedRect(
      ctx,
      x,
      y - boundingBoxAscent,
      width,
      height,
      borderRadius * this.options.scale
    )
    ctx.fill()
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
