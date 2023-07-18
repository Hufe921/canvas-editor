import { EDITOR_PREFIX } from '../../../../dataset/constant/Editor'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement, IElementPosition } from '../../../../interface/Element'
import {
  IPreviewerCreateResult,
  IPreviewerDrawOption
} from '../../../../interface/Previewer'
import { downloadFile } from '../../../../utils'
import { Draw } from '../../Draw'

export class Previewer {
  private container: HTMLDivElement
  private canvas: HTMLCanvasElement
  private draw: Draw
  private options: Required<IEditorOption>
  private curElement: IElement | null
  private curElementSrc: string
  private previewerDrawOption: IPreviewerDrawOption
  private curPosition: IElementPosition | null
  // 拖拽改变尺寸
  private resizerSelection: HTMLDivElement
  private resizerHandleList: HTMLDivElement[]
  private resizerImageContainer: HTMLDivElement
  private resizerImage: HTMLImageElement
  private width: number
  private height: number
  private mousedownX: number
  private mousedownY: number
  private curHandleIndex: number
  // 预览选区
  private previewerContainer: HTMLDivElement | null
  private previewerImage: HTMLImageElement | null

  constructor(draw: Draw) {
    this.container = draw.getContainer()
    this.canvas = draw.getPage()
    this.draw = draw
    this.options = draw.getOptions()
    this.curElement = null
    this.curElementSrc = ''
    this.previewerDrawOption = {}
    this.curPosition = null
    // 图片尺寸缩放
    const {
      resizerSelection,
      resizerHandleList,
      resizerImageContainer,
      resizerImage
    } = this._createResizerDom()
    this.resizerSelection = resizerSelection
    this.resizerHandleList = resizerHandleList
    this.resizerImageContainer = resizerImageContainer
    this.resizerImage = resizerImage
    this.width = 0
    this.height = 0
    this.mousedownX = 0
    this.mousedownY = 0
    this.curHandleIndex = 0 // 默认右下角
    // 图片预览
    resizerSelection.ondblclick = this._dblclick.bind(this)
    this.previewerContainer = null
    this.previewerImage = null
  }

  private _createResizerDom(): IPreviewerCreateResult {
    // 拖拽边框
    const resizerSelection = document.createElement('div')
    resizerSelection.classList.add(`${EDITOR_PREFIX}-resizer-selection`)
    resizerSelection.style.display = 'none'
    resizerSelection.style.borderColor = this.options.resizerColor
    const resizerHandleList: HTMLDivElement[] = []
    for (let i = 0; i < 8; i++) {
      const handleDom = document.createElement('div')
      handleDom.style.background = this.options.resizerColor
      handleDom.classList.add(`handle-${i}`)
      handleDom.setAttribute('data-index', String(i))
      handleDom.onmousedown = this._mousedown.bind(this)
      resizerSelection.append(handleDom)
      resizerHandleList.push(handleDom)
    }
    this.container.append(resizerSelection)
    // 拖拽镜像
    const resizerImageContainer = document.createElement('div')
    resizerImageContainer.classList.add(`${EDITOR_PREFIX}-resizer-image`)
    resizerImageContainer.style.display = 'none'
    const resizerImage = document.createElement('img')
    resizerImageContainer.append(resizerImage)
    this.container.append(resizerImageContainer)
    return {
      resizerSelection,
      resizerHandleList,
      resizerImageContainer,
      resizerImage
    }
  }

  private _keydown = () => {
    // 有键盘事件触发时，主动销毁拖拽选区
    if (this.resizerSelection.style.display === 'block') {
      this.clearResizer()
      document.removeEventListener('keydown', this._keydown)
    }
  }

