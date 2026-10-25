import { afterEach, describe, expect, it, vi } from 'vitest'
import { BackendType, EditorMode } from '@/editor/dataset/enum/Editor'
import { BlockType } from '@/editor/dataset/enum/Block'
import { ElementType } from '@/editor/dataset/enum/Element'
import { BlockParticle } from '@/editor/core/draw/particle/block/BlockParticle'
import { ImageObserver } from '@/editor/core/observer/ImageObserver'
import { SvgBackend } from '@/editor/core/render/svg/SvgBackend'
import { createTestEditor } from '../../factories/editor'

const EXPORTED_IMAGE = 'data:image/png;base64,canvas-export'

function decodeSvgDataURL(value: string): XMLDocument {
  const [header, payload] = value.split(',')
  expect(header).toBe('data:image/svg+xml;base64')
  const bytes = Uint8Array.from(atob(payload), char => char.charCodeAt(0))
  return new DOMParser().parseFromString(
    new TextDecoder().decode(bytes),
    'image/svg+xml'
  )
}

describe('SvgRenderer 导出与打印', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete (HTMLIFrameElement.prototype as any).sandbox
    document.body.innerHTML = ''
  })

  it('SVG 直接导出 SVG base64 且不创建临时 Canvas', async () => {
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    const { editor, container, destroy } = createTestEditor({
      data: [{ value: 'svg export' }],
      options: { backend: BackendType.SVG }
    })
    const originalPage = container.querySelector('svg')
    toDataURL.mockClear()

    const result = await editor.command.getImage({ pixelRatio: 3 })

    expect(result).toHaveLength(1)
    const svgDocument = decodeSvgDataURL(result[0])
    expect(svgDocument.documentElement.tagName).toBe('svg')
    expect(svgDocument.documentElement.textContent).toContain('svg export')
    expect(svgDocument.querySelector('parsererror')).toBeNull()
    expect(svgDocument.querySelector('img')).toBeNull()
    expect(toDataURL).not.toHaveBeenCalled()
    expect(container.querySelector('svg')).toBe(originalPage)
    expect(document.body.children).toHaveLength(1)
    destroy()
  })

  it('Canvas 沿用原页面直接导出位图', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      EXPORTED_IMAGE
    )
    const { editor, container, destroy } = createTestEditor({
      data: [{ value: 'canvas export' }]
    })
    const originalPage = container.querySelector('canvas:not(.ce-magnifier)')

    const result = await editor.command.getImage()

    expect(result).toEqual([EXPORTED_IMAGE])
    expect(container.querySelector('canvas:not(.ce-magnifier)')).toBe(
      originalPage
    )
    expect(document.body.children).toHaveLength(1)
    destroy()
  })

  it('导出前等待资源并将 iframe snapshot 叠加到 SVG', async () => {
    const allSettled = vi.spyOn(ImageObserver.prototype, 'allSettled')
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    const snapDomFunction = vi.fn().mockResolvedValue(EXPORTED_IMAGE)
    const drawIframeToSvgPage = vi
      .spyOn(BlockParticle.prototype, 'drawIframeToSvgPage')
      .mockResolvedValue()
    const { editor, destroy } = createTestEditor({
      data: [{ value: 'resource export' }],
      options: { backend: BackendType.SVG }
    })
    allSettled.mockClear()
    toDataURL.mockClear()

    await editor.command.getImage({ snapDomFunction })

    expect(allSettled).toHaveBeenCalled()
    expect(drawIframeToSvgPage).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(SVGSVGElement)]),
      snapDomFunction
    )
    expect(allSettled.mock.invocationCallOrder[0]).toBeLessThan(
      drawIframeToSvgPage.mock.invocationCallOrder[0]
    )
    expect(toDataURL).not.toHaveBeenCalled()
    destroy()
  })

  it('SVG 导出将 iframe 快照写为 image 节点', async () => {
    const snapDomFunction = vi.fn().mockResolvedValue(EXPORTED_IMAGE)
    Object.defineProperty(HTMLIFrameElement.prototype, 'sandbox', {
      configurable: true,
      get: () => ({ add: vi.fn() })
    })
    const { editor, destroy } = createTestEditor({
      data: [
        {
          type: ElementType.BLOCK,
          value: '',
          width: 200,
          height: 100,
          block: {
            type: BlockType.IFRAME,
            iframeBlock: { srcdoc: '<p>iframe content</p>' }
          }
        }
      ],
      options: { backend: BackendType.SVG }
    })

    const [result] = await editor.command.getImage({ snapDomFunction })

    const svgDocument = decodeSvgDataURL(result)
    const image = svgDocument.querySelector('image')
    expect(image?.getAttribute('href')).toBe(EXPORTED_IMAGE)
    expect(snapDomFunction).toHaveBeenCalledOnce()
    destroy()
  })

  it.each([undefined, { offscreen: true }])(
    'SVG 使用矢量页面打印且不遗留临时编辑器：%s',
    async option => {
      const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      const { editor, container, destroy } = createTestEditor({
        data: [{ value: 'svg print' }],
        options: { backend: BackendType.SVG }
      })
      toDataURL.mockClear()
      editor.command.executeSetRange(0, 2)

      await editor.command.executePrint(option)

      const printIframe = document.body.querySelector('iframe')!
      const printDocument = printIframe.contentDocument!
      const printPage = printDocument.querySelector('svg')
      expect(printPage?.textContent).toContain('svg print')
      expect(printPage?.style.userSelect).toBe('text')
      expect(printDocument.querySelector('img')).toBeNull()
      expect(
        Array.from(printPage?.querySelectorAll('rect') || []).some(
          rect => rect.getAttribute('fill') === '#AECBFA'
        )
      ).toBe(false)
      expect(toDataURL).not.toHaveBeenCalled()
      expect(container.querySelector('svg')).not.toBeNull()
      expect(document.body.querySelectorAll(':scope > div')).toHaveLength(1)
      printIframe.contentWindow!.print = vi.fn()
      await new Promise(resolve => setTimeout(resolve))
      expect(printIframe.contentWindow!.print).toHaveBeenCalledOnce()
      printIframe.remove()
      destroy()
    }
  )

  it('SVG 打印先刷新待处理的增量帧', async () => {
    const frameCallbacks = new Map<number, FrameRequestCallback>()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallbacks.set(frameCallbacks.size + 1, callback)
      return frameCallbacks.size
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frameCallbacks.delete(id)
    })
    const { editor, destroy } = createTestEditor({
      data: [{ value: 'old content' }],
      options: { backend: BackendType.SVG }
    })
    editor.command.executeSetValue({
      main: [{ value: 'new content' }]
    })

    const printPromise = editor.command.executePrint()
    await new Promise(resolve => setTimeout(resolve))
    const callbacks = Array.from(frameCallbacks.values())
    frameCallbacks.clear()
    callbacks.forEach(callback => callback(0))
    await printPromise

    const printIframe = document.body.querySelector('iframe')!
    expect(
      printIframe.contentDocument?.querySelector('svg')?.textContent
    ).toContain('new content')
    printIframe.contentWindow!.print = vi.fn()
    await new Promise(resolve => setTimeout(resolve))
    printIframe.remove()
    destroy()
  })

  it('SVG 打印包含全部页面并恢复编辑模式', async () => {
    const { editor, destroy } = createTestEditor({
      data: [
        { value: 'first page' },
        { type: ElementType.PAGE_BREAK, value: '\n' },
        { value: 'second page' }
      ],
      options: { backend: BackendType.SVG }
    })

    await editor.command.executePrint()

    const printIframe = document.body.querySelector('iframe')!
    const printPages = printIframe.contentDocument!.querySelectorAll('svg')
    expect(printPages).toHaveLength(2)
    expect(printPages[1].textContent).toContain('second page')
    expect(editor.command.getOptions().mode).toBe(EditorMode.EDIT)
    printIframe.contentWindow!.print = vi.fn()
    await new Promise(resolve => setTimeout(resolve))
    printIframe.remove()
    destroy()
  })

  it('SVG 打印异常时恢复模式和缩放', async () => {
    vi.spyOn(SvgBackend.prototype, 'flush').mockImplementation(() => {
      throw new Error('flush failed')
    })
    const { editor, destroy } = createTestEditor({
      data: [{ value: 'print failure' }],
      options: { backend: BackendType.SVG, scale: 2 }
    })

    await expect(editor.command.executePrint()).rejects.toThrow('flush failed')

    expect(editor.command.getOptions().mode).toBe(EditorMode.EDIT)
    expect(editor.command.getOptions().scale).toBe(2)
    destroy()
  })

  it('SVG 下明确禁用放大镜且鼠标移动不抛错', () => {
    const { container, destroy } = createTestEditor({
      data: [{ value: 'svg magnifier' }],
      options: { backend: BackendType.SVG, magnifier: { disabled: false } }
    })
    const magnifier = container.querySelector<HTMLCanvasElement>(
      'canvas.ce-magnifier'
    )!
    const page = container.querySelector('svg')!

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt' }))

    expect(magnifier.style.display).not.toBe('block')
    expect(() => {
      page.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: 10,
          clientY: 10
        })
      )
    }).not.toThrow()
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }))
    destroy()
  })
})
