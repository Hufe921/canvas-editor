import { IElement } from "../../../interface/Element";

export class ImageParticle {

  private ctx: CanvasRenderingContext2D
  private imageCache: Map<string, HTMLImageElement>;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.imageCache = new Map()
  }

  public getImageCache(): Map<string, HTMLImageElement> {
    return this.imageCache
  }

  render(element: IElement, x: number, y: number) {
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