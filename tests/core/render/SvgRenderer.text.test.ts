import { afterEach, describe, expect, it } from 'vitest'
import { ElementType } from '@/editor/dataset/enum/Element'
import { BackendType, PageMode } from '@/editor/dataset/enum/Editor'
import { ListStyle, ListType } from '@/editor/dataset/enum/List'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SvgRenderer } from '@/editor/core/render/svg/SvgRenderer'
import { createTestEditor } from '../../factories/editor'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const cleanups: (() => void)[] = []

function createHost() {
  return document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement
}

function render(displayList: DisplayList) {
  const host = createHost()
  new SvgRenderer().render(host, displayList)
  return host
}

function createSvgEditor(data: any, options: Record<string, unknown> = {}) {
  const context = createTestEditor({
    data,
    options: {
      backend: BackendType.SVG,
      pageMode: PageMode.CONTINUITY,
      lineBreak: { disabled: true },
      ...options
    }
  })
  cleanups.push(context.destroy)
  return context.container.querySelector('svg')!
}

afterEach(() => {
  while (cleanups.length) cleanups.pop()!()
})

describe('SvgRenderer 文本语义', () => {
  it('映射字体、颜色、基线和 text-anchor', () => {
    const displayList = new DisplayList()
    displayList.font = 'italic bold 18px serif'
    displayList.fillStyle = '#123456'
    displayList.textAlign = 'center'
    displayList.textBaseline = 'middle'
    displayList.fillText('styled', 30, 40)

    const text = render(displayList).querySelector('text')!

    expect(text.style.font).toBe('italic bold 18px serif')
    expect(text.getAttribute('fill')).toBe('#123456')
    expect(text.getAttribute('dominant-baseline')).toBe('middle')
    expect(text.getAttribute('text-anchor')).toBe('middle')
    expect(text.getAttribute('xml:space')).toBe('preserve')
  })

  it('保留 Canvas 与 SVG 共用的 alphabetic 基线坐标', () => {
    const displayList = new DisplayList()
    displayList.fillText('baseline', 30, 40)

    const text = render(displayList).querySelector('text')!

    expect(text.getAttribute('dominant-baseline')).toBe('alphabetic')
    expect(text.getAttribute('y')).toBe('40')
    expect(text.getAttribute('transform')).toBeNull()
    expect(text.getAttribute('data-baseline-offset')).toBeNull()
  })

  it('使用行内来源 key 保留文本节点而不是按文本或序号重建', () => {
    const host = createHost()
    const renderer = new SvgRenderer()
    const createList = (withPrecedingRun: boolean) => {
      const displayList = new DisplayList()
      displayList.beginGroup('row:0', 'row')
      if (withPrecedingRun) {
        displayList.fillTextWithSource('inserted', 0, 10, {
          key: 'element:0'
        })
      }
      displayList.fillTextWithSource('same', 20, 10, { key: 'element:1' })
      displayList.endGroup()
      return displayList
    }
    renderer.render(host, createList(false))
    const original = host.querySelector('text')!

    renderer.render(host, createList(true))

    const texts = host.querySelectorAll('text')
    expect(texts).toHaveLength(2)
    expect(texts[0].textContent).toBe('inserted')
    expect(texts[1]).toBe(original)
    expect(texts[1].textContent).toBe('same')
  })

  it('真实文档保留上下标、列表、label 和 separator', () => {
    const svg = createSvgEditor([
      { value: 'x' },
      { type: ElementType.SUPERSCRIPT, value: '2', actualSize: 10 },
      { type: ElementType.SUBSCRIPT, value: 'n', actualSize: 10 },
      { value: '\n', listId: 'list', listType: ListType.OL },
      { value: 'item', listId: 'list', listType: ListType.OL },
      {
        value: '\n',
        listId: 'list',
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      },
      {
        type: ElementType.LABEL,
        value: 'tag',
        label: { backgroundColor: '#eeeeee', color: '#ff0000' }
      },
      { value: '\n' },
      {
        type: ElementType.SEPARATOR,
        value: '',
        width: 200,
        color: '#00ff00',
        dashArray: [4, 2],
        lineWidth: 2
      },
      { value: '\n' }
    ])

    const texts = Array.from(svg.querySelectorAll('text'))
    expect(texts.some(text => text.textContent === '1.')).toBe(true)
    expect(texts.some(text => text.textContent === 'tag')).toBe(true)
    expect(texts.find(text => text.textContent === '2')?.getAttribute('y')).not.toBe(
      texts.find(text => text.textContent === 'n')?.getAttribute('y')
    )
    expect(
      Array.from(svg.querySelectorAll('path')).some(
        path =>
          path.getAttribute('stroke') === '#00ff00' &&
          path.getAttribute('stroke-dasharray') === '4 2'
      )
    ).toBe(true)
  })

  it('真实文档渲染 underline、strikeout 和 highlight', () => {
    const svg = createSvgEditor([
      {
        value: 'decorated',
        underline: true,
        strikeout: true,
        highlight: '#ffff00'
      },
      { value: '\n' }
    ])

    expect(
      Array.from(svg.querySelectorAll('rect')).some(
        rect => rect.getAttribute('fill') === '#ffff00'
      )
    ).toBe(true)
    expect(svg.querySelectorAll('path[stroke]').length).toBeGreaterThanOrEqual(2)
  })
})
