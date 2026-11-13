import { afterEach, describe, expect, it, vi } from 'vitest'
import { Badge } from '@/editor/core/draw/frame/Badge'
import { Draw } from '@/editor/core/draw/Draw'
import { DisplayList } from '@/editor/core/render/model/DisplayList'

class FakeImage {
  public onload: ((event: Event) => void) | null = null
  public src = ''

  constructor() {
    images.push(this)
  }

  public setAttribute() {}
}

const images: FakeImage[] = []

function createBadge() {
  let renderCount = 0
  const render = vi.fn(() => {
    renderCount++
  })
  const draw = {
    getOptions: () => ({
      scale: 1,
      badge: { left: 0, top: 0 }
    }),
    getMargins: () => [0, 0, 0, 0],
    getHeader: () => ({ getExtraHeight: () => 0 }),
    getArea: () => ({ getAreaInfo: () => new Map() }),
    getRenderCount: () => renderCount,
    render
  } as unknown as Draw
  const badge = new Badge(draw)
  badge.setMainBadge({
    width: 100,
    height: 50,
    value: 'https://example.com/badge.png'
  })
  return { badge, render }
}

describe('Badge', () => {
  afterEach(() => {
    images.length = 0
    vi.unstubAllGlobals()
  })

  it('首次图片异步加载后触发重渲染而不向旧 DisplayList 补画', () => {
    vi.stubGlobal('Image', FakeImage)
    const { badge, render } = createBadge()
    const displayList = new DisplayList()

    badge.render(displayList, 0)
    images[0].onload!(new Event('load'))

    expect(render).toHaveBeenCalledWith({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    expect(displayList.getOperations()).toEqual([])
  })
})
