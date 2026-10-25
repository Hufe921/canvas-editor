import { afterEach, describe, expect, it, vi } from 'vitest'
import { print, printSvg } from '@/editor/utils/print'

const EXPORTED_IMAGE = 'data:image/png;base64,canvas-export'

describe('print', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('Canvas 页面继续使用位图打印并调用浏览器打印', async () => {
    const printPromise = print([EXPORTED_IMAGE], { width: 794, height: 1123 })

    const iframe = document.body.querySelector('iframe')!
    const image = iframe.contentDocument?.querySelector('img')
    expect(image?.src).toBe(EXPORTED_IMAGE)
    expect(iframe.contentDocument?.querySelector('svg')).toBeNull()
    iframe.contentWindow!.print = vi.fn()
    image!.dispatchEvent(new Event('load'))
    await printPromise
    await new Promise(resolve => setTimeout(resolve))
    expect(iframe.contentWindow!.print).toHaveBeenCalledOnce()
  })

  it('SVG 打印复制字体样式并等待文档内图片加载', async () => {
    const style = document.createElement('style')
    style.textContent = '@font-face { font-family: PrintFont; src: url(font.woff2); }'
    document.head.append(style)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    image.setAttribute('href', EXPORTED_IMAGE)
    svg.append(image)

    const printPromise = printSvg([svg], { width: 794, height: 1123 })
    const iframe = document.body.querySelector('iframe')!
    const printWindow = iframe.contentWindow!
    printWindow.print = vi.fn()
    const printImage = printWindow.document.querySelector('image')!
    await new Promise(resolve => setTimeout(resolve))
    expect(printWindow.print).not.toHaveBeenCalled()
    expect(printWindow.document.documentElement.innerHTML).toContain('@font-face')

    printImage.dispatchEvent(new Event('load'))
    await printPromise
    await new Promise(resolve => setTimeout(resolve))
    expect(printWindow.print).toHaveBeenCalledOnce()
    style.remove()
  })
})
