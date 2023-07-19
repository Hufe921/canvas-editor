import { IElement } from '../../../../interface/Element'
import { ImageParticle } from '../ImageParticle'
import { LaTexSVG, LaTexUtils } from './utils/LaTexUtils'

export class LaTexParticle extends ImageParticle {
  public static convertLaTextToSVG(laTex: string): LaTexSVG {
    return new LaTexUtils(laTex).svg({
      SCALE_X: 10,
      SCALE_Y: 10,
      MARGIN_X: 0,
      MARGIN_Y: 0
    })
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
    if (this.imageCache.has(element.value)) {
      const img = this.imageCache.get(element.value)!
      ctx.drawImage(img, x, y, width, height)
    } else {
      const laTexLoadPromise = new Promise((resolve, reject) => {
        const img = new Image()
        img.src = element.laTexSVG!
        img.onload = () => {
          ctx.drawImage(img, x, y, width, height)
          this.imageCache.set(element.value, img)
          resolve(element)
        }
        img.onerror = error => {
          reject(error)
        }
      })
      this.addImageObserver(laTexLoadPromise)
    }
  }
}
