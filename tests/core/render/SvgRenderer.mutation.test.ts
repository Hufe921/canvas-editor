import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SceneCompiler } from '@/editor/core/render/svg/scene/SceneCompiler'
import type {
  SceneDefinition,
  SceneNode
} from '@/editor/core/render/svg/scene/SceneNode'
import { SvgRenderer } from '@/editor/core/render/svg/SvgRenderer'
import { ElementType } from '@/editor/dataset/enum/Element'
import {
  BackendType,
  EditorMode,
  PageMode
} from '@/editor/dataset/enum/Editor'
import type { IElement } from '@/editor/interface/Element'
import { createTestEditor } from '../../factories/editor'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const cleanups: (() => void)[] = []
let frameCallbacks: Map<number, FrameRequestCallback>
let frameId: number

function flushFrames() {
  const callbacks = Array.from(frameCallbacks.values())
  frameCallbacks.clear()
  callbacks.forEach(callback => callback(0))
}

function createSvgEditor(
  data: IElement[] | { header: IElement[]; main: IElement[]; footer: IElement[] },
  pageMode = PageMode.CONTINUITY
) {
  class VisibleIntersectionObserver {
    private callback: IntersectionObserverCallback

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }

    observe(target: Element) {
      this.callback(
        [{ target, isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    }

    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
  const context = createTestEditor({
    data,
    options: {
      backend: BackendType.SVG,
      pageMode,
      lineBreak: { disabled: true }
    }
  })
  cleanups.push(context.destroy)
  return context
}

function getPageScene(container: HTMLElement, pageNo = 0) {
  const page = container.querySelectorAll('svg')[pageNo]
  return page.firstElementChild!.firstElementChild!
}

function getLayer(container: HTMLElement, layer: string, pageNo = 0) {
  const layers = Array.from(getPageScene(container, pageNo).children)
  const layerIndex = [
    'background',
    'control-highlight',
    'content',
    'selection',
    'foreground',
    'search',
    'decoration',
    'graffiti',
    'watermark'
  ].indexOf(layer)
  expect(layerIndex).toBeGreaterThanOrEqual(0)
  return layers[layerIndex]
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

function expectMutationsWithin(records: MutationRecord[], target: Node) {
  expect(records.length).toBeGreaterThan(0)
  expect(
    records.every(
      record => record.target === target || target.contains(record.target)
    )
  ).toBe(true)
}

function tableCell(value: IElement[], id?: string) {
  return {
    id,
    colspan: 1,
    rowspan: 1,
    value: [...value, { value: '\n' }]
  }
}

function createTable(id = 'mutation-table'): IElement {
  return {
    id,
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 300 }],
    trList: [
      {
        height: 40,
        minHeight: 40,
        tdList: [tableCell([{ value: 'table-text' }], `${id}-td`)]
      }
    ]
  }
}

function createPagedTable(): IElement {
  return {
    id: 'paged-table',
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 400 }],
    trList: Array.from({ length: 20 }, (_, rowIndex) => ({
      height: 100,
      minHeight: 100,
      pagingRepeat: rowIndex === 0,
      tdList: [
        tableCell(
          [{ value: rowIndex === 0 ? 'repeat-heading' : `body-${rowIndex}` }],
          `paged-table-td-${rowIndex}`
        )
      ]
    }))
  }
}

function createOrderedDisplayList(order: string[]) {
  const displayList = new DisplayList()
  displayList.beginGroup('page:0', 'page')
  displayList.beginGroup('page:0:layer:content', 'layer')
  for (const key of order) {
    displayList.beginGroup(`row:${key}`, 'row')
    displayList.fillText(key, 10, 20)
    displayList.endGroup()
  }
  displayList.endGroup()
  displayList.endGroup()
  return displayList
}

type SceneElement = SceneNode | SceneDefinition

function findDuplicateKeys(scene: SceneElement, path = 'root'): string[] {
  const seen = new Set<string>()
  const duplicates: string[] = []
  for (const child of scene.children) {
    if (seen.has(child.key)) duplicates.push(`${path}:${child.key}`)
    seen.add(child.key)
    duplicates.push(...findDuplicateKeys(child, `${path}/${child.key}`))
  }
  const definitionKeys = new Set<string>()
  const definitions = 'defs' in scene ? scene.defs || [] : []
  for (const definition of definitions) {
    if (definitionKeys.has(definition.key)) {
      duplicates.push(`${path}:defs:${definition.key}`)
    }
    definitionKeys.add(definition.key)
    duplicates.push(
      ...findDuplicateKeys(definition, `${path}/defs/${definition.key}`)
    )
  }
  return duplicates
}

