import type { IImageCrop } from '../../../../interface/Element'

interface IDragState {
  handleIndex: number
  startX: number
  startY: number
  crop: IImageCrop
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeCrop(
  crop: IImageCrop | undefined,
  naturalWidth: number,
  naturalHeight: number
): IImageCrop {
  if (!crop) {
    return { x: 0, y: 0, width: naturalWidth, height: naturalHeight }
  }
  const x = clamp(crop.x, 0, naturalWidth - 1)
  const y = clamp(crop.y, 0, naturalHeight - 1)
  return {
    x,
    y,
    width: clamp(crop.width, 1, naturalWidth - x),
    height: clamp(crop.height, 1, naturalHeight - y)
  }
}

export class ImageCropper {
  private root: HTMLDivElement
  private selection: HTMLDivElement
  private scaleX: number
  private scaleY: number
  private displayWidth: number
  private displayHeight: number
  private initialCrop: IImageCrop
  private crop: IImageCrop
  private dragState: IDragState | null = null

  constructor(
    container: HTMLElement,
    image: HTMLImageElement,
    crop?: IImageCrop
  ) {
    const { naturalWidth, naturalHeight } = image
    this.displayWidth = image.clientWidth || naturalWidth
    this.displayHeight = image.clientHeight || naturalHeight
    this.scaleX = this.displayWidth / naturalWidth
    this.scaleY = this.displayHeight / naturalHeight
    this.initialCrop = normalizeCrop(crop, naturalWidth, naturalHeight)
    this.crop = {
      x: this.initialCrop.x * this.scaleX,
      y: this.initialCrop.y * this.scaleY,
      width: this.initialCrop.width * this.scaleX,
      height: this.initialCrop.height * this.scaleY
    }
    this.root = document.createElement('div')
    this.root.classList.add('ce-image-cropper')
    this.selection = document.createElement('div')
    this.selection.classList.add('ce-image-cropper-selection')
    this.selection.setAttribute('aria-label', 'Crop selection')
    this.selection.onmousedown = evt => this._startDrag(evt, -1)
    this.root.append(this.selection)
    for (let i = 0; i < 8; i++) {
      const handle = document.createElement('div')
      handle.classList.add('ce-image-cropper-handle', `handle-${i}`)
      handle.setAttribute('aria-hidden', 'true')
      handle.onmousedown = evt => {
        evt.stopPropagation()
        this._startDrag(evt, i)
      }
      this.selection.append(handle)
    }
    container.append(this.root)
    this._updateView()
  }

  private _startDrag(evt: MouseEvent, handleIndex: number) {
    if (evt.button !== 0) return
    evt.preventDefault()
    this.dragState = {
      handleIndex,
      startX: evt.clientX,
      startY: evt.clientY,
      crop: { ...this.crop }
    }
    document.addEventListener('mousemove', this._mousemove)
    document.addEventListener('mouseup', this._mouseup, { once: true })
  }

  private _mousemove = (evt: MouseEvent) => {
    if (!this.dragState) return
    const { handleIndex, startX, startY, crop: startCrop } = this.dragState
    const dx = evt.clientX - startX
    const dy = evt.clientY - startY
    if (handleIndex === -1) {
      this.crop.x = clamp(
        startCrop.x + dx,
        0,
        this.displayWidth - startCrop.width
      )
      this.crop.y = clamp(
        startCrop.y + dy,
        0,
        this.displayHeight - startCrop.height
      )
    } else {
      const minWidth = 1 / this.scaleX
      const minHeight = 1 / this.scaleY
      if (handleIndex === 0 || handleIndex === 6 || handleIndex === 7) {
        const right = startCrop.x + startCrop.width
        const x = clamp(startCrop.x + dx, 0, right - minWidth)
        this.crop.x = x
        this.crop.width = right - x
      }
      if (handleIndex === 2 || handleIndex === 3 || handleIndex === 4) {
        this.crop.width = clamp(
          startCrop.width + dx,
          minWidth,
          this.displayWidth - startCrop.x
        )
      }
      if (handleIndex === 0 || handleIndex === 1 || handleIndex === 2) {
        const bottom = startCrop.y + startCrop.height
        const y = clamp(startCrop.y + dy, 0, bottom - minHeight)
        this.crop.y = y
        this.crop.height = bottom - y
      }
      if (handleIndex === 4 || handleIndex === 5 || handleIndex === 6) {
        this.crop.height = clamp(
          startCrop.height + dy,
          minHeight,
          this.displayHeight - startCrop.y
        )
      }
    }
    this._updateView()
    evt.preventDefault()
  }

  private _mouseup = () => {
    this.dragState = null
    document.removeEventListener('mousemove', this._mousemove)
  }

  private _updateView() {
    const { x, y, width, height } = this.crop
    this.selection.style.left = `${x}px`
    this.selection.style.top = `${y}px`
    this.selection.style.width = `${width}px`
    this.selection.style.height = `${height}px`
  }

  public getInitialCrop(): IImageCrop {
    return { ...this.initialCrop }
  }

  public getCrop(): IImageCrop {
    const x = Math.round(this.crop.x / this.scaleX)
    const y = Math.round(this.crop.y / this.scaleY)
    const right = Math.max(
      x + 1,
      Math.round((this.crop.x + this.crop.width) / this.scaleX)
    )
    const bottom = Math.max(
      y + 1,
      Math.round((this.crop.y + this.crop.height) / this.scaleY)
    )
    return {
      x,
      y,
      width: right - x,
      height: bottom - y
    }
  }

  public destroy() {
    this._mouseup()
    document.removeEventListener('mouseup', this._mouseup)
    this.root.remove()
  }
}
