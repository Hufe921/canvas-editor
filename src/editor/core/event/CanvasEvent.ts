import { ZERO } from "../../dataset/constant/Common"
import { ElementStyleKey } from "../../dataset/enum/ElementStyle"
import { KeyMap } from "../../dataset/enum/Keymap"
import { IElement } from "../../interface/Element"
import { writeTextByElementList } from "../../utils/clipboard"
import { Cursor } from "../cursor/Cursor"
import { Draw } from "../draw/Draw"
import { ImageParticle } from "../draw/particle/ImageParticle"
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
  private imageParticle: ImageParticle

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
    this.imageParticle = this.draw.getImageParticle()
  }

  public register() {
    // 延迟加载
    this.cursor = this.draw.getCursor()
    this.canvas.addEventListener('mousedown', this.mousedown.bind(this))
    this.canvas.addEventListener('mouseleave', this.mouseleave.bind(this))
    this.canvas.addEventListener('mousemove', this.mousemove.bind(this))
  }

  public setIsAllowDrag(payload: boolean) {
    this.isAllowDrag = payload
    if (payload === false) {
      this.canvas.style.cursor = 'text'
      // 应用格式刷样式
      const painterStyle = this.draw.getPainterStyle()
      if (!painterStyle) return
      const selection = this.range.getSelection()
      if (!selection) return
      const painterStyleKeys = Object.keys(painterStyle)
      selection.forEach(s => {
        painterStyleKeys.forEach(pKey => {
          const key = pKey as keyof typeof ElementStyleKey
          s[key] = painterStyle[key] as any
        })
      })
      this.draw.setPainterStyle(null)
      this.draw.render({ isSetCursor: false })
    }
  }

  public mousemove(evt: MouseEvent) {
    if (!this.isAllowDrag) return
    // 结束位置
    const { index: endIndex } = this.draw.getPosition().getPositionByXY(evt.offsetX, evt.offsetY)
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
      isSetCursor: false,
      isComputeRowList: false
    })
  }

  public mousedown(evt: MouseEvent) {
    this.isAllowDrag = true
    const { index, isDirectHit, isImage } = this.draw.getPosition().getPositionByXY(evt.offsetX, evt.offsetY)
    // 记录选区开始位置
    this.mouseDownStartIndex = index
    // 绘制
    const isDirectHitImage = isDirectHit && isImage
    if (~index) {
      this.range.setRange(index, index)
      this.draw.render({
        curIndex: index,
        isSubmitHistory: false,
        isSetCursor: !isDirectHitImage,
        isComputeRowList: false
      })
    }
    // 图片尺寸拖拽组件
    this.imageParticle.clearResizer()
    if (isDirectHitImage) {
      const elementList = this.draw.getElementList()
      const positionList = this.position.getPositionList()
      this.imageParticle.drawResizer(elementList[index], positionList[index])
    }
  }

  public mouseleave(evt: MouseEvent) {
    // 是否还在canvas内部
    const { x, y, width, height } = this.canvas.getBoundingClientRect()
    if (evt.x >= x && evt.x <= x + width && evt.y >= y && evt.y <= y + height) return
    this.setIsAllowDrag(false)
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
      const curIndex = isCollspace ? index - 1 : startIndex
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
    } else if (evt.key === KeyMap.Enter) {
      const enterText: IElement = {
        value: ZERO
      }
      if (isCollspace) {
        elementList.splice(index + 1, 0, enterText)
      } else {
        elementList.splice(startIndex + 1, endIndex - startIndex, enterText)
      }
      const curIndex = index + 1
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
    } else if (evt.key === KeyMap.Left) {
      if (index > 0) {
        const curIndex = index - 1
        this.range.setRange(curIndex, curIndex)
        this.draw.render({
          curIndex,
          isSubmitHistory: false,
          isComputeRowList: false
        })
      }
    } else if (evt.key === KeyMap.Right) {
      if (index < position.length - 1) {
        const curIndex = index + 1
        this.range.setRange(curIndex, curIndex)
        this.draw.render({
          curIndex,
          isSubmitHistory: false,
          isComputeRowList: false
        })
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
        const curIndex = maxIndex
        this.range.setRange(curIndex, curIndex)
        this.draw.render({
          curIndex,
          isSubmitHistory: false,
          isComputeRowList: false
        })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.Z) {
      this.historyManager.undo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.Y) {
      this.historyManager.redo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.C) {
      if (!isCollspace) {
        writeTextByElementList(elementList.slice(startIndex + 1, endIndex + 1))
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.X) {
      if (!isCollspace) {
        writeTextByElementList(elementList.slice(startIndex + 1, endIndex + 1))
        elementList.splice(startIndex + 1, endIndex - startIndex)
        const curIndex = startIndex
        this.range.setRange(curIndex, curIndex)
        this.draw.render({ curIndex })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.A) {
      this.range.setRange(0, position.length - 1)
      this.draw.render({
        isSubmitHistory: false,
        isSetCursor: false,
        isComputeRowList: false
      })
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
    let start = 0
    if (isCollspace) {
      start = index + 1
    } else {
      start = startIndex + 1
      elementList.splice(startIndex + 1, endIndex - startIndex)
    }
    // 禁止直接使用解构存在性能问题
    for (let i = 0; i < inputData.length; i++) {
      elementList.splice(start + i, 0, inputData[i])
    }
    const curIndex = (isCollspace ? index : startIndex) + inputData.length
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public paste(evt: ClipboardEvent) {
    const text = evt.clipboardData?.getData('text')
    this.input(text?.replaceAll(`\n`, ZERO) || '')
    evt.preventDefault()
  }

  public compositionstart() {
    this.isCompositing = true
  }

  public compositionend() {
    this.isCompositing = false
  }

}