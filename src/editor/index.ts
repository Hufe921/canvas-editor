import './assets/css/index.css'
import { ZERO } from './dataset/constant/Common'
import { KeyMap } from './dataset/enum/Keymap'
import { deepClone, writeText } from './utils'
import { HistoryManager } from './core/history/HistoryManager'
import { IRange } from './interface/Range'
import { IRow } from './interface/Row'
import { IDrawOption } from './interface/Draw'
import { IEditorOption } from './interface/Editor'
import { IElement, IElementPosition } from './interface/Element'

export default class Editor {

  private readonly defaultOptions: Required<IEditorOption> = {
    defaultType: 'TEXT',
    defaultFont: 'Yahei',
    defaultSize: 16,
    rangeAlpha: 0.6,
    rangeColor: '#AECBFA',
    marginIndicatorSize: 35,
    marginIndicatorColor: '#BABABA',
    margins: [100, 120, 100, 120]
  }

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  private options: Required<IEditorOption>
  private elementList: IElement[]
  private position: IElementPosition[]
  private range: IRange

  private cursorPosition: IElementPosition | null
  private cursorDom: HTMLDivElement
  private textareaDom: HTMLTextAreaElement
  private isCompositing: boolean
  private isAllowDrag: boolean
  private rowCount: number
  private mouseDownStartIndex: number

  private historyManager: HistoryManager

  constructor(canvas: HTMLCanvasElement, data: IElement[], options: IEditorOption = {}) {
    this.options = {
      ...this.defaultOptions,
      ...options
    };
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio;
    canvas.width = parseInt(canvas.style.width) * dpr;
    canvas.height = parseInt(canvas.style.height) * dpr;
    canvas.style.cursor = 'text'
    this.canvas = canvas
    this.ctx = ctx as CanvasRenderingContext2D
    this.ctx.scale(dpr, dpr)
    this.elementList = []
    this.position = []
    this.cursorPosition = null
    this.isCompositing = false
    this.isAllowDrag = false
    this.range = {
      startIndex: 0,
      endIndex: 0
    }
    this.rowCount = 0
    this.mouseDownStartIndex = 0

    // 历史管理
    this.historyManager = new HistoryManager()

    // 全局事件
    document.addEventListener('click', (evt) => {
      const innerDoms = [this.canvas, this.cursorDom, this.textareaDom, document.body]
      if (innerDoms.includes(evt.target as any)) return
      this.recoveryCursor()
    })
    document.addEventListener('mouseup', () => {
      this.isAllowDrag = false
    })

    // 事件监听转发
    const textarea = document.createElement('textarea')
    textarea.autocomplete = 'off'
    textarea.classList.add('inputarea')
    textarea.innerText = ''
    textarea.onkeydown = (evt: KeyboardEvent) => this.handleKeydown(evt)
    textarea.oninput = (evt: Event) => {
      const data = (evt as InputEvent).data
      setTimeout(() => this.handleInput(data || ''))
    }
    textarea.onpaste = (evt: ClipboardEvent) => this.handlePaste(evt)
    textarea.addEventListener('compositionstart', this.handleCompositionstart.bind(this))
    textarea.addEventListener('compositionend', this.handleCompositionend.bind(this))
    this.canvas.parentNode?.append(textarea)
    this.textareaDom = textarea

    // 光标
    this.cursorDom = document.createElement('div')
    this.cursorDom.classList.add('cursor')
    this.canvas.parentNode?.append(this.cursorDom)

    // canvas原生事件
    canvas.addEventListener('mousedown', this.setCursor.bind(this))
    canvas.addEventListener('mousedown', this.handleMousedown.bind(this))
    canvas.addEventListener('mouseleave', this.handleMouseleave.bind(this))
    canvas.addEventListener('mousemove', this.handleMousemove.bind(this))

    // 启动
    const isZeroStart = data[0].value === ZERO
    if (!isZeroStart) {
      data.unshift({
        value: ZERO
      })
    }
    data.forEach(text => {
      if (text.value === '\n') {
        text.value = ZERO
      }
    })
    this.elementList = data
    this.draw()
  }

