import { IElement } from "../../../.."
import { TableOrder } from "../../../../dataset/enum/table/TableTool"
import { IEditorOption } from "../../../../interface/Editor"
import { IElementPosition } from "../../../../interface/Element"
import { Position } from "../../../position/Position"
import { Draw } from "../../Draw"

interface IAnchorMouseDown {
  evt: MouseEvent;
  order: TableOrder;
  index: number;
  element: IElement;
  position: IElementPosition;
}

export class TableTool {

  private readonly translate = 18
  private minTdWidth = 20

  private draw: Draw
  private canvas: HTMLCanvasElement
  private options: Required<IEditorOption>
  private position: Position
  private container: HTMLDivElement
  private toolRowContainer: HTMLDivElement | null
  private toolColContainer: HTMLDivElement | null
  private anchorLine: HTMLDivElement | null
  private mousedownX: number
  private mousedownY: number

  constructor(draw: Draw) {
    this.draw = draw
    this.canvas = draw.getPage()
    this.options = draw.getOptions()
    this.position = draw.getPosition()
    this.container = draw.getContainer()
    // x、y轴
    this.toolRowContainer = null
    this.toolColContainer = null
    this.anchorLine = null
    this.mousedownX = 0
    this.mousedownY = 0
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
      rowItemAnchor.onmousedown = (evt) => {
        this._mousedown({
          evt,
          element,
          position,
          index: r,
          order: TableOrder.ROW
        })
      }
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
      colItemAnchor.onmousedown = (evt) => {
        this._mousedown({
          evt,
          element,
          position,
          index: c,
          order: TableOrder.COL
        })
      }
      colItem.append(colItemAnchor)
      colItem.style.width = `${colHeight}px`
      colContainer.append(colItem)
    }
    colContainer.style.left = `${leftTop[0]}px`
    colContainer.style.top = `${leftTop[1] + prePageHeight}px`
    this.container.append(colContainer)
    this.toolColContainer = colContainer
  }

  private _mousedown(payload: IAnchorMouseDown) {
    const { evt, index, order, element, position } = payload
    this.canvas = this.draw.getPage()
    const { scale } = this.options
    const width = this.draw.getWidth()
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const prePageHeight = this.draw.getPageNo() * (height + pageGap)
    this.mousedownX = evt.x
    this.mousedownY = evt.y
    const target = evt.target as HTMLDivElement
    const canvasRect = this.canvas.getBoundingClientRect()
    // 改变光标
    const cursor = window.getComputedStyle(target).cursor
    document.body.style.cursor = cursor
    this.canvas.style.cursor = cursor
    // 拖拽线
    let startX = 0
    let startY = 0
    const anchorLine = document.createElement('div')
    anchorLine.classList.add('table-anchor__line')
    if (order === TableOrder.ROW) {
      anchorLine.classList.add('table-anchor__line__row')
      anchorLine.style.width = `${width}px`
      startX = 0
      startY = prePageHeight + this.mousedownY - canvasRect.top
    } else {
      anchorLine.classList.add('table-anchor__line__col')
      anchorLine.style.height = `${height}px`
      startX = this.mousedownX - canvasRect.left
      startY = prePageHeight
    }
    anchorLine.style.left = `${startX}px`
    anchorLine.style.top = `${startY}px`
    this.container.append(anchorLine)
    this.anchorLine = anchorLine
    // 追加全局事件
    let dx = 0
    let dy = 0
    const mousemoveFn = (evt: MouseEvent) => {
      const movePosition = this._mousemove(evt, order, startX, startY)
      if (movePosition) {
        dx = movePosition.dx
        dy = movePosition.dy
      }
    }
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener('mouseup', () => {
      let isChangeSize = false
      // 改变尺寸
      if (order === TableOrder.ROW) {
        element.trList![index].height += dy
        if (dy) {
          isChangeSize = true
        }
      } else {
        const { colgroup } = element
        if (colgroup && dx) {
          // 宽度分配
          const innerWidth = this.draw.getInnerWidth()
          const curColWidth = colgroup[index].width
          // 最小移动距离计算
          let moveColWidth = curColWidth + dx
          if (moveColWidth < this.minTdWidth) {
            dx = this.minTdWidth - curColWidth
          }
          // 最大移动距离计算
          let moveTableWidth = 0
          for (let c = 0; c < colgroup.length; c++) {
            const group = colgroup[c]
            // 下一列减去偏移量
            if (c === index + 1) {
              moveTableWidth -= dx
            }
            // 当前列加上偏移量
            if (c === index) {
              moveTableWidth += moveColWidth
            }
            if (c !== index) {
              moveTableWidth += group.width
            }
          }
          if (moveTableWidth > innerWidth) {
            const tableWidth = element.width!
            dx = innerWidth - tableWidth
          }
          if (dx) {
            // 当前列增加，后列减少
            if (colgroup.length - 1 !== index) {
              colgroup[index + 1].width -= dx / scale
            }
            colgroup[index].width += dx / scale
            isChangeSize = true
          }
        }
      }
      if (isChangeSize) {
        this.draw.render({ isSetCursor: false })
        this.render(element, position)
      }
      // 还原副作用
      anchorLine.remove()
      document.removeEventListener('mousemove', mousemoveFn)
      document.body.style.cursor = ''
      this.canvas.style.cursor = 'text'
    }, {
      once: true
    })
    evt.preventDefault()
  }

  private _mousemove(evt: MouseEvent, tableOrder: TableOrder, startX: number, startY: number): { dx: number; dy: number } | null {
    if (!this.anchorLine) return null
    const dx = evt.x - this.mousedownX
    const dy = evt.y - this.mousedownY
    if (tableOrder === TableOrder.ROW) {
      this.anchorLine.style.top = `${startY + dy}px`
    } else {
      this.anchorLine.style.left = `${startX + dx}px`
    }
    evt.preventDefault()
    return { dx, dy }
  }

}