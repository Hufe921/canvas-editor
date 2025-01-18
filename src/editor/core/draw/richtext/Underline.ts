import { AbstractRichText } from './AbstractRichText'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { DashType, TextDecorationStyle } from '../../../dataset/enum/Text'
import { CERenderingContext, LineProperty } from '../../../interface/CERenderingContext'

export class Underline extends AbstractRichText {
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    super()
    this.options = draw.getOptions()
  }

  // 下划线
  private _drawLine(
    ctx: CERenderingContext,
    startX: number,
    startY: number,
    width: number,
    lineProp: LineProperty,
    dashType?: DashType,
  ) {
    const endX = startX + width
    switch (dashType) {
      case DashType.DASHED:
        // 长虚线- - - - - -
        lineProp.lineDash = [3, 1]
        break
      case DashType.DOTTED:
        // 点虚线 . . . . . .
        lineProp.lineDash = [1, 1]
        break
    }
    ctx.line(lineProp).path(startX, startY, endX, startY).draw()
  }

  // 双实线
  private _drawDouble(
    ctx: CERenderingContext,
    startX: number,
    startY: number,
    width: number,
    lineProp: LineProperty
  ) {
    const SPACING = 3 // 双实线间距
    const endX = startX + width
    const endY = startY + SPACING * this.options.scale

    const drawer = ctx.line(lineProp)
    drawer.path(startX, startY, endX, startY)
      .path(startX, endY, endX, endY).draw()
  }

  // 波浪线
  private _drawWave(
    ctx: CERenderingContext,
    startX: number,
    startY: number,
    width: number,
    lineProp: LineProperty
  ) {
    const { scale } = this.options
    const AMPLITUDE = 1.2 * scale // 振幅
    const FREQUENCY = 1 / scale // 频率
    const adjustY = startY + 2 * AMPLITUDE // 增加2倍振幅
    const drawer = ctx.line(lineProp)
    for (let x = 0; x < width; x++) {
      const y = AMPLITUDE * Math.sin(FREQUENCY * x)
      drawer.path(startX + x, adjustY + y)
    }
    drawer.draw()
  }

  public render(ctx: CERenderingContext) {
    if (!this.fillRect.width) return
    const { underlineColor, scale } = this.options
    const { x, y, width } = this.fillRect
    const prop = {
      color: this.fillColor || underlineColor, lineWidth: scale
    }
    const adjustY = Math.floor(y + 2 * scale) + 0.5 // +0.5从1处渲染，避免线宽度等于3
    switch (this.fillDecorationStyle) {
      case TextDecorationStyle.WAVY:
        this._drawWave(ctx, x, adjustY, width, prop)
        break
      case TextDecorationStyle.DOUBLE:
        this._drawDouble(ctx, x, adjustY, width, prop)
        break
      case TextDecorationStyle.DASHED:
        this._drawLine(ctx, x, adjustY, width, prop, DashType.DASHED)
        break
      case TextDecorationStyle.DOTTED:
        this._drawLine(ctx, x, adjustY, width, prop, DashType.DOTTED)
        break
      default:
        this._drawLine(ctx, x, adjustY, width, prop)
        break
    }
    this.clearFillInfo()
  }
}
