import { IEditorOption } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { createSVGElement } from '../../../utils/svg'
import { Draw } from '../Draw'

export class ImageParticle {

  protected options: Required<IEditorOption>
  protected imageCache: Map<string, string>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
    this.imageCache = new Map()
  }

  public createImageElement(href: string, x: number, y: number, width: number, height: number): SVGImageElement {
    const imgElement = createSVGElement('image')
    imgElement.setAttribute('href', href)
    imgElement.setAttribute('x', `${x}`)
    imgElement.setAttribute('y', `${y}`)
    imgElement.setAttribute('width', `${width}`)
    imgElement.setAttribute('height', `${height}`)
    return imgElement
  }

  public render(ctx: SVGElement, element: IElement, x: number, y: number) {
    const { scale } = this.options
    const width = element.width! * scale
    const height = element.height! * scale
    const href = element.value
    const imgElement = this.createImageElement(href, x, y, width, height)
    ctx.append(imgElement)
    this.imageCache.set(element.id!, href)
  }

}