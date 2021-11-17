import { ElementStyleKey } from "../../dataset/enum/ElementStyle"
import { IEditorOption } from "../../interface/Editor"
import { IElementStyle } from "../../interface/Element"
import { printImageBase64 } from "../../utils/print"
import { Draw } from "../draw/Draw"
import { HistoryManager } from "../history/HistoryManager"
import { RangeManager } from "../range/RangeManager"

export class CommandAdapt {

  private draw: Draw
  private range: RangeManager
  private historyManager: HistoryManager
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.historyManager = draw.getHistoryManager()
    this.options = draw.getOptions()
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
        if (painterStyle[key] === undefined) {
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

  public sizeAdd() {
    const selection = this.range.getSelection()
    if (!selection) return
    const lessThanMaxSizeIndex = selection.findIndex(s => !s.size || s.size + 2 <= 72)
    const { defaultSize } = this.options
    if (!~lessThanMaxSizeIndex) return
    selection.forEach(el => {
      if (!el.size) {
        el.size = defaultSize
      }
      if (el.size + 2 > 72) return
      el.size += 2
    })
    this.draw.render({ isSetCursor: false })
  }

  public sizeMinus() {
    const selection = this.range.getSelection()
    if (!selection) return
    const greaterThanMaxSizeIndex = selection.findIndex(s => !s.size || s.size - 2 >= 8)
    if (!~greaterThanMaxSizeIndex) return
    const { defaultSize } = this.options
    selection.forEach(el => {
      if (!el.size) {
        el.size = defaultSize
      }
      if (el.size - 2 < 8) return
      el.size -= 2
    })
    this.draw.render({ isSetCursor: false })
  }

  public bold() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noBoldIndex = selection.findIndex(s => !s.bold)
    selection.forEach(el => {
      el.bold = !!~noBoldIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public italic() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noItalicIndex = selection.findIndex(s => !s.italic)
    selection.forEach(el => {
      el.italic = !!~noItalicIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public underline() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noUnderlineIndex = selection.findIndex(s => !s.underline)
    selection.forEach(el => {
      el.underline = !!~noUnderlineIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public strikeout() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noStrikeoutIndex = selection.findIndex(s => !s.strikeout)
    selection.forEach(el => {
      el.strikeout = !!~noStrikeoutIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public search(payload: string | null) {
    if (payload) {
      const elementList = this.draw.getElementList()
      const text = elementList.map(e => !e.type || e.type === 'TEXT' ? e.value : null)
        .filter(Boolean)
        .join('')
      const matchStartIndexList = []
      let index = text.indexOf(payload)
      while (index !== -1) {
        matchStartIndexList.push(index)
        index = text.indexOf(payload, index + 1)
      }
      const searchMatch: number[][] = matchStartIndexList
        .map(i => Array(payload.length).fill(i).map((_, j) => i + j))
      this.draw.setSearchMatch(searchMatch.length ? searchMatch : null)
    } else {
      this.draw.setSearchMatch(null)
    }
    this.draw.render({ isSetCursor: false, isSubmitHistory: false })
  }

  public print() {
    return printImageBase64(this.draw.getDataURL())
  }

}