import { IColumnLayout, IColumnOption } from '../../../interface/Column'
import { DeepRequired } from '../../../interface/Common'
import { PaperDirection } from '../../../dataset/enum/Editor'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

// 分栏管理器：负责分栏布局计算、栏状态维护以及分隔线绘制
export class ColumnManager {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private layoutMap: Map<PaperDirection, IColumnLayout | null>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.layoutMap = new Map()
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
    const rawGap = (config.gap ?? this.options.column.gap) * this.options.scale
    // 限制单栏最小宽度，避免栏间距过大导致栏宽为负
    const maxGap = (innerWidth / count) * 0.5
    const gap = Math.max(0, Math.min(rawGap, maxGap))
    const width = (innerWidth - gap * (count - 1)) / count
    // 预计算每栏起始 X 偏移，渲染时直接查表
    const offsets: number[] = []
    for (let i = 0; i < count; i++) {
      offsets.push(i * (width + gap))
    }
    return { count, width, gap, separator: config.separator ?? false, offsets }
  }

  // 重算布局（两种方向各算一份，混排横竖版时按页方向取用）
  public compute() {
    this.layoutMap.set(
      PaperDirection.VERTICAL,
      this.computeLayout(
        this.draw.getInnerWidth(PaperDirection.VERTICAL),
        this.options.column
      )
    )
    this.layoutMap.set(
      PaperDirection.HORIZONTAL,
      this.computeLayout(
        this.draw.getInnerWidth(PaperDirection.HORIZONTAL),
        this.options.column
      )
    )
  }

  public getLayout(
    direction = this.options.paperDirection
  ): IColumnLayout | null {
    return this.layoutMap.get(direction) || null
  }

  // 设置分栏配置
  public setConfig(config: IColumnOption | null | undefined): void {
    if (!config || config.count <= 1) {
      this.options.column = { ...this.options.column, count: 1 }
    } else {
      this.options.column = {
        ...this.options.column,
        ...config,
        count: Math.max(1, Math.floor(config.count))
      }
    }
  }

  // 根据栏索引获取 X 偏移；无布局或索引非法时返回 0
  public getOffset(
    columnIndex: number | undefined,
    direction?: PaperDirection
  ): number {
    const layout = this.getLayout(direction)
    if (!layout) return 0
    if (columnIndex === undefined || columnIndex < 0) return 0
    if (columnIndex >= layout.count) return 0
    return layout.offsets[columnIndex]
  }

  // 绘制栏间分隔线；仅在 separator 开启且 count>=2 时实际绘制
  public drawSeparator(ctx: CanvasRenderingContext2D, pageNo: number): void {
    const direction = this.draw.getPageDirection(pageNo)
    const layout = this.getLayout(direction)
    if (!layout || !layout.separator || layout.count < 2) return
    const { column, scale } = this.options
    const { margins, height } = this.draw.getPageSize(pageNo)
    const startX = margins[3]
    // 纵向覆盖正文区域：上边界算上当前页页眉额外高度，下边界扣除页脚额外高度
    const top = margins[0] + this.draw.getHeader().getExtraHeight(pageNo)
    const bottom =
      height - margins[2] - this.draw.getFooter().getExtraHeight(pageNo)
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
