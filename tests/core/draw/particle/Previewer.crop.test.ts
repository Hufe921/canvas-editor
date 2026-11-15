import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Draw } from '@/editor/core/draw/Draw'
import { Previewer } from '@/editor/core/draw/particle/previewer/Previewer'
import { EditorMode } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import type {
  IElement,
  IElementPosition,
  IImageCrop
} from '@/editor/interface/Element'

function createPreviewer(
  options: { readonly?: boolean; imgCrop?: IImageCrop } = {}
) {
  const container = document.createElement('div')
  document.body.append(container)
  const render = vi.fn()
  const element: IElement = {
    id: 'image-1',
    type: ElementType.IMAGE,
    value: 'data:image/png;base64,',
    width: 100,
    height: 50,
    imgCrop: options.imgCrop
  }
  const draw = {
    getContainer: () => container,
    getPage: () => document.createElement('canvas'),
    getOptions: () => ({
      scale: 1,
      resizerColor: '#000000',
      resizerSize: 6,
      modeRule: {}
    }),
    getEventBus: () => ({ isSubscribe: () => false }),
    getPageNo: () => 0,
    getPageOffset: () => ({ x: 0, y: 0 }),
    getMode: () => EditorMode.EDIT,
    getImageParticle: () => ({ getOriginalMainImageList: () => [element] }),
    isDesignMode: () => false,
    isReadonly: () => options.readonly || false,
    render
  } as unknown as Draw
  const position = {
    pageNo: 0,
    index: 0,
    ascent: 0,
    coordinate: {
      leftTop: [0, 0],
      leftBottom: [0, 50],
      rightTop: [100, 0],
      rightBottom: [100, 50]
    }
  } as IElementPosition
  const previewer = new Previewer(draw)
  previewer.drawResizer(element, position)
  previewer.render()
  return { element, render }
}

function drag(
  element: HTMLElement,
  from: [number, number],
  to: [number, number]
) {
  element.dispatchEvent(
    new MouseEvent('mousedown', {
      bubbles: true,
      clientX: from[0],
      clientY: from[1]
    })
  )
  document.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: to[0],
      clientY: to[1]
    })
  )
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
}

function click(selector: string) {
  document.querySelector<HTMLElement>(selector)!.click()
}

describe('Previewer 图片裁剪', () => {
  beforeEach(() => {
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(
      200
    )
    vi.spyOn(
      HTMLImageElement.prototype,
      'naturalHeight',
      'get'
    ).mockReturnValue(100)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    vi.restoreAllMocks()
  })

  it('拖动裁剪手柄后同步原图裁剪区域及文档尺寸', () => {
    const { element, render } = createPreviewer()
    click('.image-crop')
    const handle = document.querySelector<HTMLElement>(
      '.ce-image-cropper-handle.handle-4'
    )!

    drag(handle, [200, 100], [150, 50])
    const selection = document.querySelector<HTMLElement>(
      '.ce-image-cropper-selection'
    )!
    expect(selection.style.width).toBe('150px')
    expect(selection.style.height).toBe('50px')
    expect(document.querySelector('.ce-image-cropper-size')).toBeNull()
    click('.crop-confirm')

    expect(element.imgCrop).toEqual({ x: 0, y: 0, width: 150, height: 50 })
    expect(element.width).toBe(75)
    expect(element.height).toBe(25)
    expect(render).toHaveBeenLastCalledWith({
      isSetCursor: true,
      curIndex: 0
    })
    expect(document.querySelector('.ce-image-previewer')).toBeNull()
  })

  it('已有裁剪区域可移动并保持当前显示比例', () => {
    const { element } = createPreviewer({
      imgCrop: { x: 20, y: 10, width: 100, height: 50 }
    })
    click('.image-crop')
    const selection = document.querySelector<HTMLElement>(
      '.ce-image-cropper-selection'
    )!

    expect(selection.style.left).toBe('20px')
    expect(selection.style.top).toBe('10px')
    drag(selection, [60, 30], [80, 45])
    click('.crop-confirm')

    expect(element.imgCrop).toEqual({ x: 40, y: 25, width: 100, height: 50 })
    expect(element.width).toBe(100)
    expect(element.height).toBe(50)
  })

  it('取消裁剪恢复预览变换且不修改图片', () => {
    const imgCrop = { x: 20, y: 10, width: 100, height: 50 }
    const { element } = createPreviewer({ imgCrop })
    click('.zoom-in')
    click('.image-crop')
    expect(
      document.querySelector<HTMLImageElement>('.ce-image-container img')!.style
        .transform
    ).toBe('scale(1) rotate(0deg)')

    click('.crop-cancel')

    expect(
      document.querySelector<HTMLImageElement>('.ce-image-container img')!.style
        .transform
    ).toBe('scale(1.1) rotate(0deg)')
    expect(element.imgCrop).toBe(imgCrop)
    expect(element.width).toBe(100)
    expect(element.height).toBe(50)
    expect(document.querySelector('.ce-image-cropper')).toBeNull()
  })

  it('旋转影子只显示裁剪后的图片区域', () => {
    createPreviewer({
      imgCrop: { x: 20, y: 10, width: 100, height: 50 }
    })
    const handle = document.querySelector<HTMLElement>(
      '.resizer-rotate-handle'
    )!

    handle.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 50,
        clientY: -20
      })
    )

    const ghost = document.querySelector<HTMLElement>('.ce-resizer-image')!
    const image = ghost.querySelector<HTMLImageElement>('img')!
    expect(ghost.style.width).toBe('100px')
    expect(ghost.style.height).toBe('50px')
    expect(image.style.width).toBe('200px')
    expect(image.style.height).toBe('100px')
    expect(image.style.left).toBe('-20px')
    expect(image.style.top).toBe('-10px')
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  })

  it('只读模式隐藏裁剪入口', () => {
    createPreviewer({ readonly: true })

    expect(
      document.querySelector<HTMLElement>('.image-crop')!.style.display
    ).toBe('none')
  })
})
