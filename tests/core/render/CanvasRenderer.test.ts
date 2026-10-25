import { describe, expect, it, vi } from 'vitest'
import { CanvasRenderer } from '@/editor/core/render/canvas/CanvasRenderer'
import { DisplayList } from '@/editor/core/render/model/DisplayList'

function createContext() {
  return document.createElement('canvas').getContext('2d')!
}

describe('CanvasRenderer', () => {
  it('将绘制指令按顺序重放到 Canvas 上下文', () => {
    const ctx = createContext()
    const fillRect = vi.spyOn(ctx, 'fillRect')
    const displayList = new DisplayList()
    displayList.fillStyle = '#00ff00'
    displayList.fillRect(1, 2, 3, 4)

    new CanvasRenderer().render(ctx, displayList)

    expect(ctx.fillStyle).toBe('#00ff00')
    expect(fillRect).toHaveBeenCalledWith(1, 2, 3, 4)
  })

  it('重放变换、路径和状态栈', () => {
    const ctx = createContext()
    const translate = vi.spyOn(ctx, 'translate')
    const stroke = vi.spyOn(ctx, 'stroke')
    const displayList = new DisplayList()
    displayList.save()
    displayList.translate(10, 20)
    displayList.beginPath()
    displayList.moveTo(0, 0)
    displayList.lineTo(5, 5)
    displayList.stroke()
    displayList.restore()

    new CanvasRenderer().render(ctx, displayList)

    expect(translate).toHaveBeenCalledWith(10, 20)
    expect(stroke).toHaveBeenCalledOnce()
  })

  it('重放平铺样式时创建 CanvasPattern', () => {
    const ctx = createContext()
    const createPattern = vi.spyOn(ctx, 'createPattern')
    const image = document.createElement('canvas')
    const displayList = new DisplayList()
    const pattern = displayList.createPattern(image, 'repeat')
    displayList.fillStyle = pattern
    displayList.fillRect(0, 0, 10, 10)

    new CanvasRenderer().render(ctx, displayList)

    expect(createPattern).toHaveBeenCalledWith(image, 'repeat')
  })

  it('来源元数据不会作为 maxWidth 传给 Canvas fillText', () => {
    const ctx = createContext()
    const fillText = vi.spyOn(ctx, 'fillText')
    const displayList = new DisplayList()
    displayList.fillTextWithSource('正文', 10, 20, { key: 'text:1' })

    new CanvasRenderer().render(ctx, displayList)

    expect(fillText).toHaveBeenCalledWith('正文', 10, 20)
  })

  it('支持图片绘制指令', () => {
    const ctx = createContext()
    const drawImage = vi.spyOn(ctx, 'drawImage')
    const image = new Image()
    const displayList = new DisplayList()
    displayList.drawImage(image, 1, 2, 3, 4)

    new CanvasRenderer().render(ctx, displayList)

    expect(drawImage).toHaveBeenCalledWith(image, 1, 2, 3, 4)
  })
})
