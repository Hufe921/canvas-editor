import { ZERO } from "../../dataset/constant/Common"
import { ElementStyleKey } from "../../dataset/enum/ElementStyle"
import { MouseEventButton } from "../../dataset/enum/Event"
import { KeyMap } from "../../dataset/enum/Keymap"
import { IElement } from "../../interface/Element"
import { writeTextByElementList } from "../../utils/clipboard"
import { Cursor } from "../cursor/Cursor"
import { Draw } from "../draw/Draw"
import { ImageParticle } from "../draw/particle/ImageParticle"
import { TableTool } from "../draw/particle/table/TableTool"
import { HistoryManager } from "../history/HistoryManager"
import { Position } from "../position/Position"
import { RangeManager } from "../range/RangeManager"

export class CanvasEvent {

  private isAllowDrag: boolean
  private isCompositing: boolean
  private mouseDownStartIndex: number

  private draw: Draw
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private position: Position
  private range: RangeManager
  private cursor: Cursor | null
  private historyManager: HistoryManager
  private imageParticle: ImageParticle
  private tableTool: TableTool

  constructor(draw: Draw) {
    this.isAllowDrag = false
    this.isCompositing = false
    this.mouseDownStartIndex = 0

    this.pageContainer = draw.getPageContainer()
    this.pageList = draw.getPageList()
    this.draw = draw
    this.cursor = null
    this.position = this.draw.getPosition()
    this.range = this.draw.getRange()
    this.historyManager = this.draw.getHistoryManager()
    this.imageParticle = this.draw.getImageParticle()
    this.tableTool = this.draw.getTableTool()
  }

  public register() {
    // 延迟加载
    this.cursor = this.draw.getCursor()
    this.pageContainer.addEventListener('mousedown', this.mousedown.bind(this))
    this.pageContainer.addEventListener('mouseleave', this.mouseleave.bind(this))
    this.pageContainer.addEventListener('mousemove', this.mousemove.bind(this))
  }

  public setIsAllowDrag(payload: boolean) {
    this.isAllowDrag = payload
    if (payload === false) {
      this.pageList.forEach(p => {
        p.style.cursor = 'text'
      })
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
    const target = evt.target as HTMLDivElement
    const pageIndex = target.dataset.index
    // 设置pageNo
    if (pageIndex) {
      this.draw.setPageNo(Number(pageIndex))
    }
    // 结束位置
    const positionResult = this.position.getPositionByXY({
      x: evt.offsetX,
      y: evt.offsetY
    })
    const { index, isTable, tdValueIndex } = positionResult
    let endIndex = isTable ? tdValueIndex! : index
    let end = ~endIndex ? endIndex : 0
    // 开始位置
    let start = this.mouseDownStartIndex
    if (start > end) {
      [start, end] = [end, start]
    }
    this.range.setRange(start, end)
    if (start === end) return
    // 绘制
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isComputeRowList: false
    })
  }

  public mousedown(evt: MouseEvent) {
    if (evt.button === MouseEventButton.RIGHT) return
    const target = evt.target as HTMLDivElement
    const pageIndex = target.dataset.index
    // 设置pageNo
    if (pageIndex) {
      this.draw.setPageNo(Number(pageIndex))
    }
    this.isAllowDrag = true
    const positionResult = this.position.getPositionByXY({
      x: evt.offsetX,
      y: evt.offsetY
    })
    const {
      index,
      isDirectHit,
      isImage,
      isTable,
      trIndex,
      tdIndex,
      tdValueIndex,
      tdId,
      trId,
      tableId
    } = positionResult
    // 设置位置上下文
    this.position.setPositionContext({
      isTable: isTable || false,
      index,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId
    })
    // 记录选区开始位置
    this.mouseDownStartIndex = isTable ? tdValueIndex! : index
    // 绘制
    const isDirectHitImage = isDirectHit && isImage
    if (~index) {
      let curIndex = index
      if (isTable) {
        this.range.setRange(tdValueIndex!, tdValueIndex!)
        curIndex = tdValueIndex!
      } else {
        this.range.setRange(index, index)
      }
      this.draw.render({
        curIndex,
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
      const curIndex = isTable ? tdValueIndex! : index
      this.imageParticle.drawResizer(elementList[curIndex], positionList[curIndex])
    }
    // 表格工具组件
    this.tableTool.dispose()
    if (isTable) {
      const elementList = this.draw.getOriginalElementList()
      const positionList = this.position.getOriginalPositionList()
      this.tableTool.render(elementList[index], positionList[index])
    }
  }

  public mouseleave(evt: MouseEvent) {
    // 是否还在canvas内部
    const { x, y, width, height } = this.pageContainer.getBoundingClientRect()
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
    } else if (evt.key === KeyMap.Delete) {
      if (!isCollspace) {
        elementList.splice(startIndex + 1, endIndex - startIndex)
      } else {
        elementList.splice(index + 1, 1)
      }
      const curIndex = isCollspace ? index : startIndex
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
    } else if (evt.key === KeyMap.Enter) {
      // 表格需要上下文信息
      const positionContext = this.position.getPositionContext()
      let restArg = {}
      if (positionContext.isTable) {
        const { tdId, trId, tableId } = positionContext
        restArg = { tdId, trId, tableId }
      }
      const enterText: IElement = {
        value: ZERO,
        ...restArg
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
      this.copy()
    } else if (evt.ctrlKey && evt.key === KeyMap.X) {
      this.cut()
    } else if (evt.ctrlKey && evt.key === KeyMap.A) {
      this.selectAll()
    }
  }

  public input(data: string) {
    if (!this.cursor) return
    const cursorPosition = this.position.getCursorPosition()
    if (!data || !cursorPosition || this.isCompositing) return
    const text = data.replaceAll(`\n`, ZERO)
    const elementList = this.draw.getElementList()
    const agentDom = this.cursor.getAgentDom()
    agentDom.value = ''
    const { index } = cursorPosition
    const { startIndex, endIndex } = this.range.getRange()
    const isCollspace = startIndex === endIndex
    // 表格需要上下文信息
    const positionContext = this.position.getPositionContext()
    let restArg = {}
    if (positionContext.isTable) {
      const { tdId, trId, tableId } = positionContext
      restArg = { tdId, trId, tableId }
    }
    const element = elementList[endIndex]
    const inputData: IElement[] = text.split('').map(value => ({
      value,
      font: element.font,
      size: element.size,
      bold: element.bold,
      color: element.color,
      highlight: element.highlight,
      italic: element.italic,
      underline: element.underline,
      strikeout: element.strikeout,
      ...restArg
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

  public cut() {
    const { startIndex, endIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    if (startIndex !== endIndex) {
      writeTextByElementList(elementList.slice(startIndex + 1, endIndex + 1))
      elementList.splice(startIndex + 1, endIndex - startIndex)
      const curIndex = startIndex
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
    }
  }

  public copy() {
    const { startIndex, endIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    if (startIndex !== endIndex) {
      writeTextByElementList(elementList.slice(startIndex + 1, endIndex + 1))
    }
  }

  public selectAll() {
    const position = this.position.getPositionList()
    this.range.setRange(0, position.length - 1)
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isComputeRowList: false
    })
  }

  public compositionstart() {
    this.isCompositing = true
  }

  public compositionend() {
    this.isCompositing = false
  }

}