import { afterEach, describe, expect, it, vi } from 'vitest'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SvgRenderer } from '@/editor/core/render/svg/SvgRenderer'
import { BlockType } from '@/editor/dataset/enum/Block'
import { FlexDirection, ImageDisplay } from '@/editor/dataset/enum/Common'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { BackendType, PageMode } from '@/editor/dataset/enum/Editor'
import type { IElement } from '@/editor/interface/Element'
import { createTestEditor, waitMacroTask } from '../../factories/editor'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const cleanups: (() => void)[] = []

function createSvgEditor(
  data: any,
  options: Record<string, unknown> = {}
) {
  class VisibleIntersectionObserver {
    private callback: IntersectionObserverCallback

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }

    observe(target: Element) {
      this.callback(
        [{ target, isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    }

    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
  const context = createTestEditor({
    data,
    options: {
      backend: BackendType.SVG,
      pageMode: PageMode.PAGING,
      lineBreak: { disabled: true },
      ...options
    }
  })
  cleanups.push(context.destroy)
  return context
}

function tableCell(value: IElement[]) {
  return {
    colspan: 1,
    rowspan: 1,
    value: [...value, { value: '\n' }]
  }
}

function createPagedTable(): IElement {
  const nestedTable: IElement = {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 150 }],
    trList: [
      {
        height: 30,
        minHeight: 30,
        tdList: [tableCell([{ value: 'nested-cell' }])]
      }
    ]
  }
  return {
    id: 'paged-table',
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 400 }],
    trList: Array.from({ length: 20 }, (_, rowIndex) => ({
      height: 100,
      minHeight: 100,
      pagingRepeat: rowIndex === 0,
      tdList: [
        tableCell(
          rowIndex === 0
            ? [{ value: 'repeat-heading' }, nestedTable]
            : [{ value: `body-${rowIndex}` }]
        )
      ]
    }))
  }
}

class AutoLoadImage {
  constructor() {
    const image = document.createElement('img')
    let src = ''
    Object.defineProperty(image, 'src', {
      configurable: true,
      get: () => src,
      set: value => {
        src = String(value)
        image.setAttribute('src', src)
        queueMicrotask(() => image.onload?.(new Event('load')))
      }
    })
    return image
  }
}

afterEach(() => {
  while (cleanups.length) cleanups.pop()!()
  vi.unstubAllGlobals()
})

