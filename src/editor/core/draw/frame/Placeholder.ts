import { IEditorOption, IElement } from '../../..'
import { DeepRequired } from '../../../interface/Common'
import { IElementPosition } from '../../../interface/Element'
import { IRow } from '../../../interface/Row'
import { formatElementList } from '../../../utils/element'
import { Position } from '../../position/Position'
import { Draw } from '../Draw'
import { LineBreakParticle } from '../particle/LineBreakParticle'

export class Placeholder {
  private draw: Draw
  private position: Position
  private options: DeepRequired<IEditorOption>

  private elementList: IElement[]
  private rowList: IRow[]
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

  public _compute() {
    this._computeRowList()
    this._computePositionList()
  }

  private _computeRowList() {
    const innerWidth = this.draw.getInnerWidth()
    this.rowList = this.draw.computeRowList({
      innerWidth,
      elementList: this.elementList
    })
  }

  private _computePositionList() {
    const { lineBreak, scale } = this.options
    const headerExtraHeight = this.draw.getHeader().getExtraHeight()
    const innerWidth = this.draw.getInnerWidth()
    const margins = this.draw.getMargins()
    let startX = margins[3]
    // 换行符绘制开启时，移动起始位置
    if (!lineBreak.disabled) {
      startX += (LineBreakParticle.WIDTH + LineBreakParticle.GAP) * scale
    }
    const startY = margins[0] + headerExtraHeight
    this.position.computePageRowPosition({
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: 0,
      startRowIndex: 0,
      startIndex: 0,
      startX,
      startY,
      innerWidth
    })
  }

  public render(ctx: CanvasRenderingContext2D) {
    const {
      placeholder: { data, font, size, color, opacity }
    } = this.options
    if (!data) return
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
      editorOptions: this.options
    })
    // 计算
    this._compute()
    const innerWidth = this.draw.getInnerWidth()
    // 绘制
    ctx.save()
    ctx.globalAlpha = opacity
    this.draw.drawRow(ctx, {
      elementList: this.elementList,
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: 0,
      startIndex: 0,
      innerWidth,
      isDrawLineBreak: false
    })
    ctx.restore()
  }
}
