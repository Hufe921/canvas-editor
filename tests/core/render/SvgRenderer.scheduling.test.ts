import { afterEach, describe, expect, it, vi } from 'vitest'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SceneCompiler } from '@/editor/core/render/svg/scene/SceneCompiler'
import { SvgBackend } from '@/editor/core/render/svg/SvgBackend'
import { SvgRenderer } from '@/editor/core/render/svg/SvgRenderer'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

function createDisplayList(content: string, search: string, pageNo = 0) {
  const displayList = new DisplayList()
  displayList.beginGroup(`page:${pageNo}`, 'page')
  displayList.beginGroup(`page:${pageNo}:layer:content`, 'layer')
  displayList.fillText(content, 10, 20)
  displayList.endGroup()
  displayList.beginGroup(`page:${pageNo}:layer:search`, 'layer')
  displayList.fillStyle = '#ff0000'
  displayList.fillRect(10, 20, 30, 10)
  displayList.fillText(search, 10, 30)
  displayList.endGroup()
  displayList.endGroup()
  return displayList
}

function createHost() {
  return document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement
}

function stubFrames() {
  const frameCallbacks = new Map<number, FrameRequestCallback>()
  let frameId = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId
    frameCallbacks.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frameCallbacks.delete(id)
  })
  return {
    frameCallbacks,
    flushFrames() {
      const callbacks = Array.from(frameCallbacks.values())
      frameCallbacks.clear()
      callbacks.forEach(callback => callback(0))
    }
  }
}

describe('SvgRenderer 编译与调度', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('每次全量编译 Scene 并通过 keyed reconcile 保留 DOM 身份', () => {
    const host = createHost()
    const renderer = new SvgRenderer()
    const compileSpy = vi.spyOn(SceneCompiler.prototype, 'compile')
    renderer.render(host, createDisplayList('old content', 'old search'))
    const pageRoot = host.firstElementChild
    const contentText = host.querySelector('text')!
    const searchText = host.querySelectorAll('text')[1]
    const nextDisplayList = createDisplayList('new content', 'new search')

    renderer.render(host, nextDisplayList)

    expect(compileSpy).toHaveBeenLastCalledWith(
      nextDisplayList,
      expect.any(String)
    )
    expect(host.firstElementChild).toBe(pageRoot)
    expect(host.querySelector('text')).toBe(contentText)
    expect(host.querySelectorAll('text')[1]).toBe(searchText)
    expect(contentText.textContent).toBe('new content')
    expect(searchText.textContent).toBe('new search')
  })

  it('同一页在 rAF 中合并多次绘制并只应用最新 DisplayList', () => {
    const { frameCallbacks, flushFrames } = stubFrames()
    const backend = new SvgBackend(document.createElement('div'))
    backend.create(0, 300, 400, 16, 1)
    backend.renderPage(0, createDisplayList('old content', 'old search'))
    const pageRoot = backend.getPage(0).firstElementChild

    backend.renderPage(0, createDisplayList('intermediate', 'old search'))
    backend.renderPage(0, createDisplayList('new content', 'new search'))

    expect(frameCallbacks.size).toBe(1)
    expect(backend.getPage(0).textContent).toContain('old content')
    flushFrames()
    expect(backend.getPage(0).textContent).toContain('new content')
    expect(backend.getPage(0).textContent).toContain('new search')
    expect(backend.getPage(0).textContent).not.toContain('intermediate')
    expect(backend.getPage(0).firstElementChild).toBe(pageRoot)
    backend.destroy()
  })

  it('flush 立即绘制所有待处理页面并取消已调度帧', () => {
    const { frameCallbacks } = stubFrames()
    const backend = new SvgBackend(document.createElement('div'))
    backend.create(0, 300, 400, 16, 1)
    backend.create(1, 300, 400, 16, 1)
    backend.renderPage(0, createDisplayList('page 0 old', 'search', 0))
    backend.renderPage(1, createDisplayList('page 1 old', 'search', 1))
    backend.renderPage(0, createDisplayList('page 0 new', 'search', 0))
    backend.renderPage(1, createDisplayList('page 1 new', 'search', 1))

    backend.flush()

    expect(frameCallbacks.size).toBe(0)
    expect(backend.getPage(0).textContent).toContain('page 0 new')
    expect(backend.getPage(1).textContent).toContain('page 1 new')
    backend.destroy()
  })
})
