import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { convertStringToBase64 } from '../../../utils'
import { Draw } from '../Draw'

export class ImageParticle {
  private draw: Draw
  protected options: Required<IEditorOption>
  protected imageCache: Map<string, HTMLImageElement>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.imageCache = new Map()
  }

  protected addImageObserver(promise: Promise<unknown>) {
    this.draw.getImageObserver().add(promise)
  }

  protected getFallbackImage(width: number, height: number): HTMLImageElement {
    const tileSize = 8
    const x = (width - Math.ceil(width / tileSize) * tileSize) / 2
    const y = (height - Math.ceil(height / tileSize) * tileSize) / 2
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                  <rect width="${width}" height="${height}" fill="url(#mosaic)" />
                  <defs>
                    <pattern id="mosaic" x="${x}" y="${y}" width="${
      tileSize * 2
    }" height="${tileSize * 2}" patternUnits="userSpaceOnUse">
                      <rect width="${tileSize}" height="${tileSize}" fill="#cccccc" />
                      <rect width="${tileSize}" height="${tileSize}" fill="#cccccc" transform="translate(${tileSize}, ${tileSize})" />
                    </pattern>
                  </defs>
                </svg>`
    const fallbackImage = new Image()
    fallbackImage.src = `data:image/svg+xml;base64,${convertStringToBase64(
      svg
    )}`
    return fallbackImage
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    x: number,
    y: number
  ) {
    const { scale } = this.options
    const width = element.width! * scale
    const height = element.height! * scale
    if (this.imageCache.has(element.id!)) {
      const img = this.imageCache.get(element.id!)!
      ctx.drawImage(img, x, y, width, height)
    } else {
      const imageLoadPromise = new Promise((resolve, reject) => {
        const img = new Image()
        img.setAttribute('crossOrigin', 'Anonymous')
        img.src = element.value
        img.onload = () => {
          ctx.drawImage(img, x, y, width, height)
          this.imageCache.set(element.id!, img)
          resolve(element)
        }
        img.onerror = error => {
          const fallbackImage = this.getFallbackImage(width, height)
          fallbackImage.onload = () => {
            ctx.drawImage(fallbackImage, x, y, width, height)
            this.imageCache.set(element.id!, fallbackImage)
          }
          reject(error)
        }
      })
      this.addImageObserver(imageLoadPromise)
    }
  }
}
