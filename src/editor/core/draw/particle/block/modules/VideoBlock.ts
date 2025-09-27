import { IRowElement } from '../../../../../interface/Row'

export class VideoBlock {
  private element: IRowElement
  protected videoCache: Map<string, HTMLVideoElement>

  constructor(element: IRowElement) {
    this.element = element
    this.videoCache = new Map()
  }

  public snapshot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    return new Promise((resolve, reject) => {
      const src = this.element.block?.videoBlock?.src || ''
      if (this.videoCache.has(src)) {
        const video = this.videoCache.get(src)!
        ctx.drawImage(
          video,
          x,
          y,
          this.element.metrics.width,
          this.element.metrics.height
        )
        resolve(this.element)
      } else {
        const video = document.createElement('video')
        video.src = src
        video.muted = true
        video.crossOrigin = 'anonymous'
        video.onloadeddata = () => {
          ctx.drawImage(
            video,
            x,
            y,
            this.element.metrics.width,
            this.element.metrics.height
          )
          this.videoCache.set(src, video)
          resolve(this.element)
        }
        video.onerror = error => {
          reject(error)
        }
        video.play().then(() => {
          video.pause()
        })
      }
    })
  }

  public render(blockItemContainer: HTMLDivElement) {
    const block = this.element.block!
    const video = document.createElement('video')
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.objectFit = 'contain'
    video.src = block.videoBlock?.src || ''
    video.controls = true
    blockItemContainer.append(video)
  }
}
