import { EDITOR_PREFIX } from '../../../dataset/constant/Editor'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Magnifier {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private canvas: HTMLCanvasElement
  private isActive: boolean
  private container: HTMLDivElement

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    this.isActive = false
    // 创建放大镜画布
    const canvas = this._createMagnifierCanvas()
    this.container.appendChild(canvas)
    this.canvas = canvas
    // 监听事件
    this._addEvent()
  }

  private _createMagnifierCanvas() {
    const { magnifier } = this.options
    const canvas = document.createElement('canvas')
    canvas.classList.add(`${EDITOR_PREFIX}-magnifier`)
    canvas.width = magnifier.size
    canvas.height = magnifier.size
    canvas.style.width = `${magnifier.size}px`
    canvas.style.height = `${magnifier.size}px`
    return canvas
  }

  private _addEvent() {
    this.container.addEventListener('mousemove', this._mousemove)
    document.addEventListener('keydown', this._handleKeyDown)
    document.addEventListener('keyup', this._handleKeyUp)
  }

  private _removeEvent() {
    this.container.removeEventListener('mousemove', this._mousemove)
    document.removeEventListener('keydown', this._handleKeyDown)
    document.removeEventListener('keyup', this._handleKeyUp)
  }

  private _handleKeyDown = (evt: KeyboardEvent) => {
    if (evt.key === KeyMap.ALT) {
      this.show()
    }
  }

  private _handleKeyUp = (evt: KeyboardEvent) => {
    if (evt.key === KeyMap.ALT) {
      this.hide()
    }
  }

  private _mousemove = (evt: MouseEvent) => {
    if (this.isActive) {
      this._update(evt)
    }
  }

  public show() {
    if (this.options.magnifier.disabled) return
    this.isActive = true
    this.canvas.style.display = 'block'
  }

  public hide() {
    if (this.options.magnifier.disabled) return
    this.isActive = false
    this.canvas.style.display = 'none'
  }

  private _update(evt: MouseEvent) {
    if (!this.isActive) return
    const ctx = this.canvas.getContext('2d')!
    const {
      magnifier: { size, zoom, borderColor }
    } = this.options
    const halfSize = size / 2
    const sourceRadius = size / zoom

    // 定位：中心对齐鼠标
    this.canvas.style.left = `${evt.clientX - halfSize}px`
    this.canvas.style.top = `${evt.clientY - halfSize}px`

    const pageList = this.draw.getPageList()
    let sourceCanvas: HTMLCanvasElement | null = null
    let sx = 0
    let sy = 0

    for (let i = 0; i < pageList.length; i++) {
      const page = pageList[i]
      const rect = page.getBoundingClientRect()
      if (
        evt.clientX >= rect.left &&
        evt.clientX <= rect.right &&
        evt.clientY >= rect.top &&
        evt.clientY <= rect.bottom
      ) {
        sourceCanvas = page
        const dpr = sourceCanvas.width / rect.width
        sx = (evt.clientX - rect.left) * dpr - sourceRadius / 2
        sy = (evt.clientY - rect.top) * dpr - sourceRadius / 2
        break
      }
    }

    // 清空画布
    ctx.clearRect(0, 0, size, size)

    if (!sourceCanvas) return

    // 绘制圆形 clip
    ctx.save()
    ctx.beginPath()
    ctx.arc(halfSize, halfSize, halfSize - 1, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // 放大绘制源 canvas 区域
    ctx.drawImage(
      sourceCanvas,
      Math.max(0, sx),
      Math.max(0, sy),
      sourceRadius,
      sourceRadius,
      0,
      0,
      size,
      size
    )

    ctx.restore()

    // 绘制边框
    ctx.beginPath()
    ctx.arc(halfSize, halfSize, halfSize - 1, 0, Math.PI * 2)
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2
    ctx.stroke()
  }

  public destroy() {
    this.canvas.remove()
    this._removeEvent()
  }
}
