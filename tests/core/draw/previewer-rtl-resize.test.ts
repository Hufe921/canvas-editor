import { describe, expect, it } from 'vitest'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { Previewer } from '../../../src/editor/core/draw/particle/previewer/Previewer'
import type { IElement } from '../../../src/editor/interface/Element'

function mockDraw() {
  const container = document.createElement('div')
  const page = document.createElement('canvas')
  const options = {
    scale: 1,
    resizerColor: '#000000',
    resizerSize: 8
  } as any
  return {
    getContainer: () => container,
    getPage: () => page,
    getOptions: () => options,
    getEventBus: () => ({
      isSubscribe: () => false,
      emit: () => undefined
    }),
    getHeight: () => 800,
    getPageGap: () => 80,
    getPageNo: () => 0,
    isReadonly: () => false
  } as any
}

function drag(
  previewer: Previewer,
  handleIndex: number,
  startX: number,
  endX: number,
  element: IElement
) {
  const p = previewer as any
  p.curElement = element
  p.previewerDrawOption = {}
  p.curHandleIndex = handleIndex
  p.mousedownX = startX
  p.mousedownY = 100
  p.resizerStartLeft = 100
  p.resizerStartTop = 200
  p.width = element.width!
  p.height = element.height!
  p._mousemove({ x: endX, y: 100, preventDefault: () => {} } as any)
  return p.width
}

describe('Previewer RTL resize mirror', () => {
  it('right-middle handle keeps physical drag direction in RTL', () => {
    const previewer = new Previewer(mockDraw())
    const rtlEl = {
      width: 100,
      height: 50,
      direction: TextDirection.RTL
    } as IElement
    // LTR: drag right (+50) grows to 150
    const ltr = drag(previewer, 3, 200, 250, {
      width: 100,
      height: 50
    } as IElement)
    expect(ltr).toBe(150)
    // RTL: physical right drag also grows to 150
    const rtl = drag(previewer, 3, 200, 250, rtlEl)
    expect(rtl).toBe(150)
  })

  it('left-middle handle keeps physical drag direction in RTL', () => {
    const previewer = new Previewer(mockDraw())
    // LTR: drag left (-50) grows to 150
    const ltr = drag(previewer, 7, 200, 150, {
      width: 100,
      height: 50
    } as IElement)
    expect(ltr).toBe(150)
    // RTL: physical left drag also grows to 150
    const rtl = drag(previewer, 7, 200, 150, {
      width: 100,
      height: 50,
      direction: TextDirection.RTL
    } as IElement)
    expect(rtl).toBe(150)
  })

  it('top handle moves the top edge with the vertical resize', () => {
    const previewer = new Previewer(mockDraw())
    const p = previewer as any
    p.curElement = { width: 100, height: 50 }
    p.previewerDrawOption = {}
    p.curHandleIndex = 1
    p.mousedownX = 200
    p.mousedownY = 100
    p.resizerStartLeft = 100
    p.resizerStartTop = 200
    p.width = 100
    p.height = 50
    p._mousemove({
      x: 200,
      y: 80,
      preventDefault: () => {}
    } as any)

    expect(p.height).toBe(70)
    expect(p.resizerSelection.style.top).toBe('180px')
    expect(p.resizerImageContainer.style.top).toBe('180px')
  })
})
