import { ZERO } from "../../dataset/constant/Common"
import { KeyMap } from "../../dataset/enum/Keymap"
import { IElement } from "../../interface/Element"
import { writeText } from "../../utils/clipboard"
import { Cursor } from "../cursor/Cursor"
import { Draw } from "../draw/Draw"
import { HistoryManager } from "../history/HistoryManager"
import { Position } from "../position/Position"
import { RangeManager } from "../range/RangeManager"

export class CanvasEvent {

  private isAllowDrag: boolean
  private isCompositing: boolean
  private mouseDownStartIndex: number

  private draw: Draw
  private canvas: HTMLCanvasElement
  private position: Position
  private range: RangeManager
  private cursor: Cursor | null
  private historyManager: HistoryManager

  constructor(canvas: HTMLCanvasElement, draw: Draw) {
    this.isAllowDrag = false
    this.isCompositing = false
    this.mouseDownStartIndex = 0

    this.canvas = canvas
    this.draw = draw
    this.cursor = null
    this.position = this.draw.getPosition()
    this.range = this.draw.getRange()
    this.historyManager = this.draw.getHistoryManager()
  }

  public register() {
    // 延迟加载
    this.cursor = this.draw.getCursor()
    this.canvas.addEventListener('mousedown', this.cursor.setCursorPosition.bind(this))
    this.canvas.addEventListener('mousedown', this.mousedown.bind(this))
    this.canvas.addEventListener('mouseleave', this.mouseleave.bind(this))
    this.canvas.addEventListener('mousemove', this.mousemove.bind(this))
  }

  public setIsAllowDrag(payload: boolean) {
    this.isAllowDrag = payload
  }

  public mousemove(evt: MouseEvent) {
    if (!this.isAllowDrag) return
    // 结束位置
    const endIndex = this.draw.getPosition().getPositionByXY(evt.offsetX, evt.offsetY)
    let end = ~endIndex ? endIndex : 0
    // 开始位置
    let start = this.mouseDownStartIndex
    if (start > end) {
      [start, end] = [end, start]
    }
    this.draw.getRange().setRange(start, end)
    if (start === end) return
    // 绘制
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public mousedown(evt: MouseEvent) {
    this.isAllowDrag = true
    this.mouseDownStartIndex = this.draw.getPosition().getPositionByXY(evt.offsetX, evt.offsetY) || 0
  }

  public mouseleave(evt: MouseEvent) {
    // 是否还在canvas内部
    const { x, y, width, height } = this.canvas.getBoundingClientRect()
    if (evt.x >= x && evt.x <= x + width && evt.y >= y && evt.y <= y + height) return
    this.isAllowDrag = false
  }

  public keydown(evt: KeyboardEvent) {
    const cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    const elementList = this.draw.getElementList()
    const position = this.position.getPositionList()
    const { index } = cursorPosition
    const { startIndex, endIndex } = this.range.getRange()
    const isCollspace = startIndex === endIndex
    if (evt.key === KeyMap.Backspace) {
      // 判断是否允许删除
      if (elementList[index].value === ZERO && index === 0) {
        evt.preventDefault()
        return
      }
      if (!isCollspace) {
        elementList.splice(startIndex + 1, endIndex - startIndex)
      } else {
        elementList.splice(index, 1)
      }
      this.range.setRange(0, 0)
      this.draw.render({ curIndex: isCollspace ? index - 1 : startIndex })
    } else if (evt.key === KeyMap.Enter) {
      const enterText: IElement = {
        value: ZERO
      }
      if (isCollspace) {
        elementList.splice(index + 1, 0, enterText)
      } else {
        elementList.splice(startIndex + 1, endIndex - startIndex, enterText)
      }
      this.range.setRange(0, 0)
      this.draw.render({ curIndex: index + 1 })
    } else if (evt.key === KeyMap.Left) {
      if (index > 0) {
        this.range.setRange(0, 0)
        this.draw.render({ curIndex: index - 1, isSubmitHistory: false })
      }
    } else if (evt.key === KeyMap.Right) {
      if (index < position.length - 1) {
        this.range.setRange(0, 0)
        this.draw.render({ curIndex: index + 1, isSubmitHistory: false })
      }
    } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
      const { rowNo, index, coordinate: { leftTop, rightTop } } = cursorPosition
      if ((evt.key === KeyMap.Up && rowNo !== 0) || (evt.key === KeyMap.Down && rowNo !== this.draw.getRowCount())) {
        // 下一个光标点所在行位置集合
        const probablePosition = evt.key === KeyMap.Up
          ? position.slice(0, index).filter(p => p.rowNo === rowNo - 1)
          : position.slice(index, position.length - 1).filter(p => p.rowNo === rowNo + 1)
        // 查找与当前位置元素点交叉最多的位置
        let maxIndex = 0
        let maxDistance = 0
        for (let p = 0; p < probablePosition.length; p++) {
          const position = probablePosition[p]
          // 当前光标在前
          if (position.coordinate.leftTop[0] >= leftTop[0] && position.coordinate.leftTop[0] <= rightTop[0]) {
            const curDistance = rightTop[0] - position.coordinate.leftTop[0]
            if (curDistance > maxDistance) {
              maxIndex = position.index
              maxDistance = curDistance
            }
          }
          // 当前光标在后
          else if (position.coordinate.leftTop[0] <= leftTop[0] && position.coordinate.rightTop[0] >= leftTop[0]) {
            const curDistance = position.coordinate.rightTop[0] - leftTop[0]
            if (curDistance > maxDistance) {
              maxIndex = position.index
              maxDistance = curDistance
            }
          }
          // 匹配不到
          if (p === probablePosition.length - 1 && maxIndex === 0) {
            maxIndex = position.index
          }
        }
        this.range.setRange(0, 0)
        this.draw.render({ curIndex: maxIndex, isSubmitHistory: false })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.Z) {
      this.historyManager.undo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.Y) {
      this.historyManager.redo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.C) {
      if (!isCollspace) {
        writeText(elementList.slice(startIndex + 1, endIndex + 1).map(p => p.value).join(''))
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.X) {
      if (!isCollspace) {
        writeText(position.slice(startIndex + 1, endIndex + 1).map(p => p.value).join(''))
        elementList.splice(startIndex + 1, endIndex - startIndex)
        this.range.setRange(0, 0)
        this.draw.render({ curIndex: startIndex })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.A) {
      this.range.setRange(0, position.length - 1)
      this.draw.render({ isSubmitHistory: false, isSetCursor: false })
    }
  }

  public input(data: string) {
    if (!this.cursor) return
    const cursorPosition = this.position.getCursorPosition()
    if (!data || !cursorPosition || this.isCompositing) return
    const elementList = this.draw.getElementList()
    const agentDom = this.cursor.getAgentDom()
    agentDom.value = ''
    const { index } = cursorPosition
    const { startIndex, endIndex } = this.range.getRange()
    const isCollspace = startIndex === endIndex
    const inputData: IElement[] = data.split('').map(value => ({
      value
    }))
    if (isCollspace) {
      elementList.splice(index + 1, 0, ...inputData)
    } else {
      elementList.splice(startIndex + 1, endIndex - startIndex, ...inputData)
    }
    this.range.setRange(0, 0)
    this.draw.render({ curIndex: (isCollspace ? index : startIndex) + inputData.length })
  }

  public paste(evt: ClipboardEvent) {
    const text = evt.clipboardData?.getData('text')
    this.input(text || '')
    evt.preventDefault()
  }

  public compositionstart() {
    this.isCompositing = true
  }

  public compositionend() {
    this.isCompositing = false
  }

}