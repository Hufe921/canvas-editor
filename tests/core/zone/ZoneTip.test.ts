import { describe, expect, it, vi } from 'vitest'
import { ZoneTip } from '@/editor/core/zone/ZoneTip'
import { EditorZone } from '@/editor/dataset/enum/Editor'
import { mergeOption } from '@/editor/utils/option'

describe('ZoneTip', () => {
  it('从 SVG 子节点计算页码和区域纵坐标', () => {
    const container = document.createElement('div')
    const pageContainer = document.createElement('div')
    const page = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    page.dataset.index = '3'
    page.append(text)
    pageContainer.append(page)
    container.append(pageContainer)
    document.body.append(container)
    page.getBoundingClientRect = () =>
      ({ left: 0, top: 20, width: 200, height: 300 }) as DOMRect
    const getZoneByY = vi.fn().mockReturnValue(EditorZone.HEADER)
    const zone = {
      getZoneByY,
      getZone: () => EditorZone.MAIN
    }
    const draw = {
      getI18n: () => ({ t: () => '页眉提示' }),
      getContainer: () => container,
      getPageContainer: () => pageContainer,
      getOptions: () => mergeOption(),
      getIsPagingMode: () => true
    }
    new ZoneTip(draw as any, zone as any)
    pageContainer.dispatchEvent(new MouseEvent('mouseenter'))

    text.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 30,
        clientY: 70
      })
    )

    expect(getZoneByY).toHaveBeenCalledWith(50, 3)
    expect(container.querySelector('.ce-zone-tip')?.classList).toContain('show')
    container.remove()
  })
})
