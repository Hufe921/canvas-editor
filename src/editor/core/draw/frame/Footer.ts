import { maxHeightRadioMapping } from '../../../dataset/constant/Common'
import { EditorZone } from '../../../dataset/enum/Editor'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { IRow } from '../../../interface/Row'
import { Position } from '../../position/Position'
import { Draw } from '../Draw'

export class Footer {
  private draw: Draw
  private position: Position
  private options: DeepRequired<IEditorOption>

  private elementList: IElement[]
  private rowList: IRow[]
  private positionList: IElementPosition[]

  constructor(draw: Draw, data?: IElement[]) {
    this.draw = draw
    this.position = draw.getPosition()
    this.options = draw.getOptions()

    this.elementList = data || []
    this.rowList = []
    this.positionList = []
  }

  public getRowList(): IRow[] {
    return this.rowList
  }

  public setElementList(elementList: IElement[]) {
    this.elementList = elementList
  }

  public getElementList(): IElement[] {
    return this.elementList
  }

  public getPositionList(): IElementPosition[] {
    return this.positionList
  }

  public compute() {
    this.recovery()
    this._computeRowList()
    this._computePositionList()
  }

  public recovery() {
    this.rowList = []
    this.positionList = []
  }

  private _computeRowList() {
    const innerWidth = this.draw.getInnerWidth()
    this.rowList = this.draw.computeRowList({
      innerWidth,
      elementList: this.elementList
    })
  }

  private _computePositionList() {
    const footerBottom = this.getFooterBottom()
    const innerWidth = this.draw.getInnerWidth()
    const margins = this.draw.getMargins()
    const startX = margins[3]
    // 页面高度 - 页脚顶部距离页面底部高度
    const pageHeight = this.draw.getHeight()
    const footerHeight = this.getHeight()
    const startY = pageHeight - footerBottom - footerHeight
    this.position.computePageRowPosition({
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: 0,
      startRowIndex: 0,
      startIndex: 0,
      startX,
      startY,
      innerWidth,
      zone: EditorZone.FOOTER
    })
  }

  public getFooterBottom(): number {
    const {
      footer: { bottom, disabled },
      scale
    } = this.options
    if (disabled) return 0
    return Math.floor(bottom * scale)
  }

  public getMaxHeight(): number {
    const {
      footer: { maxHeightRadio }
    } = this.options
    const height = this.draw.getHeight()
    return Math.floor(height * maxHeightRadioMapping[maxHeightRadio])
  }

  public getHeight(): number {
    const maxHeight = this.getMaxHeight()
    const rowHeight = this.getRowHeight()
    return rowHeight > maxHeight ? maxHeight : rowHeight
  }

  public getRowHeight(): number {
    return this.rowList.reduce((pre, cur) => pre + cur.height, 0)
  }

  public getExtraHeight(): number {
    // 页脚下边距 + 实际高 - 页面上边距
    const margins = this.draw.getMargins()
    const footerHeight = this.getHeight()
    const footerBottom = this.getFooterBottom()
    const extraHeight = footerBottom + footerHeight - margins[2]
    return extraHeight <= 0 ? 0 : extraHeight
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    ctx.globalAlpha = 1
    const innerWidth = this.draw.getInnerWidth()
    const maxHeight = this.getMaxHeight()
    // 超出最大高度不渲染
    const rowList: IRow[] = []
    let curRowHeight = 0
    for (let r = 0; r < this.rowList.length; r++) {
      const row = this.rowList[r]
      if (curRowHeight + row.height > maxHeight) {
        break
      }
      rowList.push(row)
      curRowHeight += row.height
    }
    this.draw.drawRow(ctx, {
      elementList: this.elementList,
      positionList: this.positionList,
      rowList,
      pageNo,
      startIndex: 0,
      innerWidth,
      zone: EditorZone.FOOTER
    })
  }
}
