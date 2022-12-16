import { MoveDirection } from '../../dataset/enum/Observer'

export class SelectionObserver {

  private threshold: number
  private requestAnimationFrameId: number
  private tippingPoints: [top: number, down: number, left: number, right: number]

  private isMousedown: boolean
  private isMoving: boolean
  private clientWidth: number
  private clientHeight: number

  constructor() {
    this.threshold = 10
    this.tippingPoints = [70, 40, 10, 20]
    this.requestAnimationFrameId = -1

    this.isMousedown = false
    this.isMoving = false
    this.clientWidth = 0
    this.clientHeight = 0
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
    if (!this.isMousedown) return
    const { x, y } = evt
    if (y < this.tippingPoints[0]) {
      this._startMove(MoveDirection.UP)
    } else if (this.clientHeight - y <= this.tippingPoints[1]) {
      this._startMove(MoveDirection.DOWN)
    } else if (x < this.tippingPoints[2]) {
      this._startMove(MoveDirection.LEFT)
    } else if (this.clientWidth - x < this.tippingPoints[3]) {
      this._startMove(MoveDirection.RIGHT)
    } else {
      this._stopMove()
    }
  }

  private _move(direction: MoveDirection) {
    const x = window.screenX
    const y = window.screenY
    if (direction === MoveDirection.DOWN) {
      window.scrollBy(x, y + this.threshold)
    } else if (direction === MoveDirection.UP) {
      window.scrollBy(x, y - this.threshold)
    } else if (direction === MoveDirection.LEFT) {
      window.scrollBy(x - this.threshold, y)
    } else {
      window.scrollBy(x + this.threshold, y)
    }
    this.requestAnimationFrameId = window.requestAnimationFrame(this._move.bind(this, direction))
  }

  private _startMove(direction: MoveDirection) {
    if (this.isMoving) return
    this.clientWidth = document.documentElement.clientWidth
    this.clientHeight = document.documentElement.clientHeight
    this.isMoving = true
    this.requestAnimationFrameId = window.requestAnimationFrame(this._move.bind(this, direction))
  }

  private _stopMove() {
    if (!this.isMoving) return
    if (~this.requestAnimationFrameId) {
      window.cancelAnimationFrame(this.requestAnimationFrameId)
    }
    this.isMoving = false
  }

}