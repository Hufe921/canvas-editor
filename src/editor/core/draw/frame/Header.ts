import { maxHeightRadioMapping } from '../../../dataset/constant/Header'
import { EditorZone } from '../../../dataset/enum/Editor'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { IRow } from '../../../interface/Row'
import { Position } from '../../position/Position'
import { Draw } from '../Draw'

export class Header {

  private draw: Draw
  private position: Position
  private options: DeepRequired<IEditorOption>

  private elementList: IElement[]
  private rowList: IRow[]
  private positionList: IElementPosition[]

  constructor(draw: Draw) {
    this.draw = draw
    this.position = draw.getPosition()
    this.options = draw.getOptions()

    this.elementList = draw.getHeaderElementList()
    this.rowList = []
    this.positionList = []
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
    this._recovery()
    this._computeRowList()
    this._computePositionList()
  }

  private _recovery() {
    this.rowList = []
    this.positionList = []
  }

  private _computeRowList() {
    const innerWidth = this.draw.getInnerWidth()
    this.rowList = this.draw.computeRowList(innerWidth, this.elementList)
  }

  private _computePositionList() {
    const { header: { top } } = this.options
    const innerWidth = this.draw.getInnerWidth()
    const margins = this.draw.getMargins()
    const startX = margins[3]
    const startY = top
    this.position.computePageRowPosition({
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: 0,
      startIndex: 0,
      startX,
      startY,
      innerWidth
    })
  }

  public getMaxHeight(): number {
    const { header: { maxHeightRadio } } = this.options
    const height = this.draw.getOriginalHeight()
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
    const { header: { top: headerTop } } = this.options
    // 页眉上边距 + 实际高 - 页面上边距
    const margins = this.draw.getOriginalMargins()
    const headerHeight = this.getHeight()
    const extraHeight = headerTop + headerHeight - margins[0]
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
      zone: EditorZone.HEADER
    })
  }

}