import { ElementStyleKey } from "../../dataset/enum/ElementStyle"
import { IElementStyle } from "../../interface/Element"
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

  public painter() {
    const selection = this.range.getSelection()
    if (!selection) return
    const painterStyle: IElementStyle = {}
    selection.forEach(s => {
      const painterStyleKeys = ['bold', 'color', 'font', 'size', 'italic', 'underline', 'strikeout']
      painterStyleKeys.forEach(p => {
        const key = p as keyof typeof ElementStyleKey
        if (painterStyle[key] === undefined && s[key] !== undefined) {
          painterStyle[key] = s[key] as any
        }
      })
    })
    this.draw.setPainterStyle(painterStyle)
  }

  public format() {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.font = ''
      el.color = ''
      el.bold = false
      el.italic = false
      el.underline = false
      el.strikeout = false
    })
    this.draw.render({ isSetCursor: false })
  }

  public bold() {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.bold = true
    })
    this.draw.render({ isSetCursor: false })
  }

  public print() {
    return printImageBase64(this.draw.getDataURL())
  }

}