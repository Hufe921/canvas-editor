import { describe, expect, it } from 'vitest'
import { getPagePointer } from '@/editor/core/event/pagePointer'

function createPage() {
  const container = document.createElement('div')
  const page = document.createElement('div')
  const child = document.createElement('span')
  page.dataset.index = '2'
  page.append(child)
  container.append(page)
  document.body.append(container)
  return { container, page, child }
}

describe('getPagePointer', () => {
  it('从子元素定位所属页面并换算页面坐标', () => {
    const { container, page, child } = createPage()
    page.getBoundingClientRect = () =>
      ({ left: 100, top: 50, width: 400, height: 600 }) as DOMRect
    Object.defineProperties(page, {
      clientWidth: { value: 200 },
      clientHeight: { value: 300 }
    })
    const event = new MouseEvent('mousedown', {
      clientX: 180,
      clientY: 110
    })
    Object.defineProperty(event, 'target', { value: child })

    expect(getPagePointer(event, container)).toEqual({
      x: 40,
      y: 30,
      pageNo: 2,
      page
    })
    container.remove()
  })

  it('SVG 页面没有 clientWidth 时使用矩形尺寸换算', () => {
    const container = document.createElement('div')
    const page = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const child = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    page.dataset.index = '0'
    child.dataset.index = '99'
    page.append(child)
    container.append(page)
    page.getBoundingClientRect = () =>
      ({ left: 10, top: 20, width: 200, height: 300 }) as DOMRect
    const event = new MouseEvent('mousedown', {
      clientX: 60,
      clientY: 70
    })
    Object.defineProperty(event, 'target', { value: child })

    expect(getPagePointer(event, container)).toMatchObject({ x: 50, y: 50 })
  })

  it('事件目标不属于页面时返回空值', () => {
    const { container } = createPage()
    const event = new MouseEvent('mousedown')
    Object.defineProperty(event, 'target', { value: container })

    expect(getPagePointer(event, container)).toBeNull()
    container.remove()
  })
})
