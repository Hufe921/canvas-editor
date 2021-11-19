import { IEditorOption } from "../../interface/Editor"
import { IElement } from "../../interface/Element"
import { IRange } from "../../interface/Range"
import { Draw } from "../draw/Draw"
import { HistoryManager } from "../history/HistoryManager"
import { Listener } from "../listener/Listener"

export class RangeManager {

  private ctx: CanvasRenderingContext2D
  private options: Required<IEditorOption>
  private range: IRange
  private draw: Draw
  private listener: Listener
  private historyManager: HistoryManager

  constructor(ctx: CanvasRenderingContext2D, options: Required<IEditorOption>, draw: Draw) {
    this.ctx = ctx
    this.options = options
    this.draw = draw
    this.listener = draw.getListener()
    this.historyManager = draw.getHistoryManager()
    this.range = {
      startIndex: 0,
      endIndex: 0
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

  public setRange(startIndex: number, endIndex: number) {
    this.range.startIndex = startIndex
    this.range.endIndex = endIndex
  }

  public setRangeStyle() {
    if (!this.listener.rangeStyleChange) return
    let curElementList = this.getSelection()
    if (!curElementList) {
      const elementList = this.draw.getElementList()
      const { endIndex } = this.range
      curElementList = [elementList[endIndex]]
    }
    const curElement = curElementList[curElementList.length - 1]
    // 富文本
    const font = curElement.font || this.options.defaultFont
    let bold = !~curElementList.findIndex(el => !el.bold)
    let italic = !~curElementList.findIndex(el => !el.italic)
    let underline = !~curElementList.findIndex(el => !el.underline)
    let strikeout = !~curElementList.findIndex(el => !el.strikeout)
    const color = curElement.color || null
    const highlight = curElement.highlight || null
    const rowFlex = curElement.rowFlex || null
    const rowMargin = curElement.rowMargin || this.options.defaultRowMargin
    // 菜单
    const painter = !!this.draw.getPainterStyle()
    const undo = this.historyManager.isCanUndo()
    const redo = this.historyManager.isCanRedo()
    this.listener.rangeStyleChange({
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
      rowMargin
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
      rowMargin
    })
  }

  public render(x: number, y: number, width: number, height: number) {
    this.ctx.save()
    this.ctx.globalAlpha = this.options.rangeAlpha
    this.ctx.fillStyle = this.options.rangeColor
    this.ctx.fillRect(x, y, width, height)
    this.ctx.restore()
  }

}