  private _mousedown(evt: MouseEvent) {
    this.canvas = this.draw.getPage()
    if (!this.curPosition || !this.curElement) return
    const { scale } = this.options
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    this.mousedownX = evt.x
    this.mousedownY = evt.y
    const target = evt.target as HTMLDivElement
    this.curHandleIndex = Number(target.dataset.index)
    // 改变光标
    const cursor = window.getComputedStyle(target).cursor
    document.body.style.cursor = cursor
    this.canvas.style.cursor = cursor
    // 拖拽图片镜像
    this.resizerImage.src = this.curElementSrc
    this.resizerImageContainer.style.display = 'block'
    const {
      coordinate: {
        leftTop: [left, top]
      }
    } = this.curPosition
    const prePageHeight = this.draw.getPageNo() * (height + pageGap)
    this.resizerImageContainer.style.left = `${left}px`
    this.resizerImageContainer.style.top = `${top + prePageHeight}px`
    this.resizerImage.style.width = `${this.curElement.width! * scale}px`
    this.resizerImage.style.height = `${this.curElement.height! * scale}px`
    // 追加全局事件
    const mousemoveFn = this._mousemove.bind(this)
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener(
      'mouseup',
      () => {
        // 改变尺寸
        if (this.curElement && this.curPosition) {
          this.curElement.width = this.width
          this.curElement.height = this.height
          this.draw.render({ isSetCursor: false })
          this.drawResizer(
            this.curElement,
            this.curPosition,
            this.previewerDrawOption
          )
        }
        // 还原副作用
        this.resizerImageContainer.style.display = 'none'
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        this.canvas.style.cursor = 'text'
      },
      {
        once: true
      }
    )
    evt.preventDefault()
  }

  private _mousemove(evt: MouseEvent) {
    if (!this.curElement) return
    const { scale } = this.options
    let dx = 0
    let dy = 0
    switch (this.curHandleIndex) {
      case 0:
        dx = this.mousedownX - evt.x
        dy = this.mousedownY - evt.y
        break
      case 1:
        dy = this.mousedownY - evt.y
        break
      case 2:
        dx = evt.x - this.mousedownX
        dy = this.mousedownY - evt.y
        break
      case 3:
        dx = evt.x - this.mousedownX
        break
      case 5:
        dy = evt.y - this.mousedownY
        break
      case 6:
        dx = this.mousedownX - evt.x
        dy = evt.y - this.mousedownY
        break
      case 7:
        dx = this.mousedownX - evt.x
        break
      default:
        dx = evt.x - this.mousedownX
        dy = evt.y - this.mousedownY
        break
    }
    this.width = this.curElement.width! + dx
    this.height = this.curElement.height! + dy
    this.resizerImage.style.width = `${this.width * scale}px`
    this.resizerImage.style.height = `${this.height * scale}px`
    evt.preventDefault()
  }

  private _dblclick() {
    this._drawPreviewer()
    document.body.style.overflow = 'hidden'
  }