function flattenScene(scene: SceneElement): SceneElement[] {
  const definitions = 'defs' in scene ? scene.defs || [] : []
  return [
    scene,
    ...scene.children.flatMap(child => flattenScene(child)),
    ...definitions.flatMap(definition => flattenScene(definition))
  ]
}

beforeEach(() => {
  frameCallbacks = new Map()
  frameId = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId
    frameCallbacks.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frameCallbacks.delete(id)
  })
})

afterEach(() => {
  while (cleanups.length) cleanups.pop()!()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SvgRenderer mutation 性能与结构清理', () => {
  it('100 次 selection 更新保留全部正文节点身份且 content 零 mutation', () => {
    const { container, editor } = createSvgEditor([
      { value: 'selection' },
      { value: '\n' },
      createTable(),
      { value: '\n' }
    ])
    const content = getLayer(container, 'content')
    const selection = getLayer(container, 'selection')
    const contentNodes = Array.from(content.querySelectorAll('*'))
    const getContentMutations = recordMutations(content)
    const getSelectionMutations = recordMutations(selection)

    for (let index = 0; index < 100; index++) {
      const start = index % 8
      editor.command.executeSetRange(start, start + 2)
      flushFrames()
    }

    expect(Array.from(content.querySelectorAll('*'))).toEqual(contentNodes)
    expect(getContentMutations()).toEqual([])
    expect(getSelectionMutations().length).toBeGreaterThan(0)
  })

  it('单字符编辑只 patch 影响 text 所在 row 且不重建 page', () => {
    const { container, editor } = createSvgEditor([
      { value: 'alpha' },
      { value: '\n' },
      { value: 'beta' },
      { value: '\n' },
      { value: 'gamma' },
      { value: '\n' }
    ])
    const page = container.querySelector('svg')!
    const pageScene = getPageScene(container)
    const content = getLayer(container, 'content')
    const texts = Array.from(content.querySelectorAll('text'))
    const changedText = texts.find(text => text.textContent?.includes('beta'))!
    expect(changedText).toBeDefined()
    const changedRow = changedText.parentElement!
    const unchangedRows = texts
      .filter(text => text !== changedText)
      .map(text => text.parentElement!)

    editor.command.executeSetRange(8, 8)
    flushFrames()
    const getMutations = recordMutations(page)
    editor.command.executeInsertElementList([{ value: 'X' }])
    flushFrames()

    expect(container.querySelector('svg')).toBe(page)
    expect(getPageScene(container)).toBe(pageScene)
    expect(content.querySelectorAll('text')[1]).toBe(changedText)
    expect(changedText.parentElement).toBe(changedRow)
    expect(changedText.textContent).toContain('beXta')
    const mutations = getMutations()
    expect(mutations.length).toBeGreaterThan(0)
    expect(
      mutations
        .filter(record => !changedRow.contains(record.target))
        .map(record => ({
          type: record.type,
          attribute: record.attributeName,
          target: (record.target as Element).outerHTML?.slice(0, 300),
          added: Array.from(record.addedNodes).map(node => node.textContent),
          removed: Array.from(record.removedNodes).map(node => node.textContent)
        }))
    ).toEqual([])
    for (const row of unchangedRows) {
      expect(mutations.every(record => !row.contains(record.target))).toBe(true)
    }
  })

  it('search 导航只 mutation search layer', () => {
    const { container, editor } = createSvgEditor([
      { value: 'one two one' },
      { value: '\n' }
    ])
    const content = getLayer(container, 'content')
    const search = getLayer(container, 'search')
    const contentNodes = Array.from(content.querySelectorAll('*'))
    editor.command.executeSearch('one')
    flushFrames()
    editor.command.executeSearchNavigateNext()
    flushFrames()
    const getPageMutations = recordMutations(container.querySelector('svg')!)

    editor.command.executeSearchNavigateNext()
    flushFrames()

    expectMutationsWithin(getPageMutations(), search)
    expect(Array.from(content.querySelectorAll('*'))).toEqual(contentNodes)
  })

  it('graffiti 只 mutation graffiti layer', () => {
    const { container, editor } = createSvgEditor([
      { value: 'graffiti' },
      { value: '\n' }
    ])
    const page = container.querySelector('svg')!
    const content = getLayer(container, 'content')
    const graffiti = getLayer(container, 'graffiti')
    const contentNodes = Array.from(content.querySelectorAll('*'))
    editor.command.executeMode(EditorMode.GRAFFITI)
    flushFrames()
    page.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 })
    )
    flushFrames()
    page.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 20, clientY: 20 })
    )
    flushFrames()
    const getPageMutations = recordMutations(page)

    page.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 30, clientY: 40 })
    )
    flushFrames()

    expectMutationsWithin(getPageMutations(), graffiti)
    expect(Array.from(content.querySelectorAll('*'))).toEqual(contentNodes)
  })

  it('图片资源加载只新增自身 consumer 且不 mutation 其他正文节点', () => {
    const images: HTMLImageElement[] = []
    vi.stubGlobal(
      'Image',
      vi.fn(function () {
        const image = document.createElement('img')
        images.push(image)
        return image
      })
    )
    const { container } = createSvgEditor([
      { value: 'before-image' },
      { value: '\n' },
      {
        type: ElementType.IMAGE,
        value: 'https://example.com/image.png',
        width: 100,
        height: 50
      },
      { value: '\n' }
    ])
    expect(images).toHaveLength(1)
    const page = container.querySelector('svg')!
    const content = getLayer(container, 'content')
    const stableText = Array.from(content.querySelectorAll('text')).find(
      text => text.textContent === 'before-image'
    )!
    const getPageMutations = recordMutations(page)

    images[0].onload!(new Event('load'))
    flushFrames()

    const image = content.querySelector('image')!
    expect(image.getAttribute('href')).toBe('https://example.com/image.png')
    const mutations = getPageMutations()
    expectMutationsWithin(mutations, content)
    expect(
      mutations.every(
        record => record.target === image || record.target === image.parentElement
      )
    ).toBe(true)
    expect(
      mutations
        .flatMap(record => Array.from(record.addedNodes))
        .filter(node => node.nodeType === Node.ELEMENT_NODE)
    ).toEqual([image])
    expect(
      Array.from(content.querySelectorAll('text')).find(
        text => text.textContent === 'before-image'
      )
    ).toBe(stableText)
  })

  it('create/delete/reorder 不使用 innerHTML 且保留未变节点', () => {
    const host = document.createElementNS(
      SVG_NAMESPACE,
      'svg'
    ) as SVGSVGElement
    const renderer = new SvgRenderer()
    renderer.render(host, createOrderedDisplayList(['a', 'b', 'c']))
    const rows = new Map(
      Array.from(host.querySelectorAll('g g g > g')).map(row => [
        row.textContent,
        row
      ])
    )
    const innerHTML = vi.spyOn(Element.prototype, 'innerHTML', 'set')

    renderer.render(host, createOrderedDisplayList(['c', 'a', 'd']))

    expect(innerHTML).not.toHaveBeenCalled()
    expect(
      Array.from(host.querySelectorAll('g g g > g')).map(
        row => row.textContent
      )
    ).toEqual(['c', 'a', 'd'])
    expect(host.querySelector('g g g > g')).toBe(rows.get('c'))
    expect(host.contains(rows.get('b')!)).toBe(false)
    expect(
      Array.from(host.querySelectorAll('g g g > g')).find(
        row => row.textContent === 'a'
      )
    ).toBe(rows.get('a'))
  })

  it('等价 scene 输入产生零 DOM mutation', () => {
    const host = document.createElementNS(
      SVG_NAMESPACE,
      'svg'
    ) as SVGSVGElement
    const renderer = new SvgRenderer()
    renderer.render(host, createOrderedDisplayList(['a', 'b']))
    const nodes = Array.from(host.querySelectorAll('*'))
    const getMutations = recordMutations(host)

    renderer.render(host, createOrderedDisplayList(['a', 'b']))

    expect(getMutations()).toEqual([])
    expect(Array.from(host.querySelectorAll('*'))).toEqual(nodes)
  })

  it('header/footer/table fragment/repeat header 的兄弟 key 无冲突', () => {
    const compileSpy = vi.spyOn(SceneCompiler.prototype, 'compile')
    const { container } = createSvgEditor(
      {
        header: [{ value: 'header-text' }],
        main: [createPagedTable()],
        footer: [{ value: 'footer-text' }]
      },
      PageMode.PAGING
    )
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(1)
    const scenes = compileSpy.mock.results.map(result => result.value as SceneNode)
    const nodes = scenes.flatMap(scene => flattenScene(scene))
    const keys = nodes.map(node => node.key)

    expect(scenes.flatMap(scene => findDuplicateKeys(scene))).toEqual([])
    expect(nodes.map(node => node.kind)).toContain('table-fragment')
    expect(nodes.map(node => node.kind)).toContain('repeat-header')
    expect(keys.some(key => key.startsWith('row:zone:0:header:'))).toBe(true)
    expect(keys.some(key => key.startsWith('row:zone:0:footer:'))).toBe(true)
    expect(keys.some(key => key.startsWith('row:zone:1:header:'))).toBe(true)
    expect(keys.some(key => key.startsWith('row:zone:1:footer:'))).toBe(true)
  })
})
