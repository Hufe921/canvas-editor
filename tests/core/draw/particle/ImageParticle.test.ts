import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Draw } from '@/editor/core/draw/Draw'
import { ImageParticle } from '@/editor/core/draw/particle/ImageParticle'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'

class MockImage {
  public onload: ((event: Event) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public src = ''

  constructor() {
    mockImages.push(this)
  }

  public setAttribute() {}
}

const mockImages: MockImage[] = []

function createParticle() {
  const render = vi.fn()
  const draw = {
    getOptions: () => ({ scale: 1 }),
    getContainer: () => document.createElement('div'),
    getImageObserver: () => ({ add: vi.fn() }),
    getRenderCount: () => 0,
    render
  } as unknown as Draw
  return { particle: new ImageParticle(draw), render }
}

describe('ImageParticle', () => {
  afterEach(() => {
    mockImages.length = 0
    vi.unstubAllGlobals()
  })

  it('图片异步加载后触发正常重渲染而不向旧 DisplayList 补画', () => {
    vi.stubGlobal('Image', MockImage)
    const { particle, render } = createParticle()
    const displayList = new DisplayList()
    const element: IElement = {
      type: ElementType.IMAGE,
      value: 'https://example.com/image.png',
      width: 100,
      height: 50
    }

    particle.render(displayList, element, 0, 0)
    mockImages[0].onload!(new Event('load'))

    expect(render).toHaveBeenCalledWith({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    expect(displayList.getOperations()).toEqual([])
  })

  it('同一 pending 图片重复绘制只发起一次加载', () => {
    vi.stubGlobal('Image', MockImage)
    const { particle, render } = createParticle()
    const displayList = new DisplayList()
    const element: IElement = {
      type: ElementType.IMAGE,
      value: 'https://example.com/shared.png',
      width: 100,
      height: 50
    }

    particle.render(displayList, element, 0, 0)
    particle.render(displayList, element, 0, 0)
    mockImages[0].onload!(new Event('load'))

    expect(mockImages).toHaveLength(1)
    expect(render).toHaveBeenCalledOnce()
  })

  it('按元素角度围绕图片中心绘制旋转图片', () => {
    vi.stubGlobal('Image', MockImage)
    const { particle } = createParticle()
    const displayList = new DisplayList()
    const element: IElement = {
      type: ElementType.IMAGE,
      value: 'https://example.com/rotated.png',
      width: 100,
      height: 50,
      imgRotation: 45
    }

    particle.render(displayList, element, 10, 20)
    mockImages[0].onload!(new Event('load'))
    particle.render(displayList, element, 10, 20)
    const layoutSize = 150 * Math.SQRT1_2

    expect(displayList.getOperations()).toEqual([
      { type: 'save', args: [] },
      {
        type: 'translate',
        args: [10 + layoutSize / 2, 20 + layoutSize / 2]
      },
      { type: 'rotate', args: [Math.PI / 4] },
      {
        type: 'drawImage',
        args: [mockImages[0], -50, -25, 100, 50]
      },
      { type: 'restore', args: [] }
    ])
  })
})