  private _drawPreviewer() {
    const previewerContainer = document.createElement('div')
    previewerContainer.classList.add(`${EDITOR_PREFIX}-image-previewer`)
    // 关闭按钮
    const closeBtn = document.createElement('i')
    closeBtn.classList.add('image-close')
    closeBtn.onclick = () => {
      this._clearPreviewer()
    }
    previewerContainer.append(closeBtn)
    // 图片
    const imgContainer = document.createElement('div')
    imgContainer.classList.add(`${EDITOR_PREFIX}-image-container`)
    const img = document.createElement('img')
    img.src = this.curElementSrc
    img.draggable = false
    imgContainer.append(img)
    this.previewerImage = img
    previewerContainer.append(imgContainer)
    // 操作栏
    let x = 0
    let y = 0
    let scaleSize = 1
    let rotateSize = 0
    const menuContainer = document.createElement('div')
    menuContainer.classList.add(`${EDITOR_PREFIX}-image-menu`)
    const zoomIn = document.createElement('i')
    zoomIn.classList.add('zoom-in')
    zoomIn.onclick = () => {
      scaleSize += 0.1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(zoomIn)
    const zoomOut = document.createElement('i')
    zoomOut.onclick = () => {
      if (scaleSize - 0.1 <= 0.1) return
      scaleSize -= 0.1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    zoomOut.classList.add('zoom-out')
    menuContainer.append(zoomOut)
    const rotate = document.createElement('i')
    rotate.classList.add('rotate')
    rotate.onclick = () => {
      rotateSize += 1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(rotate)
    const originalSize = document.createElement('i')
    originalSize.classList.add('original-size')
    originalSize.onclick = () => {
      x = 0
      y = 0
      scaleSize = 1
      rotateSize = 0
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(originalSize)
    const imageDownload = document.createElement('i')
    imageDownload.classList.add('image-download')
    imageDownload.onclick = () => {
      const { mime } = this.previewerDrawOption
      downloadFile(img.src, `${this.curElement?.id}.${mime || 'png'}`)
    }
    menuContainer.append(imageDownload)
    previewerContainer.append(menuContainer)
    this.previewerContainer = previewerContainer
    document.body.append(previewerContainer)
    // 拖拽调整位置
    let startX = 0
    let startY = 0
    let isAllowDrag = false
    img.onmousedown = evt => {
      isAllowDrag = true
      startX = evt.x
      startY = evt.y
      previewerContainer.style.cursor = 'move'
    }
    previewerContainer.onmousemove = (evt: MouseEvent) => {
      if (!isAllowDrag) return
      x += evt.x - startX
      y += evt.y - startY
      startX = evt.x
      startY = evt.y
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    previewerContainer.onmouseup = () => {
      isAllowDrag = false
      previewerContainer.style.cursor = 'auto'
    }
    previewerContainer.onwheel = evt => {
      evt.preventDefault()
      if (evt.deltaY < 0) {
        // 放大
        scaleSize += 0.1
      } else {
        // 缩小
        if (scaleSize - 0.1 <= 0.1) return
        scaleSize -= 0.1
      }
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
  }

  public _setPreviewerTransform(
    scale: number,
    rotate: number,
    x: number,
    y: number
  ) {
    if (!this.previewerImage) return
    this.previewerImage.style.left = `${x}px`
    this.previewerImage.style.top = `${y}px`
    this.previewerImage.style.transform = `scale(${scale}) rotate(${
      rotate * 90
    }deg)`
  }

  private _clearPreviewer() {
    this.previewerContainer?.remove()
    this.previewerContainer = null
    document.body.style.overflow = 'auto'
  }

  public drawResizer(
    element: IElement,
    position: IElementPosition,
    options: IPreviewerDrawOption = {}
  ) {
    this.previewerDrawOption = options
    const { scale } = this.options
    const {
      coordinate: {
        leftTop: [left, top]
      },
      ascent
    } = position
    const elementWidth = element.width! * scale
    const elementHeight = element.height! * scale
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const handleSize = this.options.resizerSize
    const preY = this.draw.getPageNo() * (height + pageGap)
    // 边框
    this.resizerSelection.style.left = `${left}px`
    this.resizerSelection.style.top = `${top + preY + ascent}px`
    this.resizerSelection.style.width = `${elementWidth}px`
    this.resizerSelection.style.height = `${elementHeight}px`
    // handle
    for (let i = 0; i < 8; i++) {
      const left =
        i === 0 || i === 6 || i === 7
          ? -handleSize
          : i === 1 || i === 5
          ? elementWidth / 2
          : elementWidth - handleSize
      const top =
        i === 0 || i === 1 || i === 2
          ? -handleSize
          : i === 3 || i === 7
          ? elementHeight / 2 - handleSize
          : elementHeight - handleSize
      this.resizerHandleList[i].style.left = `${left}px`
      this.resizerHandleList[i].style.top = `${top}px`
    }
    this.resizerSelection.style.display = 'block'
    this.curElement = element
    this.curElementSrc = element[options.srcKey || 'value'] || ''
    this.curPosition = position
    this.width = this.curElement.width! * scale
    this.height = this.curElement.height! * scale
    document.addEventListener('keydown', this._keydown)
  }

  public clearResizer() {
    this.resizerSelection.style.display = 'none'
    document.removeEventListener('keydown', this._keydown)
  }
}
