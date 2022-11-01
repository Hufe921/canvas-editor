import { ElementType, IEditorOption, RowFlex } from '../..'
import { ZERO } from '../../dataset/constant/Common'
import { EDITOR_ELEMENT_COPY_ATTR } from '../../dataset/constant/Element'
import { ElementStyleKey } from '../../dataset/enum/ElementStyle'
import { MouseEventButton } from '../../dataset/enum/Event'
import { KeyMap } from '../../dataset/enum/KeyMap'
import { IElement } from '../../interface/Element'
import { ICurrentPosition } from '../../interface/Position'
import { writeElementList } from '../../utils/clipboard'
import { Cursor } from '../cursor/Cursor'
import { Draw } from '../draw/Draw'
import { HyperlinkParticle } from '../draw/particle/HyperlinkParticle'
import { TableTool } from '../draw/particle/table/TableTool'
import { HistoryManager } from '../history/HistoryManager'
import { Listener } from '../listener/Listener'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { LETTER_REG, NUMBER_LIKE_REG } from '../../dataset/constant/Regular'
import { Control } from '../draw/control/Control'
import { CheckboxControl } from '../draw/control/checkbox/CheckboxControl'
import { splitText, threeClick } from '../../utils'
import { Previewer } from '../draw/particle/previewer/Previewer'
import { DeepRequired } from '../../interface/Common'
import { DateParticle } from '../draw/particle/date/DateParticle'

export class CanvasEvent {

  private isAllowDrag: boolean
  private isCompositing: boolean
  private mouseDownStartPosition: ICurrentPosition | null

  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private position: Position
  private range: RangeManager
  private cursor: Cursor | null
  private historyManager: HistoryManager
  private previewer: Previewer
  private tableTool: TableTool
  private hyperlinkParticle: HyperlinkParticle
  private dateParticle: DateParticle
  private listener: Listener
  private control: Control

  constructor(draw: Draw) {
    this.isAllowDrag = false
    this.isCompositing = false
    this.mouseDownStartPosition = null

    this.pageContainer = draw.getPageContainer()
    this.pageList = draw.getPageList()
    this.draw = draw
    this.options = draw.getOptions()
    this.cursor = null
    this.position = this.draw.getPosition()
    this.range = this.draw.getRange()
    this.historyManager = this.draw.getHistoryManager()
    this.previewer = this.draw.getPreviewer()
    this.tableTool = this.draw.getTableTool()
    this.hyperlinkParticle = this.draw.getHyperlinkParticle()
    this.dateParticle = this.draw.getDateParticle()
    this.listener = this.draw.getListener()
    this.control = this.draw.getControl()
  }

  public register() {
    // 延迟加载
    this.cursor = this.draw.getCursor()
    this.pageContainer.addEventListener('mousedown', this.mousedown.bind(this))
    this.pageContainer.addEventListener('mouseleave', this.mouseleave.bind(this))
    this.pageContainer.addEventListener('mousemove', this.mousemove.bind(this))
    this.pageContainer.addEventListener('dblclick', this.dblclick.bind(this))
    threeClick(this.pageContainer, this.threeClick.bind(this))
  }

  public setIsAllowDrag(payload: boolean) {
    this.isAllowDrag = payload
    if (!payload) {
      this.applyPainterStyle()
    }
  }

  public clearPainterStyle() {
    this.pageList.forEach(p => {
      p.style.cursor = 'text'
    })
    this.draw.setPainterStyle(null)
  }

  public applyPainterStyle() {
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
    this.draw.render({ isSetCursor: false })
    // 清除格式刷
    const painterOptions = this.draw.getPainterOptions()
    if (!painterOptions || !painterOptions.isDblclick) {
      this.clearPainterStyle()
    }
  }

