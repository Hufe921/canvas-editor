import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { LaTexParticle } from '@/editor/core/draw/particle/latex/LaTexParticle'
import { ImageObserver } from '@/editor/core/observer/ImageObserver'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IElement } from '@/editor/interface/Element'

class FakeImage {
  public onload: ((event: Event) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public src = ''

  constructor() {
    images.push(this)
  }
}

const images: FakeImage[] = []
const element: IElement = {
  type: ElementType.LATEX,
  value: 'x^2',
  laTexSVG: 'data:image/svg+xml;base64,eA==',
  width: 100,
  height: 50
}

function createParticle() {
  const imageObserver = new ImageObserver()
  let renderCount = 0
  let renderedDisplayList: DisplayList | undefined
  const render = vi.fn(() => {
    renderCount++
    renderedDisplayList = new DisplayList()
    particle.render(renderedDisplayList, element, 10, 20)
  })
  const draw = {
    getOptions: () => ({ scale: 1 }),
    getContainer: () => document.createElement('div'),
    getImageObserver: () => imageObserver,
    getRenderCount: () => renderCount,
    render
  } as unknown as Draw
  const particle = new LaTexParticle(draw)
  return {
    particle,
    imageObserver,
    render,
    getRenderedDisplayList: () => renderedDisplayList
  }
}

describe('LaTexParticle', () => {
  afterEach(() => {
    images.length = 0
    vi.unstubAllGlobals()
  })

  it('首次图片异步加载后触发重渲染而不向旧 DisplayList 补画', () => {
    vi.stubGlobal('Image', FakeImage)
    const { particle, render } = createParticle()
    const displayList = new DisplayList()

    particle.render(displayList, element, 10, 20)
    images[0].onload!(new Event('load'))

    expect(render).toHaveBeenCalledWith({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    expect(displayList.getOperations()).toEqual([])
  })

  it('首次导出等待图片缓存及同步重渲染完成', async () => {
    vi.stubGlobal('Image', FakeImage)
    const {
      particle,
      imageObserver,
      render,
      getRenderedDisplayList
    } = createParticle()
    const displayList = new DisplayList()

    particle.render(displayList, element, 10, 20)
    const waiting = imageObserver.allSettled()
    images[0].onload!(new Event('load'))
    await waiting

    expect(render).toHaveBeenCalledTimes(1)
    expect(displayList.getOperations()).toEqual([])
    expect(getRenderedDisplayList()!.getOperations()).toEqual([
      { type: 'drawImage', args: [images[0], 10, 20, 100, 50] }
    ])
  })
})
