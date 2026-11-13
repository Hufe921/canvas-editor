import { describe, expect, it, vi } from 'vitest'
import { CanvasRenderer } from '@/editor/core/render/canvas/CanvasRenderer'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SVG_NAMESPACE } from '@/editor/core/render/svg/scene/SvgNodeFactory'
import { SvgRenderer } from '@/editor/core/render/svg/SvgRenderer'
import { BackendType, PageMode } from '@/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'

function createComplexDisplayList(image: HTMLImageElement) {
  const displayList = new DisplayList()
  displayList.beginGroup('page:0', 'page')
  displayList.fillStyle = '#ffffff'
  displayList.fillRect(0, 0, 794, 1123)
  displayList.beginGroup('page:0:content', 'layer')
  displayList.fillStyle = '#1677ff'
  displayList.fillRect(100, 100, 300, 80)
  displayList.strokeStyle = '#222222'
  displayList.lineWidth = 2
  displayList.strokeRect(100, 100, 300, 80)
  displayList.fillStyle = '#111111'
  displayList.font = 'bold 18px Arial'
  displayList.textBaseline = 'alphabetic'
  displayList.fillText('Header / 页眉', 120, 135)
  displayList.font = '16px Arial'
  displayList.fillText('Table cell and controls', 120, 165)
  displayList.drawImage(image, 450, 100, 120, 80)
  displayList.beginPath()
  displayList.moveTo(100, 220)
  displayList.lineTo(570, 220)
  displayList.stroke()
  displayList.endGroup()
  displayList.endGroup()
  return displayList
}

describe('SvgRenderer 视觉结构回归', () => {
  it('与 Canvas 重放共享文本、几何和关键图像输出参数', () => {
    const image = document.createElement('img')
    image.src = 'data:image/png;base64,aGVsbG8='
    const displayList = createComplexDisplayList(image)
    const ctx = document.createElement('canvas').getContext('2d')!
    const fillText = vi.spyOn(ctx, 'fillText')
    const fillRect = vi.spyOn(ctx, 'fillRect')
    const strokeRect = vi.spyOn(ctx, 'strokeRect')
    const drawImage = vi.spyOn(ctx, 'drawImage')
    new CanvasRenderer().render(ctx, displayList)

    const svg = document.createElementNS(
      SVG_NAMESPACE,
      'svg'
    ) as SVGSVGElement
    new SvgRenderer().render(svg, displayList)

    expect(fillText).toHaveBeenCalledWith('Header / 页眉', 120, 135)
    expect(fillText).toHaveBeenCalledWith(
      'Table cell and controls',
      120,
      165
    )
    expect(fillRect).toHaveBeenCalledWith(100, 100, 300, 80)
    expect(strokeRect).toHaveBeenCalledWith(100, 100, 300, 80)
    expect(drawImage).toHaveBeenCalledWith(image, 450, 100, 120, 80)

    const texts = Array.from(svg.querySelectorAll('text'))
    expect(
      texts.map(text => ({
        value: text.textContent,
        x: text.getAttribute('x'),
        y: text.getAttribute('y'),
        fill: text.getAttribute('fill')
      }))
    ).toEqual([
      {
        value: 'Header / 页眉',
        x: '120',
        y: '135',
        fill: '#111111'
      },
      {
        value: 'Table cell and controls',
        x: '120',
        y: '165',
        fill: '#111111'
      }
    ])
    expect(texts[0].style.font).toBe('bold 18px Arial')
    expect(texts[0].getAttribute('dominant-baseline')).toBe('alphabetic')

    const rects = Array.from(svg.querySelectorAll('rect'))
    const geometry = rects
      .filter(
        rect =>
          rect.getAttribute('x') === '100' &&
          rect.getAttribute('y') === '100' &&
          rect.getAttribute('width') === '300' &&
          rect.getAttribute('height') === '80'
      )
      .map(rect => ({
        fill: rect.getAttribute('fill'),
        stroke: rect.getAttribute('stroke'),
        lineWidth: rect.getAttribute('stroke-width')
      }))
    expect(geometry).toEqual([
      { fill: '#1677ff', stroke: null, lineWidth: null },
      { fill: 'none', stroke: '#222222', lineWidth: '2' }
    ])

    const renderedImage = svg.querySelector('image')!
    expect({
      href: renderedImage.getAttribute('href'),
      x: renderedImage.getAttribute('x'),
      y: renderedImage.getAttribute('y'),
      width: renderedImage.getAttribute('width'),
      height: renderedImage.getAttribute('height')
    }).toEqual({
      href: image.src,
      x: '450',
      y: '100',
      width: '120',
      height: '80'
    })
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(
      'M 100 220 L 570 220'
    )
  })

  it('显式 selection 失效后绘制选区且不清空正文', async () => {
    const { container, editor, destroy } = createTestEditor({
      data: [{ value: 'selection' }],
      options: { backend: BackendType.SVG, pageMode: PageMode.CONTINUITY }
    })
    try {
      editor.command.executeSetRange(0, 5)
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      const page = container.querySelector('svg')!
      expect(page.textContent).toContain('selection')
      const selection = Array.from(page.querySelectorAll('rect')).find(
        rect => rect.getAttribute('fill') === '#AECBFA'
      )
      expect(selection).not.toBeUndefined()
      expect(Number(selection?.getAttribute('width'))).toBeGreaterThan(0)
    } finally {
      destroy()
    }
  })
})
