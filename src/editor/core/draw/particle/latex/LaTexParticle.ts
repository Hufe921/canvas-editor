import { IElement } from '../../../../interface/Element'
import { IRenderContext } from '../../../render/model/RenderContext'
import { Draw } from '../../Draw'
import { ImageParticle } from '../ImageParticle'
import { LaTexSVG, LaTexUtils } from './utils/LaTexUtils'

export class LaTexParticle extends ImageParticle {
  private latexDraw: Draw
  private pendingLaTexMap: Map<string, { renderCount: number }>

  constructor(draw: Draw) {
    super(draw)
    this.latexDraw = draw
    this.pendingLaTexMap = new Map()
  }

  public static convertLaTextToSVG(laTex: string): LaTexSVG {
    return new LaTexUtils(laTex).svg({
      SCALE_X: 10,
      SCALE_Y: 10,
      MARGIN_X: 0,
      MARGIN_Y: 0
    })
  }

  public render(ctx: IRenderContext, element: IElement, x: number, y: number) {
    const { scale } = this.options
    const width = element.width! * scale
    const height = element.height! * scale
    if (this.imageCache.has(element.value)) {
      const img = this.imageCache.get(element.value)!
      ctx.drawImage(img, x, y, width, height)
    } else {
      const renderCount = this.latexDraw.getRenderCount()
      const pending = this.pendingLaTexMap.get(element.value)
      if (pending) {
        pending.renderCount = renderCount
        return
      }
      const request = { renderCount }
      this.pendingLaTexMap.set(element.value, request)
      const laTexLoadPromise = new Promise((resolve, reject) => {
        const img = new Image()
        img.src = element.laTexSVG!
        img.onload = () => {
          this.imageCache.set(element.value, img)
          this.pendingLaTexMap.delete(element.value)
          if (request.renderCount === this.latexDraw.getRenderCount()) {
            this.latexDraw.render({
              isCompute: false,
              isSetCursor: false,
              isSubmitHistory: false
            })
          }
          resolve(element)
        }
        img.onerror = error => {
          this.pendingLaTexMap.delete(element.value)
          reject(error)
        }
      })
      this.addImageObserver(laTexLoadPromise)
    }
  }
}
