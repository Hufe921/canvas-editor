import { IElement } from '../../../..'
import { EDITOR_PREFIX } from '../../../../dataset/constant/Editor'
import { TableOrder } from '../../../../dataset/enum/table/TableTool'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { Position } from '../../../position/Position'
import { Draw } from '../../Draw'

interface IAnchorMouseDown {
  evt: MouseEvent
  order: TableOrder
  index: number
  element: IElement
}

export class TableTool {
  // 单元格最小宽度
  private readonly MIN_TD_WIDTH = 20
  // 行列工具相对表格偏移值
  private readonly ROW_COL_OFFSET = 18
  // 边框工具宽/高度
  private readonly BORDER_VALUE = 4

  private draw: Draw
  private canvas: HTMLCanvasElement
  private options: DeepRequired<IEditorOption>
  private position: Position
  private container: HTMLDivElement
  private toolRowContainer: HTMLDivElement | null
  private toolColContainer: HTMLDivElement | null
  private toolBorderContainer: HTMLDivElement | null
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
    this.toolBorderContainer = null
    this.anchorLine = null
    this.mousedownX = 0
    this.mousedownY = 0
  }

  public dispose() {
    this.toolRowContainer?.remove()
    this.toolColContainer?.remove()
    this.toolBorderContainer?.remove()
    this.toolRowContainer = null
    this.toolColContainer = null
    this.toolBorderContainer = null
  }

  public render() {
    const { isTable, index, trIndex, tdIndex } =
      this.position.getPositionContext()
    if (!isTable) return
    // 销毁之前工具
    this.dispose()
    // 渲染所需数据
    const { scale } = this.options
    const elementList = this.draw.getOriginalElementList()
    const positionList = this.position.getOriginalPositionList()
    const element = elementList[index!]
    const position = positionList[index!]
    const { colgroup, trList } = element
    const {
      coordinate: { leftTop }
    } = position
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const prePageHeight = this.draw.getPageNo() * (height + pageGap)
    const tableX = leftTop[0]
    const tableY = leftTop[1] + prePageHeight
    const td = element.trList![trIndex!].tdList[tdIndex!]
    const rowIndex = td.rowIndex
    const colIndex = td.colIndex
    // 渲染行工具
    const rowHeightList = trList!.map(tr => tr.height)
    const rowContainer = document.createElement('div')
    rowContainer.classList.add(`${EDITOR_PREFIX}-table-tool__row`)
    rowContainer.style.transform = `translateX(-${
      this.ROW_COL_OFFSET * scale
    }px)`
    for (let r = 0; r < rowHeightList.length; r++) {
      const rowHeight = rowHeightList[r] * scale
      const rowItem = document.createElement('div')
      rowItem.classList.add(`${EDITOR_PREFIX}-table-tool__row__item`)
      if (r === rowIndex) {
        rowItem.classList.add('active')
      }
      const rowItemAnchor = document.createElement('div')
      rowItemAnchor.classList.add(`${EDITOR_PREFIX}-table-tool__anchor`)
      rowItemAnchor.onmousedown = evt => {
        this._mousedown({
          evt,
          element,
          index: r,
          order: TableOrder.ROW
        })
      }
      rowItem.append(rowItemAnchor)
      rowItem.style.height = `${rowHeight}px`
      rowContainer.append(rowItem)
    }
    rowContainer.style.left = `${tableX}px`
    rowContainer.style.top = `${tableY}px`
    this.container.append(rowContainer)
    this.toolRowContainer = rowContainer

    // 渲染列工具
    const colWidthList = colgroup!.map(col => col.width)
    const colContainer = document.createElement('div')
    colContainer.classList.add(`${EDITOR_PREFIX}-table-tool__col`)
    colContainer.style.transform = `translateY(-${
      this.ROW_COL_OFFSET * scale
    }px)`
    for (let c = 0; c < colWidthList.length; c++) {
      const colWidth = colWidthList[c] * scale
      const colItem = document.createElement('div')
      colItem.classList.add(`${EDITOR_PREFIX}-table-tool__col__item`)
      if (c === colIndex) {
        colItem.classList.add('active')
      }
      const colItemAnchor = document.createElement('div')
      colItemAnchor.classList.add(`${EDITOR_PREFIX}-table-tool__anchor`)
      colItemAnchor.onmousedown = evt => {
        this._mousedown({
          evt,
          element,
          index: c,
          order: TableOrder.COL
        })
      }
      colItem.append(colItemAnchor)
      colItem.style.width = `${colWidth}px`
      colContainer.append(colItem)
    }
    colContainer.style.left = `${tableX}px`
    colContainer.style.top = `${tableY}px`
    this.container.append(colContainer)
    this.toolColContainer = colContainer

    // 渲染单元格边框拖拽工具
    const tableHeight = element.height! * scale
    const tableWidth = element.width! * scale
    const borderContainer = document.createElement('div')
    borderContainer.classList.add(`${EDITOR_PREFIX}-table-tool__border`)
    borderContainer.style.height = `${tableHeight}px`
    borderContainer.style.width = `${tableWidth}px`
    borderContainer.style.left = `${tableX}px`
    borderContainer.style.top = `${tableY}px`
    for (let r = 0; r < trList!.length; r++) {
      const tr = trList![r]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const rowBorder = document.createElement('div')
        rowBorder.classList.add(`${EDITOR_PREFIX}-table-tool__border__row`)
        rowBorder.style.width = `${td.width! * scale}px`
        rowBorder.style.height = `${this.BORDER_VALUE}px`
        rowBorder.style.top = `${
          (td.y! + td.height!) * scale - this.BORDER_VALUE / 2
        }px`
        rowBorder.style.left = `${td.x! * scale}px`
        rowBorder.onmousedown = evt => {
          this._mousedown({
            evt,
            element,
            index: td.rowIndex! + td.rowspan - 1,
            order: TableOrder.ROW
          })
        }
        borderContainer.appendChild(rowBorder)
        const colBorder = document.createElement('div')
        colBorder.classList.add(`${EDITOR_PREFIX}-table-tool__border__col`)
        colBorder.style.width = `${this.BORDER_VALUE}px`
        colBorder.style.height = `${td.height! * scale}px`
        colBorder.style.top = `${td.y! * scale}px`
        colBorder.style.left = `${
          (td.x! + td.width!) * scale - this.BORDER_VALUE / 2
        }px`
        colBorder.onmousedown = evt => {
          this._mousedown({
            evt,
            element,
            index: td.colIndex! + td.colspan - 1,
            order: TableOrder.COL
          })
        }
        borderContainer.appendChild(colBorder)
      }
    }
    this.container.append(borderContainer)
    this.toolBorderContainer = borderContainer
  }

  private _mousedown(payload: IAnchorMouseDown) {
    const { evt, index, order, element } = payload
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
    anchorLine.classList.add(`${EDITOR_PREFIX}-table-anchor__line`)
    if (order === TableOrder.ROW) {
      anchorLine.classList.add(`${EDITOR_PREFIX}-table-anchor__line__row`)
      anchorLine.style.width = `${width}px`
      startX = 0
      startY = prePageHeight + this.mousedownY - canvasRect.top
    } else {
      anchorLine.classList.add(`${EDITOR_PREFIX}-table-anchor__line__col`)
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
    document.addEventListener(
      'mouseup',
      () => {
        let isChangeSize = false
        // 改变尺寸
        if (order === TableOrder.ROW) {
          const trList = element.trList!
          const tr = trList[index] || trList[index - 1]
          // 最大移动高度-向上移动超出最小高度限定，则减少移动量
          const { defaultTrMinHeight } = this.options.table
          if (dy < 0 && tr.height + dy < defaultTrMinHeight) {
            dy = defaultTrMinHeight - tr.height
          }
          if (dy) {
            tr.height += dy
            tr.minHeight = tr.height
            isChangeSize = true
          }
        } else {
          const { colgroup } = element
          if (colgroup && dx) {
            // 宽度分配
            const innerWidth = this.draw.getInnerWidth()
            const curColWidth = colgroup[index].width
            // 最小移动距离计算-如果向左移动：使单元格小于最小宽度，则减少移动量
            if (dx < 0 && curColWidth + dx < this.MIN_TD_WIDTH) {
              dx = this.MIN_TD_WIDTH - curColWidth
            }
            // 最大移动距离计算-如果向右移动：使后面一个单元格小于最小宽度，则减少移动量
            const nextColWidth = colgroup[index + 1]?.width
            if (
              dx > 0 &&
              nextColWidth &&
              nextColWidth - dx < this.MIN_TD_WIDTH
            ) {
              dx = nextColWidth - this.MIN_TD_WIDTH
            }
            const moveColWidth = curColWidth + dx
            // 开始移动
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
        }
        // 还原副作用
        anchorLine.remove()
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        this.canvas.style.cursor = 'text'
      },
      {
        once: true
      }
    )
    evt.preventDefault()
  }

  private _mousemove(
    evt: MouseEvent,
    tableOrder: TableOrder,
    startX: number,
    startY: number
  ): { dx: number; dy: number } | null {
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
