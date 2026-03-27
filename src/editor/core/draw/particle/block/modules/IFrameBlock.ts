import { IRowElement } from '../../../../../interface/Row'

export class IFrameBlock {
  public static readonly sandbox = ['allow-scripts', 'allow-same-origin']
  public static readonly allow = ['fullscreen']

  private element: IRowElement
  private iframe: HTMLIFrameElement | null = null
  private isReadonly: boolean

  constructor(element: IRowElement) {
    this.element = element
    this.isReadonly = false
  }

  public getIframe(): HTMLIFrameElement | null {
    return this.iframe
  }

  private _defineIframeProperties(iframeWindow: Window) {
    Object.defineProperties(iframeWindow, {
      // 禁止获取parent避免安全漏洞
      parent: {
        get: () => null
      },
      // 用于区分上下文
      __POWERED_BY_CANVAS_EDITOR__: {
        get: () => true
      }
    })
  }

  public render(blockItemContainer: HTMLDivElement) {
    const { iframeBlock } = this.element.block || {}
    const iframe = document.createElement('iframe')
    iframe.setAttribute('data-id', this.element.id!)
    iframe.sandbox.add(...(iframeBlock?.sandbox || IFrameBlock.sandbox))
    iframe.setAttribute(
      'allow',
      [iframeBlock?.allow || IFrameBlock.allow].join(' ')
    )
    iframe.style.border = 'none'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    if (iframeBlock?.src) {
      iframe.src = iframeBlock.src
    } else if (iframeBlock?.srcdoc) {
      iframe.srcdoc = iframeBlock.srcdoc
    }
    blockItemContainer.append(iframe)
    // 重新定义iframe上属性
    this._defineIframeProperties(iframe.contentWindow!)
    this.iframe = iframe
  }

  public setReadonly(readonly: boolean) {
    if (!this.iframe || this.isReadonly === readonly) return
    this.isReadonly = readonly
    if (readonly) {
      this.iframe.style.pointerEvents = 'none'
      this.iframe.setAttribute('tabindex', '-1')
    } else {
      this.iframe.style.pointerEvents = ''
      this.iframe.removeAttribute('tabindex')
    }
  }
}
