import { IColumnLayout, IColumnOption } from '../../../interface/Column'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

// 分栏管理器：负责分栏布局计算、栏状态维护以及分隔线绘制
export class ColumnManager {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private layout: IColumnLayout | null

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    const { column } = this.options
    this.layout = this.computeLayout(
      draw.getInnerWidth(),
      column.count > 1 ? column : undefined
    )
  }

  // 根据可用宽度和分栏配置计算布局；count<=1 或无配置时返回 null
  public computeLayout(
    innerWidth: number,
    config: IColumnOption | undefined
  ): IColumnLayout | null {
    if (!config) return null
    const count = Math.max(1, Math.floor(config.count))
    if (count === 1) return null
    // gap 未指定时回退到 option 中的默认栏间距
    const rawGap = config.gap ?? this.options.column.gap
    // 限制单栏最小宽度，避免栏间距过大导致栏宽为负
    const maxGap = (innerWidth / count) * 0.5
    const gap = Math.max(0, Math.min(rawGap, maxGap))
    const width = (innerWidth - gap * (count - 1)) / count
    // 预计算每栏起始 X 偏移，渲染时直接查表
    const offsets: number[] = []
    for (let i = 0; i < count; i++) {
      offsets.push(i * (width + gap))
    }
    return {
      count,
      width,
      gap,
      separator: config.separator ?? false,
      offsets
    }
  }

  public getLayout(): IColumnLayout | null {
    return this.layout
  }

  // 重新设置分栏配置并刷新布局
  public setConfig(
    innerWidth: number,
    config: IColumnOption | null | undefined
  ): void {
    if (!config || config.count <= 1) {
      this.layout = null
    } else {
      this.layout = this.computeLayout(innerWidth, config)
    }
    this.options.column = {
      ...this.options.column,
      ...(config || { count: 1 }),
      count: this.layout ? this.layout.count : 1
    }
  }

  // 根据栏索引获取 X 偏移；无布局或索引非法时返回 0
  public getOffset(columnIndex: number | undefined): number {
    if (!this.layout) return 0
    if (columnIndex === undefined || columnIndex < 0) return 0
    if (columnIndex >= this.layout.count) return 0
    return this.layout.offsets[columnIndex]
  }

  // 绘制栏间分隔线；仅在 separator 开启且 count>=2 时实际绘制
  public drawSeparator(ctx: CanvasRenderingContext2D, pageNo: number): void {
    const layout = this.layout
    if (!layout || !layout.separator || layout.count < 2) return
    const { column, scale } = this.options
    const margins = this.draw.getMargins()
    const startX = margins[3]
    // 纵向覆盖正文区域：上边界算上当前页页眉额外高度，下边界扣除页脚额外高度
    const top = margins[0] + this.draw.getHeader().getExtraHeight(pageNo)
    const bottom =
      this.draw.getHeight() -
      margins[2] -
      this.draw.getFooter().getExtraHeight(pageNo)
    ctx.save()
    ctx.strokeStyle = column.separatorColor
    ctx.lineWidth = column.separatorWidth * scale
    ctx.beginPath()
    // 在相邻两栏的中线绘制分隔线（offsets[i] - gap/2）
    for (let i = 1; i < layout.count; i++) {
      const sepX = startX + layout.offsets[i] - layout.gap / 2
      ctx.moveTo(sepX + 0.5, top)
      ctx.lineTo(sepX + 0.5, bottom)
    }
    ctx.stroke()
    ctx.restore()
  }
}
