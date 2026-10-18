import type { LayoutRow } from '../../../interface/LayoutRow'
import { IEditorOption, IElement } from '../../..'
import { DeepRequired } from '../../../interface/Common'
import { IElementPosition } from '../../../interface/Element'
import { IPlaceholder } from '../../../interface/Placeholder'
import { formatElementList } from '../../../utils/element'
import { Position } from '../../position/Position'
import { Draw } from '../Draw'
import { LineBreakParticle } from '../particle/LineBreakParticle'

export interface IPlaceholderRenderOption {
  placeholder: Required<IPlaceholder>
  startY?: number
  startX?: number
  innerWidth?: number
  layoutScope?: string
  pageNo?: number
}

export class Placeholder {
  private draw: Draw
  private position: Position
  private options: DeepRequired<IEditorOption>

  private elementList: IElement[]
  private rowList: LayoutRow[]
  private positionList: IElementPosition[]

  constructor(draw: Draw) {
    this.draw = draw
    this.position = draw.getPosition()
    this.options = <DeepRequired<IEditorOption>>draw.getOptions()

    this.elementList = []
    this.rowList = []
    this.positionList = []
  }

  private _recovery() {
    this.elementList = []
    this.rowList = []
    this.positionList = []
  }

  public _compute(options?: IPlaceholderRenderOption) {
    this._computeRowList(options)
    this._computePositionList(options)
  }

  private _computeRowList(options?: IPlaceholderRenderOption) {
    const innerWidth =
      options?.innerWidth ??
      this.draw.getInnerWidth(this.draw.getPageDirection(0))
    this.rowList = this.draw.computeRowList({
      innerWidth,
      elementList: this.elementList,
      layoutScope: options?.layoutScope || 'placeholder'
    })
  }

  private _computePositionList(options?: IPlaceholderRenderOption) {
    const { lineBreak, scale } = this.options
    const headerExtraHeight = this.draw.getHeader().getExtraHeight()
    const innerWidth =
      options?.innerWidth ??
      this.draw.getInnerWidth(this.draw.getPageDirection(0))
    const { margins } = this.draw.getPageSize(options?.pageNo ?? 0)
    let startX = options?.startX ?? margins[3]
    // 换行符绘制开启时，移动起始位置
    if (!lineBreak.disabled) {
      startX += (LineBreakParticle.WIDTH + LineBreakParticle.GAP) * scale
    }
    const startY = options?.startY ?? margins[0] + headerExtraHeight
    this.position.computePageRowPosition({
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: options?.pageNo ?? 0,
      startRowIndex: 0,
      startIndex: 0,
      startX,
      startY,
      innerWidth
    })
  }

  public render(
    ctx: CanvasRenderingContext2D,
    options?: IPlaceholderRenderOption
  ) {
    const { placeholder = this.options.placeholder } = options || {}
    const { data, font, size, color, opacity } = placeholder
    this._recovery()
    // 构建元素列表并格式化
    this.elementList = [
      {
        value: data,
        font,
        size,
        color
      }
    ]
    formatElementList(this.elementList, {
      editorOptions: this.options,
      isForceCompensation: true
    })
    // 计算
    this._compute(options)
    const innerWidth =
      options?.innerWidth ??
      this.draw.getInnerWidth(this.draw.getPageDirection(0))
    // 绘制
    ctx.save()
    ctx.globalAlpha = opacity
    this.draw.drawRow(ctx, {
      elementList: this.elementList,
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: options?.pageNo ?? 0,
      startIndex: 0,
      innerWidth,
      isDrawLineBreak: false
    })
    ctx.restore()
  }
}
