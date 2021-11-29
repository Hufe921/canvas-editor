import { IImageParticleCreateResult } from "../../../interface/Draw"
import { IEditorOption } from "../../../interface/Editor"
import { IElement, IElementPosition } from "../../../interface/Element"
import { Draw } from "../Draw"

export class ImageParticle {

  private container: HTMLDivElement
  private canvas: HTMLCanvasElement
  private draw: Draw
  private options: Required<IEditorOption>
  private curElement: IElement | null
  private curPosition: IElementPosition | null
  private imageCache: Map<string, HTMLImageElement>
  private resizerSelection: HTMLDivElement
  private resizerHandleList: HTMLDivElement[]
  private resizerImageContainer: HTMLDivElement
  private resizerImage: HTMLImageElement
  private width: number
  private height: number
  private mousedownX: number
  private mousedownY: number
  private curHandleIndex: number

  constructor(draw: Draw) {
    this.container = draw.getContainer()
    this.canvas = draw.getPage()
    this.draw = draw
    this.options = draw.getOptions()
    this.curElement = null
    this.curPosition = null
    this.imageCache = new Map()
    const { resizerSelection, resizerHandleList, resizerImageContainer, resizerImage } = this._createResizerDom()
    this.resizerSelection = resizerSelection
    this.resizerHandleList = resizerHandleList
    this.resizerImageContainer = resizerImageContainer
    this.resizerImage = resizerImage
    this.width = 0
    this.height = 0
    this.mousedownX = 0
    this.mousedownY = 0
    this.curHandleIndex = 0 // 默认右下角
  }

  private _createResizerDom(): IImageParticleCreateResult {
    // 拖拽边框
    const resizerSelection = document.createElement('div')
    resizerSelection.classList.add('resizer-selection')
    resizerSelection.style.display = 'none'
    resizerSelection.style.borderColor = this.options.resizerColor
    const resizerHandleList: HTMLDivElement[] = []
    for (let i = 0; i < 8; i++) {
      const handleDom = document.createElement('div')
      handleDom.style.background = this.options.resizerColor
      handleDom.classList.add(`handle-${i}`)
      handleDom.setAttribute('data-index', String(i))
      handleDom.onmousedown = this._handleMousedown.bind(this)
      resizerSelection.append(handleDom)
      resizerHandleList.push(handleDom)
    }
    this.container.append(resizerSelection)
    // 拖拽镜像
    const resizerImageContainer = document.createElement('div')
    resizerImageContainer.classList.add('resizer-image')
    resizerImageContainer.style.display = 'none'
    const resizerImage = document.createElement('img')
    resizerImageContainer.append(resizerImage)
    this.container.append(resizerImageContainer)
    return { resizerSelection, resizerHandleList, resizerImageContainer, resizerImage }
  }

  private _handleMousedown(evt: MouseEvent) {
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
    this.resizerImage.src = this.curElement?.value!
    this.resizerImageContainer.style.display = 'block'
    const { coordinate: { leftTop: [left, top] } } = this.curPosition
    const prePageHeight = this.draw.getPageNo() * (height + pageGap)
    this.resizerImageContainer.style.left = `${left}px`
    this.resizerImageContainer.style.top = `${top + prePageHeight}px`
    this.resizerImage.style.width = `${this.curElement.width! * scale}px`
    this.resizerImage.style.height = `${this.curElement.height! * scale}px`
    // 追加全局事件
    const mousemoveFn = this._mousemove.bind(this)
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener('mouseup', () => {
      // 改变尺寸
      if (this.curElement && this.curPosition) {
        this.curElement.width = this.width
        this.curElement.height = this.height
        this.draw.render({ isSetCursor: false })
        this.drawResizer(this.curElement, this.curPosition)
      }
      // 还原副作用
      this.resizerImageContainer.style.display = 'none'
      document.removeEventListener('mousemove', mousemoveFn)
      document.body.style.cursor = ''
      this.canvas.style.cursor = 'text'
    }, {
      once: true
    })
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

  public getImageCache(): Map<string, HTMLImageElement> {
    return this.imageCache
  }

  public drawResizer(element: IElement, position: IElementPosition) {
    const { scale } = this.options
    const { coordinate: { leftTop: [left, top] } } = position
    const elementWidth = element.width! * scale
    const elementHeight = element.height! * scale
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const handleSize = this.options.resizerSize
    const preY = this.draw.getPageNo() * (height + pageGap)
    // 边框
    this.resizerSelection.style.left = `${left}px`
    this.resizerSelection.style.top = `${top + preY}px`
    this.resizerSelection.style.width = `${elementWidth}px`
    this.resizerSelection.style.height = `${elementHeight}px`
    // handle
    for (let i = 0; i < 8; i++) {
      const left = i === 0 || i === 6 || i === 7
        ? -handleSize
        : i === 1 || i === 5
          ? elementWidth / 2
          : elementWidth - handleSize
      const top = i === 0 || i === 1 || i === 2
        ? -handleSize
        : i === 3 || i === 7
          ? elementHeight / 2 - handleSize
          : elementHeight - handleSize
      this.resizerHandleList[i].style.left = `${left}px`
      this.resizerHandleList[i].style.top = `${top}px`
    }
    this.resizerSelection.style.display = 'block'
    this.curElement = element
    this.curPosition = position
    this.width = this.curElement.width! * scale
    this.height = this.curElement.height! * scale
  }

  public clearResizer() {
    this.resizerSelection.style.display = 'none'
  }

  public render(ctx: CanvasRenderingContext2D, element: IElement, x: number, y: number) {
    const { scale } = this.options
    const width = element.width! * scale
    const height = element.height! * scale
    if (this.imageCache.has(element.id!)) {
      const img = this.imageCache.get(element.id!)!
      ctx.drawImage(img, x, y, width, height)
    } else {
      const img = new Image()
      img.src = element.value
      img.onload = () => {
        ctx.drawImage(img, x, y, width, height)
        this.imageCache.set(element.id!, img)
      }
    }
  }

}