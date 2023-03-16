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
    const startY = margins[0] + top
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

  public render(ctx: CanvasRenderingContext2D) {
    const innerWidth = this.draw.getInnerWidth()
    this.draw.drawRow(ctx, {
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: 0,
      startIndex: 0,
      innerWidth
    })
  }

}