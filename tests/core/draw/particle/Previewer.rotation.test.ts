import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Draw } from '@/editor/core/draw/Draw'
import { Previewer } from '@/editor/core/draw/particle/previewer/Previewer'
import { EditorMode } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement, IElementPosition } from '@/editor/interface/Element'

function createPreviewer(imgRotation?: number) {
  const container = document.createElement('div')
  document.body.append(container)
  const render = vi.fn()
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
    isDesignMode: () => false,
    isReadonly: () => false,
    render
  } as unknown as Draw
  const element: IElement = {
    type: ElementType.IMAGE,
    value: 'data:image/png;base64,',
    width: 100,
    height: 50,
    imgRotation
  }
  const position = {
    pageNo: 0,
    index: 0,
    ascent: 0,
    coordinate: {
      leftTop: [10, 20],
      leftBottom: [10, 70],
      rightTop: [110, 20],
      rightBottom: [110, 70]
    }
  } as IElementPosition
  const previewer = new Previewer(draw)
  previewer.drawResizer(element, position)
  return { container, element, render }
}

function dragRotate(
  handle: HTMLElement,
  x: number,
  y: number,
  shiftKey = false
) {
  handle.dispatchEvent(
    new MouseEvent('mousedown', {
      bubbles: true,
      clientX: 60,
      clientY: 0
    })
  )
  document.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: x,
      clientY: y,
      shiftKey
    })
  )
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
}

describe('Previewer 图片旋转', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.cursor = ''
  })

  it('拖动旋转手柄更新图片角度及选框', () => {
    const { container, element, render } = createPreviewer()
    const handle = container.querySelector<HTMLElement>(
      '.resizer-rotate-handle'
    )!

    dragRotate(handle, 110, 45)

    expect(element.imgRotation).toBe(90)
    expect(
      container.querySelector<HTMLElement>('.ce-resizer-size-view span')!
        .innerText
    ).toBe('50 × 100')
    expect(
      container.querySelector<HTMLElement>('.ce-resizer-selection')!.style
        .transform
    ).toBe('rotate(90deg)')
    expect(render).toHaveBeenCalledWith({
      isSetCursor: true,
      curIndex: 0
    })
  })

  it('Shift 拖动按 45 度吸附', () => {
    const { container, element } = createPreviewer()
    const handle = container.querySelector<HTMLElement>(
      '.resizer-rotate-handle'
    )!

    dragRotate(handle, 110, -40, true)

    expect(element.imgRotation).toBe(45)
    expect(
      container.querySelector<HTMLElement>('.ce-resizer-size-view span')!
        .innerText
    ).toBe('106 × 106')
  })

  it('已有旋转角度会同步到图片工具', () => {
    const { container } = createPreviewer(45)

    expect(
      container.querySelector<HTMLElement>('.ce-resizer-selection')!.style
        .transform
    ).toBe('rotate(45deg)')
  })
})
