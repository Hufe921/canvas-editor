import { ElementType } from '../..'
import { IEditorOption } from '../../interface/Editor'
import { IElement } from '../../interface/Element'
import { IRange } from '../../interface/Range'
import { Draw } from '../draw/Draw'
import { HistoryManager } from '../history/HistoryManager'
import { Listener } from '../listener/Listener'

export class RangeManager {

  private draw: Draw
  private options: Required<IEditorOption>
  private range: IRange
  private listener: Listener
  private historyManager: HistoryManager

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.listener = draw.getListener()
    this.historyManager = draw.getHistoryManager()
    this.range = {
      startIndex: -1,
      endIndex: -1
    }
  }

  public getRange(): IRange {
    return this.range
  }

  public getSelection(): IElement[] | null {
    const { startIndex, endIndex } = this.range
    if (startIndex === endIndex) return null
    const elementList = this.draw.getElementList()
    return elementList.slice(startIndex + 1, endIndex + 1)
  }

  public setRange(
    startIndex: number,
    endIndex: number,
    tableId?: string,
    startTdIndex?: number,
    endTdIndex?: number,
    startTrIndex?: number,
    endTrIndex?: number
  ) {
    this.range.startIndex = startIndex
    this.range.endIndex = endIndex
    this.range.tableId = tableId
    this.range.startTdIndex = startTdIndex
    this.range.endTdIndex = endTdIndex
    this.range.startTrIndex = startTrIndex
    this.range.endTrIndex = endTrIndex
    this.range.isCrossRowCol = !!(startTdIndex || endTdIndex || startTrIndex || endTrIndex)
    // 激活控件
    const control = this.draw.getControl()
    if (~startIndex && ~endIndex && startIndex === startIndex) {
      const elementList = this.draw.getElementList()
      const element = elementList[startIndex]
      if (element.type === ElementType.CONTROL) {
        control.initControl()
        return
      }
    }
    control.destroyControl()
  }

  public setRangeStyle() {
    if (!this.listener.rangeStyleChange) return
    let curElementList = this.getSelection()
    if (!curElementList) {
      const elementList = this.draw.getElementList()
      const { endIndex } = this.range
      const index = ~endIndex ? endIndex : 0
      curElementList = [elementList[index]]
    }
    const curElement = curElementList[curElementList.length - 1]
    if (!curElement) return
    // 类型
    const type = curElement.type || ElementType.TEXT
    // 富文本
    const font = curElement.font || this.options.defaultFont
    const bold = !~curElementList.findIndex(el => !el.bold)
    const italic = !~curElementList.findIndex(el => !el.italic)
    const underline = !~curElementList.findIndex(el => !el.underline)
    const strikeout = !~curElementList.findIndex(el => !el.strikeout)
    const color = curElement.color || null
    const highlight = curElement.highlight || null
    const rowFlex = curElement.rowFlex || null
    const rowMargin = curElement.rowMargin || this.options.defaultRowMargin
    const dashArray = curElement.dashArray || []
    // 菜单
    const painter = !!this.draw.getPainterStyle()
    const undo = this.historyManager.isCanUndo()
    const redo = this.historyManager.isCanRedo()
    this.listener.rangeStyleChange({
      type,
      undo,
      redo,
      painter,
      font,
      bold,
      italic,
      underline,
      strikeout,
      color,
      highlight,
      rowFlex,
      rowMargin,
      dashArray
    })
  }

  public recoveryRangeStyle() {
    if (!this.listener.rangeStyleChange) return
    const font = this.options.defaultFont
    const rowMargin = this.options.defaultRowMargin
    const painter = !!this.draw.getPainterStyle()
    const undo = this.historyManager.isCanUndo()
    const redo = this.historyManager.isCanRedo()
    this.listener.rangeStyleChange({
      type: null,
      undo,
      redo,
      painter,
      font,
      bold: false,
      italic: false,
      underline: false,
      strikeout: false,
      color: null,
      highlight: null,
      rowFlex: null,
      rowMargin,
      dashArray: []
    })
  }

  public render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.save()
    ctx.globalAlpha = this.options.rangeAlpha
    ctx.fillStyle = this.options.rangeColor
    ctx.fillRect(x, y, width, height)
    ctx.restore()
  }

}