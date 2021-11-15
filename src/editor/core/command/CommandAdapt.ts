import { printImageBase64 } from "../../utils/print"
import { Draw } from "../draw/Draw"
import { HistoryManager } from "../history/HistoryManager"
import { RangeManager } from "../range/RangeManager"

export class CommandAdapt {

  private draw: Draw
  private range: RangeManager
  private historyManager: HistoryManager

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.historyManager = draw.getHistoryManager()
  }

  public undo() {
    return this.historyManager.undo()
  }

  public redo() {
    return this.historyManager.redo()
  }

  public format() {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === endIndex) return
    const elementList = this.draw.getElementList()
    elementList.slice(startIndex, endIndex)
      .forEach(el => {
        el.font = ''
        el.color = ''
        el.bold = false
        el.italic = false
        el.underline = false
        el.strikeout = false
      })
    this.draw.render({ isSetCursor: false })
  }

  public print() {
    return printImageBase64(this.draw.getDataURL())
  }

}