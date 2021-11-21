import { IImageParticleCreateResult } from "../../../interface/Draw";
import { IEditorOption } from "../../../interface/Editor";
import { IElement, IElementPosition } from "../../../interface/Element";

export class ImageParticle {

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private options: Required<IEditorOption>
  private imageCache: Map<string, HTMLImageElement>
  private resizerSelection: HTMLDivElement
  private resizerHandleList: HTMLDivElement[]

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, options: Required<IEditorOption>) {
    this.canvas = canvas
    this.ctx = ctx
    this.options = options
    this.imageCache = new Map()
    const { resizerSelection, resizerHandleList } = this.createResizerDom()
    this.resizerSelection = resizerSelection
    this.resizerHandleList = resizerHandleList
  }

  private createResizerDom(): IImageParticleCreateResult {
    const resizerSelection = document.createElement('div')
    resizerSelection.classList.add('resizer-selection')
    resizerSelection.style.display = 'none'
    resizerSelection.style.borderColor = this.options.resizerColor
    const resizerHandleList: HTMLDivElement[] = []
    for (let i = 0; i < 8; i++) {
      const handleDom = document.createElement('div')
      handleDom.style.background = this.options.resizerColor
      handleDom.classList.add(`handle-${i}`)
      resizerSelection.append(handleDom)
      resizerHandleList.push(handleDom)
    }
    this.canvas.parentNode!.append(resizerSelection)
    return { resizerSelection, resizerHandleList }
  }

  public getImageCache(): Map<string, HTMLImageElement> {
    return this.imageCache
  }

  public drawResizer(element: IElement, position: IElementPosition) {
    const { coordinate: { leftTop: [left, top] } } = position
    const width = element.width!
    const height = element.height!
    const handleSize = this.options.resizerSize
    // 边框
    this.resizerSelection.style.left = `${left}px`
    this.resizerSelection.style.top = `${top}px`
    this.resizerSelection.style.width = `${element.width}px`
    this.resizerSelection.style.height = `${element.height}px`
    // handle
    for (let i = 0; i < 8; i++) {
      const left = i === 0 || i === 6 || i === 7
        ? -handleSize
        : i === 1 || i === 5
          ? width / 2
          : width - handleSize
      const top = i === 0 || i === 1 || i === 2
        ? -handleSize
        : i === 3 || i === 7
          ? height / 2 - handleSize
          : height - handleSize
      this.resizerHandleList[i].style.left = `${left}px`
      this.resizerHandleList[i].style.top = `${top}px`
    }
    this.resizerSelection.style.display = 'block'
  }

  public clearResizer() {
    this.resizerSelection.style.display = 'none'
  }

  public render(element: IElement, x: number, y: number) {
    const width = element.width!
    const height = element.height!
    if (this.imageCache.has(element.id!)) {
      const img = this.imageCache.get(element.id!)!
      this.ctx.drawImage(img, x, y, width, height)
    } else {
      const img = new Image()
      img.src = element.value
      img.onload = () => {
        this.ctx.drawImage(img, x, y, width, height)
        this.imageCache.set(element.id!, img)
      }
    }
  }

}