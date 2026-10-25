import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import {
  BackendType,
  EditorMode,
  PageMode
} from '@/editor/dataset/enum/Editor'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import type { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SvgRenderer } from '@/editor/core/render/svg/SvgRenderer'
import type { IElement } from '@/editor/interface/Element'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

const cleanups: (() => void)[] = []
let frameCallbacks: Map<number, FrameRequestCallback>
let frameId: number

function createSvgDraw(main: IElement[]) {
  const container = document.createElement('div')
  document.body.append(container)
  const options = mergeOption({
    backend: BackendType.SVG,
    pageMode: PageMode.CONTINUITY,
    lineBreak: { disabled: true }
  })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    options,
    {
      header: [{ value: '\n' }],
      main,
      footer: [{ value: '\n' }]
    },
    new Listener(),
    new EventBus(),
    new Override()
  )
  cleanups.push(() => {
    draw.destroy()
    container.remove()
  })
  return draw
}

function flushFrames() {
  const callbacks = Array.from(frameCallbacks.values())
  frameCallbacks.clear()
  callbacks.forEach(callback => callback(0))
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

function renderSelection(draw: Draw) {
  draw.render({
    isCompute: false,
    isLazy: false,
    isSetCursor: false,
    isSubmitHistory: false
  })
  flushFrames()
}

function getLayers(draw: Draw) {
  return draw.getPageList()[0].firstElementChild!.firstElementChild!.children
}

function render(draw: Draw, isCompute = false) {
  draw.render({
    isCompute,
    isLazy: false,
    isSetCursor: false,
    isSubmitHistory: false
  })
  flushFrames()
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

describe('SvgRenderer 交互图层', () => {
  it('反复更新普通选区时保留正文和表格节点且 content 零 mutation', () => {
    const draw = createSvgDraw([
      { value: 'selection' },
      { value: '\n' },
      {
        id: 'selection-table',
        type: ElementType.TABLE,
        value: '',
        colgroup: [{ width: 300 }],
        trList: [
          {
            height: 40,
            minHeight: 40,
            tdList: [
              {
                colspan: 1,
                rowspan: 1,
                value: [{ value: 'table-text' }, { value: '\n' }]
              }
            ]
          }
        ]
      },
      { value: '\n' }
    ])
    const page = draw.getPageList()[0]
    const pageScene = page.firstElementChild!.firstElementChild!
    expect(pageScene.children).toHaveLength(9)
    const content = pageScene.children[2]
    const selection = pageScene.children[3]
    const contentNodes = Array.from(
      content.querySelectorAll('text, path, rect, image')
    )
    const getContentMutations = recordMutations(content)

    for (let index = 0; index < 5; index++) {
      draw.getRange().setRange(index, index + 2)
      renderSelection(draw)
    }

    expect(selection.querySelectorAll('rect').length).toBeGreaterThan(0)
    expect(
      Array.from(content.querySelectorAll('text, path, rect, image'))
    ).toEqual(contentNodes)
    expect(getContentMutations()).toEqual([])
  })

  it('表格选区在 selection layer 更新且不修改 content', () => {
    const draw = createSvgDraw([
      {
        id: 'table-selection',
        type: ElementType.TABLE,
        value: '',
        colgroup: [{ width: 150 }, { width: 150 }],
        trList: [
          {
            height: 40,
            minHeight: 40,
            tdList: [
              {
                id: 'td-a',
                colspan: 1,
                rowspan: 1,
                value: [{ value: 'a' }, { value: '\n' }]
              },
              {
                id: 'td-b',
                colspan: 1,
                rowspan: 1,
                value: [{ value: 'b' }, { value: '\n' }]
              }
            ]
          }
        ]
      },
      { value: '\n' }
    ])
    const layers = getLayers(draw)
    const content = layers[2]
    const selection = layers[3]
    const contentNodes = Array.from(content.querySelectorAll('text, path'))
    const tableIndex = draw
      .getOriginalElementList()
      .findIndex(element => element.type === ElementType.TABLE)
    draw.getPosition().setPositionContext({
      isTable: true,
      index: tableIndex,
      tableId: 'table-selection',
      trIndex: 0,
      tdIndex: 0,
      tdId: 'td-a'
    })
    draw.getRange().setRange(0, 0, 'table-selection', 0, 1, 0, 0)
    const getContentMutations = recordMutations(content)

    renderSelection(draw)

    expect(selection.querySelectorAll('rect').length).toBeGreaterThan(0)
    expect(Array.from(content.querySelectorAll('text, path'))).toEqual(
      contentNodes
    )
    expect(getContentMutations()).toEqual([])
  })

  it('搜索导航只 patch search layer', () => {
    const draw = createSvgDraw([{ value: 'one two one' }, { value: '\n' }])
    const search = draw.getSearch()
    search.setSearchKeyword('one')
    render(draw, true)
    search.searchNavigateNext()
    renderSelection(draw)
    const layers = getLayers(draw)
    const searchLayer = layers[5]
    const beforeFills = Array.from(searchLayer.querySelectorAll('rect')).map(
      rect => rect.getAttribute('fill')
    )
    const getPageMutations = recordMutations(layers[0].parentElement!)

    search.searchNavigateNext()
    renderSelection(draw)

    const afterFills = Array.from(searchLayer.querySelectorAll('rect')).map(
      rect => rect.getAttribute('fill')
    )
    expect(afterFills).not.toEqual(beforeFills)
    expect(
      getPageMutations().every(
        record =>
          record.target === searchLayer || searchLayer.contains(record.target)
      )
    ).toBe(true)
  })

  it('控件关键词高亮只 patch control-highlight layer', () => {
    const draw = createSvgDraw([
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.TEXT,
          conceptId: 'highlight-concept',
          value: [{ value: 'needle' }],
          prefix: '',
          postfix: ''
        }
      },
      { value: '\n' }
    ])
    draw.getControl().setHighlightList([
      {
        conceptId: 'highlight-concept',
        ruleList: [{ keyword: 'needle', backgroundColor: '#ff0000' }]
      }
    ])
    render(draw, true)
    const layers = getLayers(draw)
    const controlLayer = layers[1]
    expect(controlLayer.querySelectorAll('rect').length).toBeGreaterThan(0)
    const getPageMutations = recordMutations(layers[0].parentElement!)

    draw.getControl().setHighlightList([])
    render(draw, true)

    expect(controlLayer.querySelectorAll('rect')).toHaveLength(0)
    expect(
      getPageMutations().every(
        record =>
          record.target === controlLayer || controlLayer.contains(record.target)
      )
    ).toBe(true)
  })

  it('涂鸦只 patch graffiti layer', () => {
    const draw = createSvgDraw([{ value: 'graffiti' }, { value: '\n' }])
    draw.setMode(EditorMode.GRAFFITI)
    draw.getGraffiti().getValue().push({
      pageNo: 0,
      strokes: [
        {
          lineColor: '#000000',
          lineWidth: 2,
          points: [10, 10, 20, 20]
        }
      ]
    })
    renderSelection(draw)
    const layers = getLayers(draw)
    const graffitiLayer = layers[7]
    const path = graffitiLayer.querySelector('path')!
    const getPageMutations = recordMutations(layers[0].parentElement!)

    draw.getGraffiti().getValue()[0].strokes[0].points.push(30, 40)
    renderSelection(draw)

    expect(path.getAttribute('d')).toContain('30 40')
    expect(
      getPageMutations().every(
        record =>
          record.target === graffitiLayer || graffitiLayer.contains(record.target)
      )
    ).toBe(true)
  })

  it('高频 SVG render 每帧只 patch 一次并保留最终选区', () => {
    const renderSpy = vi.spyOn(SvgRenderer.prototype, 'render')
    const draw = createSvgDraw([{ value: 'abcdef' }, { value: '\n' }])
    expect(renderSpy).toHaveBeenCalledTimes(1)
    const selection = getLayers(draw)[3]

    draw.getRange().setRange(0, 1)
    draw.render({ isCompute: false, isSetCursor: false })
    draw.getRange().setRange(2, 5)
    draw.render({ isCompute: false, isSetCursor: false })

    expect(renderSpy).toHaveBeenCalledTimes(1)
    expect(frameCallbacks.size).toBe(1)
    flushFrames()
    expect(renderSpy).toHaveBeenCalledTimes(2)
    const displayList = renderSpy.mock.calls[1][1] as DisplayList
    const finalFillRectArgs = displayList
      .getOperations()
      .reduce<unknown[] | undefined>(
        (latest, operation) =>
          operation.type === 'fillRect' ? operation.args : latest,
        undefined
      )
    expect(selection.querySelector('rect')?.getAttribute('x')).toBe(
      String(finalFillRectArgs?.[0])
    )
  })

  it('destroy 取消待执行的 SVG frame', () => {
    const renderSpy = vi.spyOn(SvgRenderer.prototype, 'render')
    const draw = createSvgDraw([{ value: 'destroy' }, { value: '\n' }])
    draw.getRange().setRange(0, 2)
    draw.render({ isCompute: false, isSetCursor: false })
    expect(frameCallbacks.size).toBe(1)

    draw.destroy()
    flushFrames()

    expect(frameCallbacks.size).toBe(0)
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })
})
