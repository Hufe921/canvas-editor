import { IElement } from "../../../.."
import { IEditorOption } from "../../../../interface/Editor"
import { IElementPosition } from "../../../../interface/Element"
import { Position } from "../../../position/Position"
import { Draw } from "../../Draw"

export class TableTool {

  private readonly translate = 18

  private draw: Draw
  private options: Required<IEditorOption>
  private position: Position
  private container: HTMLDivElement
  private toolRowContainer: HTMLDivElement | null
  private toolColContainer: HTMLDivElement | null

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.position = draw.getPosition()
    this.container = draw.getContainer()
    // x、y轴
    this.toolRowContainer = null
    this.toolColContainer = null
  }

  public dispose() {
    this.toolRowContainer?.remove()
    this.toolColContainer?.remove()
  }

  public render(element: IElement, position: IElementPosition) {
    this.dispose()
    const { trIndex, tdIndex } = this.position.getPositionContext()
    const { scale } = this.options
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const { colgroup, trList } = element
    const { coordinate: { leftTop } } = position
    const prePageHeight = this.draw.getPageNo() * (height + pageGap)
    const td = element.trList![trIndex!].tdList[tdIndex!]
    const rowIndex = td.rowIndex
    const colIndex = td.colIndex
    // 计算表格行列信息
    const rowList = trList!.map(tr => tr.height)
    const colList = colgroup!.map(col => col.width)
    // 渲染行
    const rowContainer = document.createElement('div')
    rowContainer.classList.add('table-tool__row')
    rowContainer.style.transform = `translateX(-${this.translate * scale}px)`
    for (let r = 0; r < rowList.length; r++) {
      const rowHeight = rowList[r] * scale
      const rowItem = document.createElement('div')
      rowItem.classList.add('table-tool__row__item')
      if (r === rowIndex) {
        rowItem.classList.add('active')
      }
      const rowItemAnchor = document.createElement('div')
      rowItemAnchor.classList.add('table-tool__anchor')
      rowItem.append(rowItemAnchor)
      rowItem.style.height = `${rowHeight}px`
      rowContainer.append(rowItem)
    }
    rowContainer.style.left = `${leftTop[0]}px`
    rowContainer.style.top = `${leftTop[1] + prePageHeight}px`
    this.container.append(rowContainer)
    this.toolRowContainer = rowContainer

    // 渲染列
    const colContainer = document.createElement('div')
    colContainer.classList.add('table-tool__col')
    colContainer.style.transform = `translateY(-${this.translate * scale}px)`
    for (let c = 0; c < colList.length; c++) {
      const colHeight = colList[c] * scale
      const colItem = document.createElement('div')
      colItem.classList.add('table-tool__col__item')
      if (c === colIndex) {
        colItem.classList.add('active')
      }
      const colItemAnchor = document.createElement('div')
      colItemAnchor.classList.add('table-tool__anchor')
      colItem.append(colItemAnchor)
      colItem.style.width = `${colHeight}px`
      colContainer.append(colItem)
    }
    colContainer.style.left = `${leftTop[0]}px`
    colContainer.style.top = `${leftTop[1] + prePageHeight}px`
    this.container.append(colContainer)
    this.toolColContainer = colContainer
  }

}