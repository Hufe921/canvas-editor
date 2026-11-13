import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { ImageParticle } from '@/editor/core/draw/particle/ImageParticle'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IElement } from '@/editor/interface/Element'

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
})
