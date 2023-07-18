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

  private rangeManager: RangeManager
  private requestAnimationFrameId: number | null
  private isMousedown: boolean
  private isMoving: boolean

  constructor(draw: Draw) {
    this.requestAnimationFrameId = null
    this.isMousedown = false
    this.isMoving = false
    this.rangeManager = draw.getRange()

    this._addEvent()
  }

  private _addEvent() {
    document.addEventListener('mousedown', this._mousedown)
    document.addEventListener('mousemove', this._mousemove)
    document.addEventListener('mouseup', this._mouseup)
  }

  public removeEvent() {
    document.removeEventListener('mousedown', this._mousedown)
    document.removeEventListener('mousemove', this._mousemove)
    document.removeEventListener('mouseup', this._mouseup)
  }

  private _mousedown = () => {
    this.isMousedown = true
  }

  private _mouseup = () => {
    this.isMousedown = false
    this._stopMove()
  }

  private _mousemove = (evt: MouseEvent) => {
    if (!this.isMousedown || this.rangeManager.getIsCollapsed()) return
    const { x, y } = evt
    const clientWidth = document.documentElement.clientWidth
    const clientHeight = document.documentElement.clientHeight
    if (y < this.thresholdPoints[0]) {
      this._startMove(MoveDirection.UP)
    } else if (clientHeight - y <= this.thresholdPoints[1]) {
      this._startMove(MoveDirection.DOWN)
    } else if (x < this.thresholdPoints[2]) {
      this._startMove(MoveDirection.LEFT)
    } else if (clientWidth - x < this.thresholdPoints[3]) {
      this._startMove(MoveDirection.RIGHT)
    } else {
      this._stopMove()
    }
  }

  private _move(direction: MoveDirection) {
    const x = window.scrollX
    const y = window.scrollY
    if (direction === MoveDirection.DOWN) {
      window.scrollTo(x, y + this.step)
    } else if (direction === MoveDirection.UP) {
      window.scrollTo(x, y - this.step)
    } else if (direction === MoveDirection.LEFT) {
      window.scrollTo(x - this.step, y)
    } else {
      window.scrollTo(x + this.step, y)
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
