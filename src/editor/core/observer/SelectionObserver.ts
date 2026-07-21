import { MoveDirection } from '../../dataset/enum/Observer'
import { Draw } from '../draw/Draw'
import { RangeManager } from '../range/RangeManager'

export class SelectionObserver {
  // 每次滚动长度
  private readonly step: number = 5
  // 触发滚动阀值
  private readonly thresholdPoints: [
    top: number,
    down: number,
    left: number,
    right: number
  ] = [70, 40, 10, 20]

  private selectionContainer: Element | Document
  private rangeManager: RangeManager
  private requestAnimationFrameId: number | null
  private isMousedown: boolean
  private isMoving: boolean
  private clientWidth: number
  private clientHeight: number
  private containerRect: DOMRect | null

  constructor(draw: Draw) {
    this.rangeManager = draw.getRange()
    // 优先使用配置的滚动容器dom
    const { scrollContainerSelector } = draw.getOptions()
    this.selectionContainer = scrollContainerSelector
      ? document.querySelector(scrollContainerSelector) || document
      : document
    this.requestAnimationFrameId = null
    this.isMousedown = false
    this.isMoving = false
    // 缓存尺寸
    this.clientWidth = 0
    this.clientHeight = 0
    this.containerRect = null
    // 添加监听
    this._addEvent()
  }

  private _addEvent() {
    const container = <Document>this.selectionContainer
    container.addEventListener('mousedown', this._mousedown)
    container.addEventListener('mousemove', this._mousemove)
    container.addEventListener('mouseup', this._mouseup)
    document.addEventListener('mouseleave', this._mouseup)
  }

  public removeEvent() {
    const container = <Document>this.selectionContainer
    container.removeEventListener('mousedown', this._mousedown)
    container.removeEventListener('mousemove', this._mousemove)
    container.removeEventListener('mouseup', this._mouseup)
    document.removeEventListener('mouseleave', this._mouseup)
  }

  private _mousedown = () => {
    this.isMousedown = true
    // 更新容器宽高
    this.clientWidth =
      this.selectionContainer instanceof Document
        ? document.documentElement.clientWidth
        : this.selectionContainer.clientWidth
    this.clientHeight =
      this.selectionContainer instanceof Document
        ? document.documentElement.clientHeight
        : this.selectionContainer.clientHeight
    // 更新容器位置信息
    if (!(this.selectionContainer instanceof Document)) {
      const rect = this.selectionContainer.getBoundingClientRect()
      this.containerRect = rect
    }
  }

  private _mouseup = () => {
    this.isMousedown = false
    this._stopMove()
  }

  private _mousemove = (evt: MouseEvent) => {
    if (!this.isMousedown || this.rangeManager.getIsCollapsed()) return
    let { x, y } = evt
    if (this.containerRect) {
      x = x - this.containerRect.x
      y = y - this.containerRect.y
    }
    if (y < this.thresholdPoints[0]) {
      this._startMove(MoveDirection.UP)
    } else if (this.clientHeight - y <= this.thresholdPoints[1]) {
      this._startMove(MoveDirection.DOWN)
    } else if (x < this.thresholdPoints[2]) {
      this._startMove(MoveDirection.LEFT)
    } else if (this.clientWidth - x < this.thresholdPoints[3]) {
      this._startMove(MoveDirection.RIGHT)
    } else {
      this._stopMove()
    }
  }

  private _move(direction: MoveDirection) {
    // Document使用window
    const container =
      this.selectionContainer instanceof Document
        ? window
        : this.selectionContainer
    const x =
      this.selectionContainer instanceof Document
        ? window.scrollX
        : (<Element>container).scrollLeft
    const y =
      this.selectionContainer instanceof Document
        ? window.scrollY
        : (<Element>container).scrollTop
    if (direction === MoveDirection.DOWN) {
      container.scrollTo(x, y + this.step)
    } else if (direction === MoveDirection.UP) {
      container.scrollTo(x, y - this.step)
    } else if (direction === MoveDirection.LEFT) {
      container.scrollTo(x - this.step, y)
    } else {
      container.scrollTo(x + this.step, y)
    }
    this.requestAnimationFrameId = window.requestAnimationFrame(
      this._move.bind(this, direction)
    )
  }

  private _startMove(direction: MoveDirection) {
    if (this.isMoving) return
    this.isMoving = true
    this._move(direction)
  }

  private _stopMove() {
    if (this.requestAnimationFrameId) {
      window.cancelAnimationFrame(this.requestAnimationFrameId)
      this.requestAnimationFrameId = null
      this.isMoving = false
    }
  }
}