describe('SvgRenderer 文档渲染', () => {
  it('渲染表格、嵌套表格和续页重复表头', () => {
    const { container } = createSvgEditor([createPagedTable()])
    const pages = Array.from(container.querySelectorAll('svg'))
    const texts = pages.flatMap(page =>
      Array.from(page.querySelectorAll('text')).map(text => text.textContent)
    )

    expect(pages.length).toBeGreaterThan(1)
    expect(texts.some(text => text?.endsWith('nested-cell'))).toBe(true)
    expect(texts.some(text => text?.endsWith('body-19'))).toBe(true)
    expect(
      texts.filter(text => text?.endsWith('repeat-heading')).length
    ).toBe(pages.length)
    expect(pages.every(page => page.querySelectorAll('path, rect').length > 0)).toBe(
      true
    )
  })

  it('九参数 drawImage 使用目标 clipPath 和缩放图像完成源区域裁切', () => {
    const host = document.createElementNS(
      SVG_NAMESPACE,
      'svg'
    ) as SVGSVGElement
    const image = document.createElement('img')
    image.src = 'data:image/png;base64,cG5n'
    Object.defineProperties(image, {
      naturalWidth: { value: 400 },
      naturalHeight: { value: 300 }
    })
    const displayList = new DisplayList()
    displayList.beginGroup('page:0', 'page')
    displayList.translate(5, 5)
    displayList.drawImage(image, 10, 20, 100, 80, 50, 60, 200, 160)
    displayList.endGroup()

    new SvgRenderer().render(host, displayList)

    const renderedImage = host.querySelector('image')!
    const clipReference = renderedImage.getAttribute('clip-path')!
    const clipId = clipReference.match(/^url\(#(.+)\)$/)?.[1]
    const clip = host.querySelector(`clipPath[id="${clipId}"]`)!
    const clipRect = clip.querySelector('rect')!
    expect(renderedImage.getAttribute('href')).toBe(image.src)
    expect(renderedImage.getAttribute('x')).toBe('0')
    expect(renderedImage.getAttribute('y')).toBe('0')
    expect(renderedImage.getAttribute('width')).toBe('400')
    expect(renderedImage.getAttribute('height')).toBe('300')
    expect(renderedImage.getAttribute('transform')).toBe(
      'matrix(2 0 0 2 35 25)'
    )
    expect(clipRect.getAttribute('transform')).toBe('matrix(1 0 0 1 5 5)')
    expect(clipRect.getAttribute('x')).toBe('50')
    expect(clipRect.getAttribute('y')).toBe('60')
    expect(clipRect.getAttribute('width')).toBe('200')
    expect(clipRect.getAttribute('height')).toBe('160')
    for (const attribute of [
      'sourceX',
      'sourceY',
      'sourceWidth',
      'sourceHeight'
    ]) {
      expect(renderedImage.hasAttribute(attribute)).toBe(false)
    }
  })

  it('渲染浮动图片、LaTeX、badge 和水印并保留资源 href', async () => {
    vi.stubGlobal('Image', AutoLoadImage)
    const { container, editor } = createSvgEditor(
      [
        {
          type: ElementType.IMAGE,
          value: 'data:image/png;base64,ZmxvYXQ=',
          width: 80,
          height: 40,
          imgDisplay: ImageDisplay.FLOAT_TOP,
          imgFloatPosition: { x: 300, y: 200 }
        },
        {
          type: ElementType.LATEX,
          value: 'x^2',
          width: 60,
          height: 30
        },
        { value: '\n' }
      ],
      {
        watermark: {
          data: 'CONFIDENTIAL',
          opacity: 0.25,
          repeat: false
        }
      }
    )
    editor.command.executeSetMainBadge({
      width: 50,
      height: 30,
      value: 'data:image/png;base64,YmFkZ2U='
    })
    await waitMacroTask()
    await waitMacroTask()
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => resolve())
    )

    const svg = container.querySelector('svg')!
    const hrefs = Array.from(svg.querySelectorAll('image')).map(image =>
      image.getAttribute('href')
    )
    expect(hrefs).toContain('data:image/png;base64,ZmxvYXQ=')
    expect(hrefs).toContain('data:image/png;base64,YmFkZ2U=')
    expect(hrefs.some(href => href?.startsWith('data:image/svg+xml'))).toBe(true)
    expect(
      Array.from(svg.querySelectorAll('text')).some(
        text =>
          text.textContent === 'CONFIDENTIAL' &&
          text.getAttribute('opacity') === '0.25'
      )
    ).toBe(true)
  })

  it('渲染控件、页眉页脚、页码和行号', () => {
    const { container } = createSvgEditor(
      {
        header: [{ value: 'header-text' }],
        main: [
          {
            type: ElementType.CONTROL,
            value: '',
            control: {
              type: ControlType.TEXT,
              value: [{ value: 'control-value' }],
              prefix: '[',
              postfix: ']',
              border: true
            }
          },
          {
            type: ElementType.CONTROL,
            value: '',
            control: {
              type: ControlType.CHECKBOX,
              value: null,
              code: 'yes',
              flexDirection: FlexDirection.ROW,
              valueSets: [{ value: 'choice', code: 'yes' }]
            }
          },
          { value: '\n' }
        ],
        footer: [{ value: 'footer-text' }]
      },
      {
        pageNumber: { disabled: false, format: 'Page {pageNo}' },
        lineNumber: { disabled: false }
      }
    )

    const svg = container.querySelector('svg')!
    const texts = Array.from(svg.querySelectorAll('text')).map(
      text => text.textContent
    )
    expect(texts).toContain('control-value')
    expect(texts).toContain('choice')
    expect(texts.some(text => text?.endsWith('header-text'))).toBe(true)
    expect(texts.some(text => text?.endsWith('footer-text'))).toBe(true)
    expect(texts).toContain('Page 1')
    expect(texts).toContain('1')
    expect(svg.querySelectorAll('path[stroke], rect[stroke]').length).toBeGreaterThan(
      0
    )
  })

  it('iframe 和 video 保持 HTML overlay 且 SVG 不使用 foreignObject', () => {
    const sandbox = Object.getOwnPropertyDescriptor(
      HTMLIFrameElement.prototype,
      'sandbox'
    )
    Object.defineProperty(HTMLIFrameElement.prototype, 'sandbox', {
      configurable: true,
      value: { add() {} }
    })
    const { container } = createSvgEditor([
      {
        type: ElementType.BLOCK,
        value: '',
        width: 200,
        height: 100,
        block: {
          type: BlockType.IFRAME,
          iframeBlock: { srcdoc: '<p>frame</p>' }
        }
      },
      {
        type: ElementType.BLOCK,
        value: '',
        width: 200,
        height: 100,
        block: {
          type: BlockType.VIDEO,
          videoBlock: { src: 'movie.mp4' }
        }
      },
      { value: '\n' }
    ])

    expect(container.querySelector('iframe')).not.toBeNull()
    expect(container.querySelector('video')).not.toBeNull()
    expect(container.querySelector('svg foreignObject')).toBeNull()
    if (sandbox) {
      Object.defineProperty(HTMLIFrameElement.prototype, 'sandbox', sandbox)
    } else {
      delete (HTMLIFrameElement.prototype as any).sandbox
    }
  })
})
