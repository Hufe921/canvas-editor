import { ZERO } from "../../dataset/constant/Common"
import { EDITOR_ELEMENT_STYLE } from "../../dataset/constant/Element"
import { ElementType } from "../../dataset/enum/Element"
import { ElementStyleKey } from "../../dataset/enum/ElementStyle"
import { RowFlex } from "../../dataset/enum/Row"
import { IDrawImagePayload } from "../../interface/Draw"
import { IEditorOption } from "../../interface/Editor"
import { IElement, IElementStyle } from "../../interface/Element"
import { getUUID } from "../../utils"
import { printImageBase64 } from "../../utils/print"
import { Draw } from "../draw/Draw"
import { HistoryManager } from "../history/HistoryManager"
import { Position } from "../position/Position"
import { RangeManager } from "../range/RangeManager"

export class CommandAdapt {

  private draw: Draw
  private range: RangeManager
  private position: Position
  private historyManager: HistoryManager
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.position = draw.getPosition()
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
      const painterStyleKeys = EDITOR_ELEMENT_STYLE
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

  public font(payload: string) {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.font = payload
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

  public color(payload: string) {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.color = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public highlight(payload: string) {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.highlight = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public rowFlex(payload: RowFlex) {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === 0 && endIndex === 0) return
    const pageNo = this.draw.getPageNo()
    const positionList = this.position.getPositionList()
    // 开始/结束行号
    const startRowNo = positionList[startIndex].rowNo
    const endRowNo = positionList[endIndex].rowNo
    const elementList = this.draw.getElementList()
    // 当前选区所在行
    for (let p = 0; p < positionList.length; p++) {
      const postion = positionList[p]
      if (postion.pageNo !== pageNo) continue
      if (postion.rowNo > endRowNo) break
      if (postion.rowNo >= startRowNo && postion.rowNo <= endRowNo) {
        elementList[p].rowFlex = payload
      }
    }
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public rowMargin(payload: number) {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === 0 && endIndex === 0) return
    const pageNo = this.draw.getPageNo()
    const positionList = this.position.getPositionList()
    // 开始/结束行号
    const startRowNo = positionList[startIndex].rowNo
    const endRowNo = positionList[endIndex].rowNo
    const elementList = this.draw.getElementList()
    // 当前选区所在行
    for (let p = 0; p < positionList.length; p++) {
      const postion = positionList[p]
      if (postion.pageNo !== pageNo) continue
      if (postion.rowNo > endRowNo) break
      if (postion.rowNo >= startRowNo && postion.rowNo <= endRowNo) {
        elementList[p].rowMargin = payload
      }
    }
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public image(payload: IDrawImagePayload) {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === 0 && endIndex === 0) return
    const elementList = this.draw.getElementList()
    const { value, width, height } = payload
    const element: IElement = {
      value,
      width,
      height,
      id: getUUID(),
      type: ElementType.IMAGE
    }
    const curIndex = startIndex + 1
    if (startIndex === endIndex) {
      elementList.splice(curIndex, 0, element)
    } else {
      elementList.splice(curIndex, endIndex - startIndex, element)
    }
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public search(payload: string | null) {
    if (payload) {
      const elementList = this.draw.getElementList()
      const text = elementList.map(e => !e.type || e.type === ElementType.TEXT ? e.value : ZERO)
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
    const { width, height } = this.options
    return printImageBase64(this.draw.getDataURL(), width, height)
  }

  public pageScaleMinus() {
    const { scale } = this.options
    const nextScale = scale * 10 - 1
    if (nextScale >= 5) {
      this.draw.setPageScale(nextScale / 10)
    }
  }

  public pageScaleAdd() {
    const { scale } = this.options
    const nextScale = scale * 10 + 1
    if (nextScale <= 30) {
      this.draw.setPageScale(nextScale / 10)
    }
  }

}