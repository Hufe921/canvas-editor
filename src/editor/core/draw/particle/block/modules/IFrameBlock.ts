import { IRowElement } from '../../../../../interface/Row'

export class IFrameBlock {
  private static readonly sandbox = [
    'allow-forms',
    'allow-scripts',
    'allow-same-origin',
    'allow-popups'
  ]
  private element: IRowElement

  constructor(element: IRowElement) {
    this.element = element
  }

  public render(blockItemContainer: HTMLDivElement) {
    const block = this.element.block!
    const iframe = document.createElement('iframe')
    iframe.sandbox.add(...IFrameBlock.sandbox)
    iframe.style.border = 'none'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.src = block.iframeBlock?.src || ''
    blockItemContainer.append(iframe)
  }
}
