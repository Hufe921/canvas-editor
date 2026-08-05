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
  p.width = element.width!
  p.height = element.height!
  p._mousemove({ x: endX, y: 100, preventDefault: () => {} } as any)
  return p.width
}

describe('Previewer RTL resize mirror', () => {
  it('right-middle handle: RTL drag right shrinks (mirrored from LTR)', () => {
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
    // RTL: drag right (+50) mirrors to shrink to 50
    const rtl = drag(previewer, 3, 200, 250, rtlEl)
    expect(rtl).toBe(50)
  })

  it('left-middle handle: RTL drag left grows (mirrored from LTR)', () => {
    const previewer = new Previewer(mockDraw())
    // LTR: drag left (-50) grows to 150
    const ltr = drag(previewer, 7, 200, 150, {
      width: 100,
      height: 50
    } as IElement)
    expect(ltr).toBe(150)
    // RTL: drag left (-50) shrinks to 50
    const rtl = drag(previewer, 7, 200, 150, {
      width: 100,
      height: 50,
      direction: TextDirection.RTL
    } as IElement)
    expect(rtl).toBe(50)
  })
})
