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

  public render(ctx: SVGElement, element: IElement, x: number, y: number) {
    const { scale } = this.options
    const width = element.width! * scale
    const height = element.height! * scale
    const href = element.laTexSVG!
    const imgElement = this.createImageElement(href, x, y, width, height)
    ctx.append(imgElement)
    this.imageCache.set(element.id!, href)
  }

}

