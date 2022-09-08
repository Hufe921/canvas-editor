import { EditorComponent, EDITOR_COMPONENT } from '../../editor'
import './signature.css'

export interface ISignatureConfirm {
  value: string;
  width: number;
  height: number;
}

export interface ISignatureOptions {
  width?: number;
  height?: number;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: (payload: ISignatureConfirm) => void;
}

export class Signature {
  private x: number
  private y: number
  private isDrawing: boolean
  private canvasWidth: number
  private canvasHeight: number
  private options: ISignatureOptions
  private mask: HTMLDivElement
  private container: HTMLDivElement
  private trashContainer: HTMLDivElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(options: ISignatureOptions) {
    this.x = 0
    this.y = 0
    this.isDrawing = false
    this.options = options
    this.canvasWidth = options.width || 390
    this.canvasHeight = options.height || 180
    const { mask, container, trashContainer, canvas } = this._render()
    this.mask = mask
    this.container = container
    this.trashContainer = trashContainer
    this.canvas = canvas
    this.ctx = <CanvasRenderingContext2D>canvas.getContext('2d')
    this._bindEvent()
  }

  private _render() {
    const { onClose, onCancel, onConfirm } = this.options
    // 渲染遮罩层
    const mask = document.createElement('div')
    mask.classList.add('signature-mask')
    mask.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    document.body.append(mask)
    // 渲染容器
    const container = document.createElement('div')
    container.classList.add('signature-container')
    container.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    // 弹窗
    const signatureContainer = document.createElement('div')
    signatureContainer.classList.add('signature')
    container.append(signatureContainer)
    // 标题容器
    const titleContainer = document.createElement('div')
    titleContainer.classList.add('signature-title')
    // 标题&关闭按钮
    const titleSpan = document.createElement('span')
    titleSpan.append(document.createTextNode('插入签名'))
    const titleClose = document.createElement('i')
    titleClose.onclick = () => {
      if (onClose) {
        onClose()
      }
      this._dispose()
    }
    titleContainer.append(titleSpan)
    titleContainer.append(titleClose)
    signatureContainer.append(titleContainer)
    // 操作区
    const operationContainer = document.createElement('div')
    operationContainer.classList.add('signature-operation')
    const trashContainer = document.createElement('div')
    trashContainer.classList.add('signature-operation__trash')
    const trashIcon = document.createElement('i')
    const trashLabel = document.createElement('span')
    trashLabel.innerText = '清空画布'
    trashContainer.append(trashIcon)
    trashContainer.append(trashLabel)
    operationContainer.append(trashContainer)
    signatureContainer.append(operationContainer)
    // 绘图区
    const canvasContainer = document.createElement('div')
    canvasContainer.classList.add('signature-canvas')
    const canvas = document.createElement('canvas')
    canvas.width = this.canvasWidth
    canvas.height = this.canvasHeight
    canvas.style.width = `${this.canvasWidth}px`
    canvas.style.height = `${this.canvasHeight}px`
    canvasContainer.append(canvas)
    signatureContainer.append(canvasContainer)
    // 按钮容器
    const menuContainer = document.createElement('div')
    menuContainer.classList.add('signature-menu')
    // 取消按钮
    const cancelBtn = document.createElement('button')
    cancelBtn.classList.add('signature-menu__cancel')
    cancelBtn.append(document.createTextNode('取消'))
    cancelBtn.type = 'default'
    cancelBtn.onclick = () => {
      if (onCancel) {
        onCancel()
      }
      this._dispose()
    }
    menuContainer.append(cancelBtn)
    // 确认按钮
    const confirmBtn = document.createElement('button')
    confirmBtn.append(document.createTextNode('确定'))
    confirmBtn.type = 'primary'
    confirmBtn.onclick = () => {
      if (onConfirm) {
        onConfirm({
          width: this.canvasWidth,
          height: this.canvasHeight,
          value: this._toDataURL()
        })
      }
      this._dispose()
    }
    menuContainer.append(confirmBtn)
    signatureContainer.append(menuContainer)
    // 渲染
    document.body.append(container)
    this.container = container
    this.mask = mask
    return {
      mask,
      canvas,
      container,
      trashContainer
    }
  }

  private _bindEvent() {
    this.trashContainer.onclick = this._clearCanvas.bind(this)
    this.canvas.onmousedown = this._startDraw.bind(this)
    this.canvas.onmousemove = this._draw.bind(this)
    this.container.onmouseup = this._stopDraw.bind(this)
  }

  private _clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
  }

  private _startDraw(evt: MouseEvent) {
    this.isDrawing = true
    this.x = evt.offsetX
    this.y = evt.offsetY
    this.ctx.lineWidth = 5
    this.ctx.lineCap = 'butt'
    this.ctx.lineJoin = 'round'
  }

  private _draw(evt: MouseEvent) {
    if (!this.isDrawing) return
    const { offsetX, offsetY } = evt
    this.ctx.beginPath()
    this.ctx.moveTo(this.x, this.y)
    this.ctx.lineTo(offsetX, offsetY)
    this.ctx.stroke()
    this.x = offsetX
    this.y = offsetY
  }

  private _stopDraw() {
    this.isDrawing = false
  }

  private _toDataURL() {
    return this.canvas.toDataURL()
  }

  private _dispose() {
    this.mask.remove()
    this.container.remove()
  }

}