  private draw(options?: IDrawOption) {
    let { curIndex, isSubmitHistory = true, isSetCursor = true } = options || {}
    // 清除光标
    this.recoveryCursor()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.position = []
    // 基础信息
    const { defaultSize, defaultFont, margins, marginIndicatorColor, marginIndicatorSize } = this.options
    const canvasRect = this.canvas.getBoundingClientRect()
    const canvasWidth = canvasRect.width
    const canvasHeight = canvasRect.height
    // 绘制页边距
    this.ctx.save()
    this.ctx.strokeStyle = marginIndicatorColor
    this.ctx.beginPath()
    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    const rightTopPoint: [number, number] = [canvasWidth - margins[1], margins[0]]
    const leftBottomPoint: [number, number] = [margins[3], canvasHeight - margins[2]]
    const rightBottomPoint: [number, number] = [canvasWidth - margins[1], canvasHeight - margins[2]]
    // 上左
    this.ctx.moveTo(leftTopPoint[0] - marginIndicatorSize, leftTopPoint[1])
    this.ctx.lineTo(...leftTopPoint)
    this.ctx.lineTo(leftTopPoint[0], leftTopPoint[1] - marginIndicatorSize)
    // 上右
    this.ctx.moveTo(rightTopPoint[0] + marginIndicatorSize, rightTopPoint[1])
    this.ctx.lineTo(...rightTopPoint)
    this.ctx.lineTo(rightTopPoint[0], rightTopPoint[1] - marginIndicatorSize)
    // 下左
    this.ctx.moveTo(leftBottomPoint[0] - marginIndicatorSize, leftBottomPoint[1])
    this.ctx.lineTo(...leftBottomPoint)
    this.ctx.lineTo(leftBottomPoint[0], leftBottomPoint[1] + marginIndicatorSize)
    // 下右
    this.ctx.moveTo(rightBottomPoint[0] + marginIndicatorSize, rightBottomPoint[1])
    this.ctx.lineTo(...rightBottomPoint)
    this.ctx.lineTo(rightBottomPoint[0], rightBottomPoint[1] + marginIndicatorSize)
    this.ctx.stroke()
    this.ctx.restore()
    // 计算行信息
    const rowList: IRow[] = []
    if (this.elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: []
      })
    }
    for (let i = 0; i < this.elementList.length; i++) {
      this.ctx.save()
      const curRow: IRow = rowList[rowList.length - 1]
      const element = this.elementList[i]
      this.ctx.font = `${element.bold ? 'bold ' : ''}${element.size || defaultSize}px ${element.font || defaultFont}`
      const metrics = this.ctx.measureText(element.value)
      const width = metrics.width
      const fontBoundingBoxAscent = metrics.fontBoundingBoxAscent
      const fontBoundingBoxDescent = metrics.fontBoundingBoxDescent
      const height = fontBoundingBoxAscent + fontBoundingBoxDescent
      const lineText = { ...element, metrics }
      if (curRow.width + width > rightTopPoint[0] - leftTopPoint[0] || (i !== 0 && element.value === ZERO)) {
        rowList.push({
          width,
          height: 0,
          elementList: [lineText],
          ascent: fontBoundingBoxAscent
        })
      } else {
        curRow.width += width
        if (curRow.height < height) {
          curRow.height = height
          curRow.ascent = fontBoundingBoxAscent
        }
        curRow.elementList.push(lineText)
      }
      this.ctx.restore()
    }
    // 渲染元素
    let x = leftTopPoint[0]
    let y = leftTopPoint[1]
    let index = 0
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i];
      for (let j = 0; j < curRow.elementList.length; j++) {
        this.ctx.save()
        const element = curRow.elementList[j];
        const metrics = element.metrics
        this.ctx.font = `${element.bold ? 'bold ' : ''}${element.size || defaultSize}px ${element.font || defaultFont}`
        if (element.color) {
          this.ctx.fillStyle = element.color
        }
        const positionItem: IElementPosition = {
          index,
          value: element.value,
          rowNo: i,
          metrics,
          lineHeight: curRow.height,
          isLastLetter: j === curRow.elementList.length - 1,
          coordinate: {
            leftTop: [x, y],
            leftBottom: [x, y + curRow.height],
            rightTop: [x + metrics.width, y],
            rightBottom: [x + metrics.width, y + curRow.height]
          }
        }
        this.position.push(positionItem)
        this.ctx.fillText(element.value, x, y + curRow.ascent)
        // 选区绘制
        const { startIndex, endIndex } = this.range
        if (startIndex !== endIndex && startIndex < index && index <= endIndex) {
          this.ctx.save()
          this.ctx.globalAlpha = this.options.rangeAlpha
          this.ctx.fillStyle = this.options.rangeColor
          this.ctx.fillRect(x, y, metrics.width, curRow.height)
          this.ctx.restore()
        }
        index++
        x += metrics.width
        this.ctx.restore()
      }
      x = leftTopPoint[0]
      y += curRow.height
    }
    // 光标重绘
    if (curIndex === undefined) {
      curIndex = this.position.length - 1
    }
    if (isSetCursor) {
      this.cursorPosition = this.position[curIndex!] || null
      this.drawCursor()
    }
    // canvas高度自适应计算
    const lastPosition = this.position[this.position.length - 1]
    const { coordinate: { leftBottom, leftTop } } = lastPosition
    if (leftBottom[1] > this.canvas.height) {
      const height = Math.ceil(leftBottom[1] + (leftBottom[1] - leftTop[1]))
      this.canvas.height = height
      this.canvas.style.height = `${height}px`
      this.draw({ curIndex, isSubmitHistory: false })
    }
    this.rowCount = rowList.length
    // 历史记录用于undo、redo
    if (isSubmitHistory) {
      const self = this
      const oldelementList = deepClone(this.elementList)
      this.historyManager.execute(function () {
        self.elementList = deepClone(oldelementList)
        self.draw({ curIndex, isSubmitHistory: false })
      })
    }
  }

  private getCursorPosition(evt: MouseEvent): number {
    const x = evt.offsetX
    const y = evt.offsetY
    let isTextArea = false
    for (let j = 0; j < this.position.length; j++) {
      const { index, coordinate: { leftTop, rightTop, leftBottom } } = this.position[j];
      // 命中元素
      if (leftTop[0] <= x && rightTop[0] >= x && leftTop[1] <= y && leftBottom[1] >= y) {
        let curPostionIndex = j
        // 判断是否元素中间前后
        if (this.elementList[index].value !== ZERO) {
          const valueWidth = rightTop[0] - leftTop[0]
          if (x < leftTop[0] + valueWidth / 2) {
            curPostionIndex = j - 1
          }
        }
        isTextArea = true
        return curPostionIndex
      }
    }
    // 非命中区域
    if (!isTextArea) {
      let isLastArea = false
      let curPostionIndex = -1
      // 判断所属行是否存在元素
      const firstLetterList = this.position.filter(p => p.isLastLetter)
      for (let j = 0; j < firstLetterList.length; j++) {
        const { index, coordinate: { leftTop, leftBottom } } = firstLetterList[j]
        if (y > leftTop[1] && y <= leftBottom[1]) {
          curPostionIndex = index
          isLastArea = true
          break
        }
      }
      if (!isLastArea) {
        return this.position.length - 1
      }
      return curPostionIndex
    }
    return -1
  }

  private setCursor(evt: MouseEvent) {
    const positionIndex = this.getCursorPosition(evt)
    if (~positionIndex) {
      this.range.startIndex = 0
      this.range.endIndex = 0
      setTimeout(() => {
        this.draw({ curIndex: positionIndex, isSubmitHistory: false })
      })
    }
  }

  private drawCursor() {
    if (!this.cursorPosition) return
    // 设置光标代理
    const { lineHeight, metrics, coordinate: { rightTop } } = this.cursorPosition
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
    this.textareaDom.focus()
    this.textareaDom.setSelectionRange(0, 0)
    const lineBottom = rightTop[1] + lineHeight
    const curosrleft = `${rightTop[0]}px`
    this.textareaDom.style.left = curosrleft
    this.textareaDom.style.top = `${lineBottom - 12}px`
    // 模拟光标显示
    this.cursorDom.style.left = curosrleft
    this.cursorDom.style.top = `${lineBottom - height}px`
    this.cursorDom.style.display = 'block'
    this.cursorDom.style.height = `${height}px`
    setTimeout(() => {
      this.cursorDom.classList.add('cursor--animation')
    }, 200)
  }

  private recoveryCursor() {
    this.cursorDom.style.display = 'none'
    this.cursorDom.classList.remove('cursor--animation')
  }

  private strokeRange() {
    this.draw({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  private clearRange() {
    this.range.startIndex = 0
    this.range.endIndex = 0
  }

  private handleMousemove(evt: MouseEvent) {
    if (!this.isAllowDrag) return
    // 结束位置
    const endIndex = this.getCursorPosition(evt)
    let end = ~endIndex ? endIndex : 0
    // 开始位置
    let start = this.mouseDownStartIndex
    if (start > end) {
      [start, end] = [end, start]
    }
    this.range.startIndex = start
    this.range.endIndex = end
    if (start === end) return
    // 绘制选区
    this.strokeRange()
  }

  private handleMousedown(evt: MouseEvent) {
    this.isAllowDrag = true
    this.mouseDownStartIndex = this.getCursorPosition(evt) || 0
  }

  private handleMouseleave(evt: MouseEvent) {
    // 是否还在canvas内部
    const { x, y, width, height } = this.canvas.getBoundingClientRect()
    if (evt.x >= x && evt.x <= x + width && evt.y >= y && evt.y <= y + height) return
    this.isAllowDrag = false
  }

  private handleKeydown(evt: KeyboardEvent) {
    if (!this.cursorPosition) return
    const { index } = this.cursorPosition
    const { startIndex, endIndex } = this.range
    const isCollspace = startIndex === endIndex
    if (evt.key === KeyMap.Backspace) {
      // 判断是否允许删除
      if (this.elementList[index].value === ZERO && index === 0) {
        evt.preventDefault()
        return
      }
      if (!isCollspace) {
        this.elementList.splice(startIndex + 1, endIndex - startIndex)
      } else {
        this.elementList.splice(index, 1)
      }
      this.clearRange()
      this.draw({ curIndex: isCollspace ? index - 1 : startIndex })
    } else if (evt.key === KeyMap.Enter) {
      const enterText: IElement = {
        value: ZERO
      }
      if (isCollspace) {
        this.elementList.splice(index + 1, 0, enterText)
      } else {
        this.elementList.splice(startIndex + 1, endIndex - startIndex, enterText)
      }
      this.clearRange()
      this.draw({ curIndex: index + 1 })
    } else if (evt.key === KeyMap.Left) {
      if (index > 0) {
        this.clearRange()
        this.draw({ curIndex: index - 1, isSubmitHistory: false })
      }
    } else if (evt.key === KeyMap.Right) {
      if (index < this.position.length - 1) {
        this.clearRange()
        this.draw({ curIndex: index + 1, isSubmitHistory: false })
      }
    } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
      const { rowNo, index, coordinate: { leftTop, rightTop } } = this.cursorPosition
      if ((evt.key === KeyMap.Up && rowNo !== 0) || (evt.key === KeyMap.Down && rowNo !== this.rowCount)) {
        // 下一个光标点所在行位置集合
        const probablePosition = evt.key === KeyMap.Up
          ? this.position.slice(0, index).filter(p => p.rowNo === rowNo - 1)
          : this.position.slice(index, this.position.length - 1).filter(p => p.rowNo === rowNo + 1)
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
        this.clearRange()
        this.draw({ curIndex: maxIndex, isSubmitHistory: false })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.Z) {
      this.historyManager.undo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.Y) {
      this.historyManager.redo()
      evt.preventDefault()
    } else if (evt.ctrlKey && evt.key === KeyMap.C) {
      if (!isCollspace) {
        writeText(this.elementList.slice(startIndex + 1, endIndex + 1).map(p => p.value).join(''))
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.X) {
      if (!isCollspace) {
        writeText(this.position.slice(startIndex + 1, endIndex + 1).map(p => p.value).join(''))
        this.elementList.splice(startIndex + 1, endIndex - startIndex)
        this.clearRange()
        this.draw({ curIndex: startIndex })
      }
    } else if (evt.ctrlKey && evt.key === KeyMap.A) {
      this.range.startIndex = 0
      this.range.endIndex = this.position.length - 1
      this.draw({ isSubmitHistory: false, isSetCursor: false })
    }
  }

  private handleInput(data: string) {
    if (!data || !this.cursorPosition || this.isCompositing) return
    this.textareaDom.value = ''
    const { index } = this.cursorPosition
    const { startIndex, endIndex } = this.range
    const isCollspace = startIndex === endIndex
    const inputData: IElement[] = data.split('').map(value => ({
      value
    }))
    if (isCollspace) {
      this.elementList.splice(index + 1, 0, ...inputData)
    } else {
      this.elementList.splice(startIndex + 1, endIndex - startIndex, ...inputData)
    }
    this.clearRange()
    this.draw({ curIndex: (isCollspace ? index : startIndex) + inputData.length })
  }

  private handlePaste(evt: ClipboardEvent) {
    const text = evt.clipboardData?.getData('text')
    this.handleInput(text || '')
    evt.preventDefault()
  }

  private handleCompositionstart() {
    this.isCompositing = true
  }

  private handleCompositionend() {
    this.isCompositing = false
  }

}