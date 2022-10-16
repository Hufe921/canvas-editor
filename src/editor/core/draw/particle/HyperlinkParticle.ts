import { IElement } from '../../..'
import { IEditorOption } from '../../../interface/Editor'
import { IElementPosition } from '../../../interface/Element'
import { IRowElement } from '../../../interface/Row'
import { createSVGElement } from '../../../utils/svg'
import { Draw } from '../Draw'

export class HyperlinkParticle {

  private draw: Draw
  private options: Required<IEditorOption>
  private container: HTMLDivElement
  private hyperlinkPopupContainer: HTMLDivElement
  private hyperlinkDom: HTMLAnchorElement

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    const { hyperlinkPopupContainer, hyperlinkDom } = this._createHyperlinkPopupDom()
    this.hyperlinkDom = hyperlinkDom
    this.hyperlinkPopupContainer = hyperlinkPopupContainer
  }

  private _createHyperlinkPopupDom() {
    const hyperlinkPopupContainer = document.createElement('div')
    hyperlinkPopupContainer.classList.add('hyperlink-popup')
    const hyperlinkDom = document.createElement('a')
    hyperlinkDom.target = '_blank'
    hyperlinkPopupContainer.append(hyperlinkDom)
    this.container.append(hyperlinkPopupContainer)
    return { hyperlinkPopupContainer, hyperlinkDom }
  }

  public drawHyperlinkPopup(element: IElement, position: IElementPosition) {
    const { coordinate: { leftTop: [left, top] }, lineHeight } = position
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = this.draw.getPageNo() * (height + pageGap)
    // 位置
    this.hyperlinkPopupContainer.style.display = 'block'
    this.hyperlinkPopupContainer.style.left = `${left}px`
    this.hyperlinkPopupContainer.style.top = `${top + preY + lineHeight}px`
    // 标签
    const url = element.url || '#'
    this.hyperlinkDom.href = url
    this.hyperlinkDom.innerText = url
  }

  public clearHyperlinkPopup() {
    this.hyperlinkPopupContainer.style.display = 'none'
  }

  public render(ctx: SVGElement, element: IRowElement, x: number, y: number) {
    const { scale } = this.options
    const { italic, bold, size, color } = element
    const text = createSVGElement('text')
    if (italic) {
      text.style.fontStyle = 'italic'
    }
    if (bold) {
      text.style.fontWeight = 'bold'
    }
    if (size) {
      text.style.fontSize = `${size * scale}px`
    }
    if (!color) {
      element.color = this.options.defaultHyperlinkColor
    }
    text.style.fill = element.color!
    if (element.underline === undefined) {
      element.underline = true
    }
    text.setAttribute('x', `${x}`)
    text.setAttribute('y', `${y}`)
    text.append(document.createTextNode(element.value))
    ctx.append(text)
  }

}