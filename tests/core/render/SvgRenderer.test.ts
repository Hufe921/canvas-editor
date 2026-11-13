import { afterEach, describe, expect, it } from 'vitest'
import { createBackend } from '@/editor/core/render/BackendFactory'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SvgBackend } from '@/editor/core/render/svg/SvgBackend'
import { SvgRenderer } from '@/editor/core/render/svg/SvgRenderer'
import { createTestEditor } from '../../factories/editor'
import {
  BackendType,
  EditorMode,
  PageMode
} from '@/editor/dataset/enum/Editor'
import { TraceType } from '@/editor/dataset/enum/Trace'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

function createDisplayList(text = 'stable') {
  const displayList = new DisplayList()
  displayList.beginGroup('page:0', 'page')
  displayList.beginGroup('page:0:layer:content', 'layer')
  displayList.beginGroup('row:0', 'row')
  displayList.fillStyle = '#000000'
  displayList.fillText(text, 10, 20)
  displayList.fillRect(1, 2, 3, 4)
  displayList.endGroup()
  displayList.endGroup()
  displayList.endGroup()
  return displayList
}

function createHost() {
  return document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement
}

function recordMutations(target: Node) {
  const observer = new MutationObserver(() => {})
  observer.observe(target, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
  })
  return () => {
    const records = observer.takeRecords()
    observer.disconnect()
    return records
  }
}

describe('SvgRenderer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('compile DisplayList 并将 SceneCompiler 根 group 挂载到 SVG', () => {
    const host = createHost()

    new SvgRenderer().render(host, createDisplayList())

    const root = host.firstElementChild
    const page = root?.firstElementChild
    const layer = page?.firstElementChild
    const row = layer?.firstElementChild
    expect(root?.tagName).toBe('g')
    expect(page?.tagName).toBe('g')
    expect(layer?.tagName).toBe('g')
    expect(row?.tagName).toBe('g')
    expect(row?.querySelector('text')?.textContent).toBe('stable')
    expect(row?.querySelector('rect')).not.toBeNull()
  })

  it('重复 render 保留根和未变子节点身份且没有冗余 DOM mutation', () => {
    const host = createHost()
    const renderer = new SvgRenderer()
    const displayList = createDisplayList()
    renderer.render(host, displayList)
    const root = host.firstElementChild
    const layer = host.querySelector('g g g')
    const text = host.querySelector('text')
    const rect = host.querySelector('rect')
    const getMutations = recordMutations(host)

    renderer.render(host, displayList)
    renderer.render(host, createDisplayList())

    expect(host.firstElementChild).toBe(root)
    expect(host.querySelector('g g g')).toBe(layer)
    expect(host.querySelector('text')).toBe(text)
    expect(host.querySelector('rect')).toBe(rect)
    expect(getMutations()).toEqual([])
  })

  it('变化文本只 patch 对应节点而不替换未变兄弟', () => {
    const host = createHost()
    const renderer = new SvgRenderer()
    renderer.render(host, createDisplayList('before'))
    const root = host.firstElementChild
    const text = host.querySelector('text')!
    const rect = host.querySelector('rect')
    const getMutations = recordMutations(host)

    renderer.render(host, createDisplayList('after'))

    expect(host.firstElementChild).toBe(root)
    expect(host.querySelector('text')).toBe(text)
    expect(host.querySelector('rect')).toBe(rect)
    expect(text.textContent).toBe('after')
    const childListMutations = getMutations().filter(
      record => record.type === 'childList'
    )
    expect(childListMutations.every(record => record.target === text)).toBe(
      true
    )
    expect(
      childListMutations.flatMap(record => [
        ...Array.from(record.addedNodes),
        ...Array.from(record.removedNodes)
      ]).every(node => node.nodeType !== Node.ELEMENT_NODE)
    ).toBe(true)
  })

  it('按 SVG host 隔离 clip 和 pattern ID，且重渲染保持稳定', () => {
    const renderer = new SvgRenderer()
    const firstHost = createHost()
    const secondHost = createHost()
    const displayList = new DisplayList()
    const image = document.createElement('canvas')
    image.width = 8
    image.height = 6
    displayList.beginGroup('page:0', 'page')
    displayList.save()
    displayList.beginPath()
    displayList.rect(0, 0, 10, 10)
    displayList.clip()
    displayList.fillStyle = displayList.createPattern(image, 'repeat', {
      key: 'watermark',
      revision: 1
    })
    displayList.fillRect(0, 0, 10, 10)
    displayList.restore()
    displayList.endGroup()

    renderer.render(firstHost, displayList)
    new SvgRenderer().render(secondHost, displayList)

    const firstIds = Array.from(firstHost.querySelectorAll('[id]')).map(
      element => element.id
    )
    const secondIds = Array.from(secondHost.querySelectorAll('[id]')).map(
      element => element.id
    )
    expect(firstIds).toHaveLength(2)
    expect(secondIds).toHaveLength(2)
    expect(firstIds).not.toEqual(secondIds)
    expect(firstHost.querySelector('rect')!.getAttribute('clip-path')).toBe(
      `url(#${firstHost.querySelector('clipPath')!.id})`
    )
    expect(firstHost.querySelector('rect')!.getAttribute('fill')).toBe(
      `url(#${firstHost.querySelector('pattern')!.id})`
    )
    expect(secondHost.querySelector('rect')!.getAttribute('clip-path')).toBe(
      `url(#${secondHost.querySelector('clipPath')!.id})`
    )
    expect(secondHost.querySelector('rect')!.getAttribute('fill')).toBe(
      `url(#${secondHost.querySelector('pattern')!.id})`
    )

    renderer.render(firstHost, displayList)

    expect(
      Array.from(firstHost.querySelectorAll('[id]')).map(element => element.id)
    ).toEqual(firstIds)
  })
})

describe('SvgBackend', () => {
  it('由工厂显式创建并渲染到 SVG 页面', () => {
    const pageContainer = document.createElement('div')
    const backend = createBackend(BackendType.SVG, pageContainer)

    expect(backend).toBeInstanceOf(SvgBackend)
    expect(backend.canvas).toBeNull()
    backend.create(0, 300, 400, 16, 1)
    backend.renderPage(0, createDisplayList('backend'))

    expect(backend.getPage(0)).toBeInstanceOf(SVGSVGElement)
    expect(backend.getPage(0).textContent).toContain('backend')
  })

  it('真实 Editor 使用 SVG 页面并显示正文文本', () => {
    const { container, destroy } = createTestEditor({
      data: [{ value: 'SVG editor smoke' }],
      options: { backend: BackendType.SVG, pageMode: PageMode.CONTINUITY }
    })

    const page = container.querySelector('.ce-page-container > svg')
    expect(page).toBeInstanceOf(SVGSVGElement)
    expect(page?.querySelector('text')?.textContent).toContain(
      'SVG editor smoke'
    )
    destroy()
  })

  it('TRACE 模式通过离屏测量绘制 DELETED 留痕', () => {
    const { container, destroy } = createTestEditor({
      data: [
        {
          value: 'deleted text',
          trace: [{ type: TraceType.DELETED }]
        }
      ],
      options: {
        backend: BackendType.SVG,
        mode: EditorMode.TRACE,
        pageMode: PageMode.CONTINUITY
      }
    })

    const page = container.querySelector('.ce-page-container > svg')
    expect(page?.querySelector('text')?.textContent).toContain('deleted text')
    expect(page?.querySelector('path')).not.toBeNull()
    destroy()
  })
})