  public mousemove(evt: MouseEvent) {
    if (!this.isAllowDrag || !this.mouseDownStartPosition) return
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
    const {
      index,
      isTable,
      tdValueIndex,
      tdIndex,
      trIndex,
      tableId
    } = positionResult
    const {
      index: startIndex,
      isTable: startIsTable,
      tdIndex: startTdIndex,
      trIndex: startTrIndex
    } = this.mouseDownStartPosition
    const endIndex = isTable ? tdValueIndex! : index
    // 判断是否是表格跨行/列
    if (isTable && startIsTable && (tdIndex !== startTdIndex || trIndex !== startTrIndex)) {
      this.range.setRange(
        endIndex,
        endIndex,
        tableId,
        startTdIndex,
        tdIndex,
        startTrIndex,
        trIndex
      )
    } else {
      let end = ~endIndex ? endIndex : 0
      // 开始位置
      let start = startIndex
      if (start > end) {
        [start, end] = [end, start]
      }
      if (start === end) return
      this.range.setRange(start, end)
    }
    // 绘制
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isComputeRowList: false
    })
  }

  public mousedown(evt: MouseEvent) {
    if (evt.button === MouseEventButton.RIGHT) return
    const isReadonly = this.draw.isReadonly()
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
    // 激活控件
    if (positionResult.isControl && !isReadonly) {
      const {
        index,
        isTable,
        trIndex,
        tdIndex,
        tdValueIndex
      } = positionResult
      const { newIndex } = this.control.moveCursor({
        index,
        isTable,
        trIndex,
        tdIndex,
        tdValueIndex
      })
      if (isTable) {
        positionResult.tdValueIndex = newIndex
      } else {
        positionResult.index = newIndex
      }
    }
    const {
      index,
      isDirectHit,
      isCheckbox,
      isControl,
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
      isCheckbox: isCheckbox || false,
      isControl: isControl || false,
      index,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId
    })
    // 记录选区开始位置
    this.mouseDownStartPosition = {
      ...positionResult,
      index: isTable ? tdValueIndex! : index
    }
    const elementList = this.draw.getElementList()
    const positionList = this.position.getPositionList()
    const curIndex = isTable ? tdValueIndex! : index
    const curElement = elementList[curIndex]
    // 绘制
    const isDirectHitImage = !!(isDirectHit && isImage)
    const isDirectHitCheckbox = !!(isDirectHit && isCheckbox)
    if (~index) {
      this.range.setRange(curIndex, curIndex)
      this.position.setCursorPosition(positionList[curIndex])
      // 复选框
      const isSetCheckbox = isDirectHitCheckbox && !isReadonly
      if (isSetCheckbox) {
        const { checkbox } = curElement
        if (checkbox) {
          checkbox.value = !checkbox.value
        } else {
          curElement.checkbox = {
            value: true
          }
        }
        const activeControl = this.control.getActiveControl()
        if (activeControl instanceof CheckboxControl) {
          activeControl.setSelect()
        }
      }
      this.draw.render({
        curIndex,
        isSubmitHistory: isSetCheckbox,
        isSetCursor: !isDirectHitImage && !isDirectHitCheckbox,
        isComputeRowList: false
      })
    }
    // 预览工具组件
    this.previewer.clearResizer()
    if (isDirectHitImage && !isReadonly) {
      this.previewer.drawResizer(curElement, positionList[curIndex],
        curElement.type === ElementType.LATEX
          ? {
            mime: 'svg',
            srcKey: 'laTexSVG'
          }
          : {})
    }
    // 表格工具组件
    this.tableTool.dispose()
    if (isTable && !isReadonly) {
      const originalElementList = this.draw.getOriginalElementList()
      const originalPositionList = this.position.getOriginalPositionList()
      this.tableTool.render(originalElementList[index], originalPositionList[index])
    }
    // 超链接
    this.hyperlinkParticle.clearHyperlinkPopup()
    if (curElement.type === ElementType.HYPERLINK) {
      this.hyperlinkParticle.drawHyperlinkPopup(curElement, positionList[curIndex])
    }
    // 日期控件
    this.dateParticle.clearDatePicker()
    if (curElement.type === ElementType.DATE && !isReadonly) {
      this.dateParticle.renderDatePicker(curElement, positionList[curIndex])
    }
  }

  public mouseleave(evt: MouseEvent) {
    // 是否还在canvas内部
    const { x, y, width, height } = this.pageContainer.getBoundingClientRect()
    if (evt.x >= x && evt.x <= x + width && evt.y >= y && evt.y <= y + height) return
    this.setIsAllowDrag(false)
  }

  public keydown(evt: KeyboardEvent) {
    const isReadonly = this.draw.isReadonly()
    const cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    const elementList = this.draw.getElementList()
    const position = this.position.getPositionList()
    const { index } = cursorPosition
    const { startIndex, endIndex } = this.range.getRange()
    const isCollapsed = startIndex === endIndex
    // 当前激活控件
    const isPartRangeInControlOutside = this.control.isPartRangeInControlOutside()
    const activeControl = this.control.getActiveControl()
    if (evt.key === KeyMap.Backspace) {
      if (isReadonly || isPartRangeInControlOutside) return
      let curIndex: number
      if (activeControl) {
        curIndex = this.control.keydown(evt)
      } else {
        // 判断是否允许删除
        if (isCollapsed && elementList[index].value === ZERO && index === 0) {
          evt.preventDefault()
          return
        }
        if (!isCollapsed) {
          elementList.splice(startIndex + 1, endIndex - startIndex)
        } else {
          elementList.splice(index, 1)
        }
        curIndex = isCollapsed ? index - 1 : startIndex
      }
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
    } else if (evt.key === KeyMap.Delete) {
      if (isReadonly || isPartRangeInControlOutside) return
      let curIndex: number
      if (activeControl) {
        curIndex = this.control.keydown(evt)
      } else if (elementList[endIndex + 1]?.type === ElementType.CONTROL) {
        curIndex = this.control.removeControl(endIndex + 1)
      } else {
        if (!isCollapsed) {
          elementList.splice(startIndex + 1, endIndex - startIndex)
        } else {
          elementList.splice(index + 1, 1)
        }
        curIndex = isCollapsed ? index : startIndex
      }
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
    } else if (evt.key === KeyMap.Enter) {
      if (isReadonly || isPartRangeInControlOutside) return
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
      let curIndex: number
      if (activeControl) {
        curIndex = this.control.setValue([enterText])
      } else {
        if (isCollapsed) {
          elementList.splice(index + 1, 0, enterText)
        } else {
          elementList.splice(startIndex + 1, endIndex - startIndex, enterText)
        }
        curIndex = index + 1
      }
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
      evt.preventDefault()
    } else if (evt.key === KeyMap.Left) {
      if (isReadonly) return
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
      if (isReadonly) return
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
      if (isReadonly) return
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
      if (isReadonly) return
      this.historyManager.undo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.Y) {
      if (isReadonly) return
      this.historyManager.redo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.C) {
      this.copy()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key.toLocaleLowerCase() === KeyMap.X) {
      if (isReadonly) return
      if (evt.shiftKey) {
        this.strikeout()
      } else {
        this.cut()
      }
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.A) {
      this.selectAll()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.S) {
      if (isReadonly) return
      if (this.listener.saved) {
        this.listener.saved(this.draw.getValue())
      }
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.LEFT_BRACKET) {
      this.sizeAdd()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.RIGHT_BRACKET) {
      this.sizeMinus()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.B) {
      this.bold()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.I) {
      this.italic()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.U) {
      this.underline()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.shiftKey && evt.key === KeyMap.RIGHT_ANGLE_BRACKET) {
      this.superscript()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.shiftKey && evt.key === KeyMap.LEFT_ANGLE_BRACKET) {
      this.subscript()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.L) {
      this.rowFlex(RowFlex.LEFT)
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.E) {
      this.rowFlex(RowFlex.CENTER)
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.R) {
      this.rowFlex(RowFlex.RIGHT)
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.J) {
      this.rowFlex(RowFlex.ALIGNMENT)
      evt.preventDefault()
    } else if (evt.key === KeyMap.ESC) {
      this.clearPainterStyle()
      evt.preventDefault()
    } else if (evt.key === KeyMap.TAB) {
      this.draw.insertElementList([{
        type: ElementType.TAB,
        value: ''
      }])
      evt.preventDefault()
    }
  }

  public dblclick() {
    const cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    const { value, index } = cursorPosition
    const elementList = this.draw.getElementList()
    // 判断是否是数字或英文
    let upCount = 0
    let downCount = 0
    const isNumber = NUMBER_LIKE_REG.test(value)
    if (isNumber || LETTER_REG.test(value)) {
      // 向上查询
      let upStartIndex = index - 1
      while (upStartIndex > 0) {
        const value = elementList[upStartIndex].value
        if ((isNumber && NUMBER_LIKE_REG.test(value)) || (!isNumber && LETTER_REG.test(value))) {
          upCount++
          upStartIndex--
        } else {
          break
        }
      }
      // 向下查询
      let downStartIndex = index + 1
      while (downStartIndex < elementList.length) {
        const value = elementList[downStartIndex].value
        if ((isNumber && NUMBER_LIKE_REG.test(value)) || (!isNumber && LETTER_REG.test(value))) {
          downCount++
          downStartIndex++
        } else {
          break
        }
      }
    }
    // 设置选中区域
    this.range.setRange(index - upCount - 1, index + downCount)
    // 刷新文档
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isComputeRowList: false
    })
  }

  public threeClick() {
    const cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    const elementList = this.draw.getElementList()
    // 判断是否是零宽字符
    let upCount = 0
    let downCount = 0
    // 向上查询
    let upStartIndex = index - 1
    while (upStartIndex > 0) {
      const value = elementList[upStartIndex].value
      if (value !== ZERO) {
        upCount++
        upStartIndex--
      } else {
        break
      }
    }
    // 向下查询
    let downStartIndex = index + 1
    while (downStartIndex < elementList.length) {
      const value = elementList[downStartIndex].value
      if (value !== ZERO) {
        downCount++
        downStartIndex++
      } else {
        break
      }
    }
    // 设置选中区域
    this.range.setRange(index - upCount - 1, index + downCount)
    // 刷新文档
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isComputeRowList: false
    })
  }

  public input(data: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    if (!this.cursor) return
    const cursorPosition = this.position.getCursorPosition()
    if (!data || !cursorPosition || this.isCompositing) return
    if (this.control.isPartRangeInControlOutside()) {
      // 忽略选区部分在控件的输入
      return
    }
    const activeControl = this.control.getActiveControl()
    const { TEXT, HYPERLINK, SUBSCRIPT, SUPERSCRIPT, DATE } = ElementType
    const text = data.replaceAll(`\n`, ZERO)
    const elementList = this.draw.getElementList()
    const agentDom = this.cursor.getAgentDom()
    agentDom.value = ''
    const { index } = cursorPosition
    const { startIndex, endIndex } = this.range.getRange()
    const isCollapsed = startIndex === endIndex
    // 表格需要上下文信息
    const positionContext = this.position.getPositionContext()
    let restArg = {}
    if (positionContext.isTable) {
      const { tdId, trId, tableId } = positionContext
      restArg = { tdId, trId, tableId }
    }
    const element = elementList[endIndex]
    const inputData: IElement[] = splitText(text).map(value => {
      const newElement: IElement = {
        value,
        ...restArg
      }
      const nextElement = elementList[endIndex + 1]
      if (
        element.type === TEXT
        || (!element.type && element.value !== ZERO)
        || (element.type === HYPERLINK && nextElement?.type === HYPERLINK)
        || (element.type === DATE && nextElement?.type === DATE)
        || (element.type === SUBSCRIPT && nextElement?.type === SUBSCRIPT)
        || (element.type === SUPERSCRIPT && nextElement?.type === SUPERSCRIPT)
      ) {
        EDITOR_ELEMENT_COPY_ATTR.forEach(attr => {
          const value = element[attr] as never
          if (value !== undefined) {
            newElement[attr] = value
          }
        })
      }
      return newElement
    })
    // 控件-移除placeholder
    let curIndex: number
    if (activeControl && elementList[endIndex + 1]?.controlId === element.controlId) {
      curIndex = this.control.setValue(inputData)
    } else {
      let start = 0
      if (isCollapsed) {
        start = index + 1
      } else {
        start = startIndex + 1
        elementList.splice(startIndex + 1, endIndex - startIndex)
      }
      // 禁止直接使用解构存在性能问题
      for (let i = 0; i < inputData.length; i++) {
        elementList.splice(start + i, 0, inputData[i])
      }
      curIndex = (isCollapsed ? index : startIndex) + inputData.length
    }
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public cut() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const isPartRangeInControlOutside = this.control.isPartRangeInControlOutside()
    if (isPartRangeInControlOutside) return
    const activeControl = this.control.getActiveControl()
    const { startIndex, endIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    if (startIndex !== endIndex) {
      writeElementList(elementList.slice(startIndex + 1, endIndex + 1), this.options)
      let curIndex: number
      if (activeControl) {
        curIndex = this.control.cut()
      } else {
        elementList.splice(startIndex + 1, endIndex - startIndex)
        curIndex = startIndex
      }
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
    }
  }

  public copy() {
    const { startIndex, endIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    if (startIndex !== endIndex) {
      writeElementList(elementList.slice(startIndex + 1, endIndex + 1), this.options)
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

  public sizeAdd() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
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
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
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
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noBoldIndex = selection.findIndex(s => !s.bold)
    selection.forEach(el => {
      el.bold = !!~noBoldIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public italic() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noItalicIndex = selection.findIndex(s => !s.italic)
    selection.forEach(el => {
      el.italic = !!~noItalicIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public underline() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noUnderlineIndex = selection.findIndex(s => !s.underline)
    selection.forEach(el => {
      el.underline = !!~noUnderlineIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public strikeout() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noStrikeoutIndex = selection.findIndex(s => !s.strikeout)
    selection.forEach(el => {
      el.strikeout = !!~noStrikeoutIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public superscript() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const selection = this.range.getSelection()
    if (!selection) return
    const superscriptIndex = selection.findIndex(s => s.type === ElementType.SUPERSCRIPT)
    selection.forEach(el => {
      // 取消上标
      if (~superscriptIndex) {
        if (el.type === ElementType.SUPERSCRIPT) {
          el.type = ElementType.TEXT
          delete el.actualSize
        }
      } else {
        // 设置上标
        if (!el.type || el.type === ElementType.TEXT || el.type === ElementType.SUBSCRIPT) {
          el.type = ElementType.SUPERSCRIPT
        }
      }
    })
    this.draw.render({ isSetCursor: false })
  }

  public subscript() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const selection = this.range.getSelection()
    if (!selection) return
    const subscriptIndex = selection.findIndex(s => s.type === ElementType.SUBSCRIPT)
    selection.forEach(el => {
      // 取消下标
      if (~subscriptIndex) {
        if (el.type === ElementType.SUBSCRIPT) {
          el.type = ElementType.TEXT
          delete el.actualSize
        }
      } else {
        // 设置下标
        if (!el.type || el.type === ElementType.TEXT || el.type === ElementType.SUPERSCRIPT) {
          el.type = ElementType.SUBSCRIPT
        }
      }
    })
    this.draw.render({ isSetCursor: false })
  }

  public rowFlex(payload: RowFlex) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const pageNo = this.draw.getPageNo()
    const positionList = this.position.getPositionList()
    // 开始/结束行号
    const startRowNo = positionList[startIndex].rowNo
    const endRowNo = positionList[endIndex].rowNo
    const elementList = this.draw.getElementList()
    // 当前选区所在行
    for (let p = 0; p < positionList.length; p++) {
      const position = positionList[p]
      if (position.pageNo !== pageNo) continue
      if (position.rowNo > endRowNo) break
      if (position.rowNo >= startRowNo && position.rowNo <= endRowNo) {
        elementList[p].rowFlex = payload
      }
    }
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public compositionstart() {
    this.isCompositing = true
  }

  public compositionend() {
    this.isCompositing = false
  }

}