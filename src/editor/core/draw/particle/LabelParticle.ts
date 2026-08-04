import { ElementType } from '../../../dataset/enum/Element'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { IRow, IRowElement } from '../../../interface/Row'
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

  /**
   * text-engine 行：把 LABEL 的 metrics/visualLeft 对齐 legacy（含 padding），
   * 背景按盒绘制；字形仍落在 ink 位置（visualLeft + padLeft）。
   */
  public applyEngineRowsMetrics(rows: IRow[]) {
    const {
      scale,
      defaultSize,
      label: { defaultPadding }
    } = this.options
    for (const row of rows) {
      for (let j = 0; j < row.elementList.length; j++) {
        const el = row.elementList[j]
        if (el.type !== ElementType.LABEL) continue
        // mapToLegacyRow 每次给出 ink metrics；此处叠加 padding（与 legacy 一致）
        const padding = el.label?.padding || defaultPadding
        const padT = padding[0] * scale
        const padR = padding[1] * scale
        const padL = padding[3] * scale
        const inkWidth = el.metrics.width
        const inkAscent = el.metrics.boundingBoxAscent
        const fontSize = (el.size || defaultSize) * scale
        el.metrics.width = inkWidth + padL + padR
        el.metrics.height = fontSize
        el.metrics.boundingBoxDescent = 0
        el.metrics.boundingBoxAscent = padT + inkAscent
        const inkLeft = el.visualLeft ?? 0
        const inkRight = inkLeft + inkWidth
        el.visualLeft = inkLeft - padL
        const grow = padL + padR
        if (grow > 0) {
          // 只平移标签 ink 盒右侧之外的内容；勿用 inkLeft，
          // 否则同标签多字（如「高血压」）会被拆出空隙
          for (let k = j + 1; k < row.elementList.length; k++) {
            const next = row.elementList[k]
            if (
              next.visualLeft !== undefined &&
              next.visualLeft >= inkRight - 0.01
            ) {
              next.visualLeft += grow
            }
          }
          if (row.engineLine?.glyphs?.length) {
            // 拷贝后再平移，避免污染 LayoutCache 中的 glyphs
            row.engineLine = {
              ...row.engineLine,
              glyphs: row.engineLine.glyphs.map(g =>
                g.left >= inkRight - 0.01
                  ? { ...g, left: g.left + grow, right: g.right + grow }
                  : g
              ),
              width: row.engineLine.width + grow
            }
          }
          row.width += grow
        }
        ;(el as IRowElement & { __labelPadApplied?: boolean }).__labelPadApplied =
          true
      }
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
      scale,
      label: {
        defaultBackgroundColor,
        defaultBorderRadius,
        defaultPadding
      }
    } = this.options
    const backgroundColor =
      element.label?.backgroundColor || defaultBackgroundColor
    const borderRadius = element.label?.borderRadius || defaultBorderRadius
    const padding = element.label?.padding || defaultPadding
    const { width, height, boundingBoxAscent } = element.metrics
    // 引擎行已把 pad 写入 metrics：高度补 top+bottom；legacy 保持原 top+left 公式
    const enginePadded = !!(element as IRowElement & {
      __labelPadApplied?: boolean
    }).__labelPadApplied
    const extraH = enginePadded
      ? (padding[0] + padding[2]) * scale
      : (padding[0] + padding[3]) * scale
    ctx.save()
    ctx.fillStyle = backgroundColor
    this._drawRoundedRect(
      ctx,
      x,
      y - boundingBoxAscent,
      width,
      height + extraH,
      borderRadius * scale
    )
    ctx.fill()
    ctx.restore()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      scale,
      label: { defaultColor, defaultPadding }
    } = this.options
    this.ensureDefaults(element)
    this.renderBackground(ctx, element, x, y)
    const color = element.label?.color || element.color || defaultColor
    const padding = element.label?.padding || defaultPadding
    ctx.save()
    ctx.font = element.style
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
