import { Draw } from '@/editor/core/draw/Draw'
import { LaTexParticle } from '@/editor/core/draw/particle/latex/LaTexParticle'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { getLayoutFlowHeight } from '@/editor/core/text-engine/layout/layoutProtocol'
import { ZERO } from '@/editor/dataset/constant/Common'
import { BlockType } from '@/editor/dataset/enum/Block'
import { ImageDisplay } from '@/editor/dataset/enum/Common'
import { PaperDirection } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TitleLevel } from '@/editor/dataset/enum/Title'
import type { IElement } from '@/editor/interface/Element'
import type { BlockBox, LayoutNode, TextLine } from '@/editor/interface/Layout'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const font = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
const svg =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="red"/></svg>'
  )
const draws: Draw[] = []
afterEach(() => {
  draws.splice(0).forEach(draw => draw.destroy())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
async function setup(main: IElement[], scale = 1) {
  // jsdom omits the browser DOMTokenList on iframe.sandbox.
  const create = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(
    (tag: string, options?: ElementCreationOptions) => {
      const element = create(tag, options)
      if (tag === 'iframe')
        Object.defineProperty(element, 'sandbox', {
          value: {
            add: (...tokens: string[]) =>
              element.setAttribute('sandbox', tokens.join(' '))
          }
        })
      return element
    }
  )
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data: font }],
    scale,
    width: 400,
    height: 1800,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    imgCaption: { font: 'Arabic', size: 12, top: 4 }
  })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const container = document.createElement('div')
  document.body.append(container)
  const draw = new Draw(
    container,
    options,
    { main, header: [{ value: ZERO }], footer: [{ value: ZERO }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  await draw.ready
  draw.render({ isLazy: false, isSubmitHistory: false, isSetCursor: false })
  return draw
}
function layout(draw: Draw) {
  const nodes: LayoutNode[] = []
  const rows = draw.computeRowList({
    elementList: draw.getOriginalMainElementList(),
    innerWidth: 360 * draw.getOptions().scale,
    nativeNodes: nodes
  })
  return { nodes, rows }
}
function block(): IElement {
  return {
    type: ElementType.BLOCK,
    value: '',
    width: 600,
    height: 70,
    block: { type: BlockType.IFRAME, iframeBlock: { srcdoc: '<p>block</p>' } }
  }
}
function image(extra: Partial<IElement> = {}): IElement {
  return {
    type: ElementType.IMAGE,
    value: svg,
    width: 40,
    height: 20,
    imgDisplay: ImageDisplay.INLINE,
    ...extra
  }
}

describe('T13 native object integration', () => {
  it('keeps text and objects inline with an image bottom aligned to the HB baseline', async () => {
    const object = image()
    const draw = await setup(
      [{ value: 'Hello' }, object, { value: 'after' }],
      2
    )
    const row = draw
      .getLayoutRowList()
      .find(r => r.elementList.includes(object))!
    expect(row.nativeLine).toBeTruthy()
    const index = draw.getOriginalMainElementList().indexOf(object)
    const pos = draw.getPosition().getOriginalMainPositionList()[index]
    expect(pos.ascent + pos.metrics.height).toBeCloseTo(row.ascent)
    const line = layout(draw).nodes.find(
      n => n.kind === 'textLine' && n.inlines.length
    ) as TextLine
    expect(line.inlines[0].kind).toBe('inlineObject')
    expect(line.inlines[0].rect.y + 20).toBeCloseTo(line.rect.y + line.baseline)
  })

  it('fits image and formula sizes to the actual cell container without scaling twice', async () => {
    const object = image({ width: 600, height: 300 })
    const formula: IElement = {
      type: ElementType.LATEX,
      value: 'x^2',
      width: 400,
      height: 100,
      laTexSVG: svg
    }
    const table: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 180 }],
      trList: [
        {
          height: 42,
          tdList: [
            {
              colspan: 1,
              rowspan: 1,
              value: [object, { value: '\n' }, formula]
            }
          ]
        }
      ]
    }
    const draw = await setup([table], 2)
    const available =
      180 -
      draw.getOptions().table.tdPadding[1] -
      draw.getOptions().table.tdPadding[3]
    expect(object.width).toBeCloseTo(available)
    expect(object.height).toBeCloseTo(available / 2)
    expect(formula.width).toBeCloseTo(available)
    expect(formula.height).toBeCloseTo(available / 4)
    layout(draw)
    expect(object.width).toBeCloseTo(available)
  })

  it('reserves caption space using the same real-font box as its painter', async () => {
    const object = image({
      imgCaption: { value: 'مرحبا caption', top: 7, font: 'Arabic', size: 14 }
    })
    const draw = await setup([object, { value: '\n' }, { value: 'after' }])
    const line = layout(draw).nodes.find(
      n => n.kind === 'textLine' && n.inlines.length
    ) as TextLine
    const inline = line.inlines[0]
    const caption = draw
      .getLayoutHostAdapter()
      .layoutCaption(object, object.imgCaption!.value)
    expect(inline.kind === 'inlineObject' && inline.descent).toBeCloseTo(
      caption.lines[0].height + 7
    )
    expect(line.contentHeight - line.baseline).toBeGreaterThanOrEqual(
      caption.lines[0].height + 7
    )
    expect(object.height).toBe(20)
  })

  it('builds typed block/float/break/separator nodes and never calls the legacy loop', async () => {
    const floating = image({
      imgDisplay: ImageDisplay.FLOAT_TOP,
      width: 500,
      imgFloatPosition: { x: 20, y: 30, pageNo: 0 }
    })
    const draw = await setup([
      block(),
      { value: '\n' },
      floating,
      { type: ElementType.SEPARATOR, value: '', lineWidth: 3 },
      {
        type: ElementType.PAGE_BREAK,
        value: '',
        paperDirection: PaperDirection.HORIZONTAL
      },
      { value: 'after' }
    ])
    const result = layout(draw)
    expect(
      result.nodes.some(n => n.kind === 'block' && n.blockType === 'iframe')
    ).toBe(true)
    const float = result.nodes.find(
      n => n.kind === 'block' && n.blockType === 'float'
    )!
    expect(float.rect.width).toBe(500)
    expect(getLayoutFlowHeight(float)).toBe(0)
    expect(
      result.nodes.some(
        n =>
          n.kind === 'break' && n.paperDirection === PaperDirection.HORIZONTAL
      )
    ).toBe(true)
    const ownRow = result.rows.find(r =>
      r.elementList.some(e => e.type === ElementType.BLOCK)
    )!
    expect(ownRow.nativeLine).toBeUndefined()
    expect(ownRow.width).toBe(360)
  })

  it('reassembles Area boxes and counts their top gap once, including inside cells', async () => {
    const area = { top: 19, backgroundColor: '#ff0000' }
    const draw = await setup(
      [
        {
          type: ElementType.AREA,
          areaId: 'area-a',
          value: '',
          area,
          valueList: [{ value: 'first' }, { value: '\n' }, { value: 'second' }]
        },
        { value: '\n' },
        { value: 'tail' }
      ],
      2
    )
    const { nodes, rows } = layout(draw)
    const group = nodes.find(
      n => n.kind === 'block' && n.blockType === 'area'
    ) as BlockBox
    expect(group.areaId).toBe('area-a')
    expect(group.backgroundColor).toBe('#ff0000')
    expect(group.spacingBefore).toBe(19)
    expect(rows.filter(r => (r.offsetY || 0) >= 38)).toHaveLength(1)
    expect(getLayoutFlowHeight(group)).toBeCloseTo(group.rect.height + 19)
    expect(group.children.every(n => n.kind === 'textLine')).toBe(true)
  })

  it('preserves nested Area identity and applies only its own top gap inside a cell', async () => {
    const table: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 180 }],
      trList: [
        {
          height: 42,
          tdList: [
            {
              colspan: 1,
              rowspan: 1,
              value: [
                {
                  type: ElementType.AREA,
                  value: '',
                  areaId: 'inner',
                  area: { top: 7 },
                  valueList: [{ value: 'inside' }]
                }
              ]
            }
          ]
        }
      ]
    }
    const draw = await setup([
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'outer',
        area: { top: 19 },
        valueList: [table]
      }
    ])
    const group = layout(draw).nodes.find(
      n => n.kind === 'block' && n.areaId === 'outer'
    ) as BlockBox
    const nativeTable = group.children.find(n => n.kind === 'tableFragment')!
    if (nativeTable.kind !== 'tableFragment') throw new Error('Expected table')
    const inner = nativeTable.cells[0].children.find(
      n => n.kind === 'block' && n.areaId === 'inner'
    ) as BlockBox
    expect(inner).toBeTruthy()
    expect(inner.spacingBefore).toBe(7)
    const td = table.trList![0].tdList[0]
    expect(td.rowList!.filter(row => row.offsetY === 7)).toHaveLength(1)
    expect(td.rowList!.some(row => row.offsetY === 19)).toBe(false)
    expect(td.value.some(el => el.areaId === 'inner')).toBe(true)
  })

  it('collapses hidden empty Areas and removes hidden block DOM, then restores them', async () => {
    const object = block()
    const draw = await setup([
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'hidden',
        area: { hide: true, top: 50 },
        valueList: [{ value: ZERO }]
      },
      object
    ])
    const group = layout(draw).nodes.find(
      n => n.kind === 'block' && n.blockType === 'area'
    )!
    expect(group.hidden).toBe(true)
    expect(getLayoutFlowHeight(group)).toBe(0)
    expect(draw.getContainer().querySelectorAll('iframe')).toHaveLength(1)
    object.hide = true
    draw.render({ isLazy: false, isSetCursor: false })
    expect(draw.getContainer().querySelectorAll('iframe')).toHaveLength(0)
    object.hide = false
    draw.render({ isLazy: false, isSetCursor: false })
    expect(draw.getContainer().querySelectorAll('iframe')).toHaveLength(1)
  })

  it('retains formula SVG conversion and stable insertion anchors around objects', async () => {
    const converted = LaTexParticle.convertLaTextToSVG('x^2 + y^2')
    expect(atob(converted.svg.split(',')[1])).toContain('<svg')
    const object = block()
    const draw = await setup([{ value: ZERO }, object, { value: '\n' }])
    const list = draw.getOriginalMainElementList()
    const index = list.indexOf(object)
    draw.spliceElementList(list, index, 0, [{ value: 'before' }])
    draw.spliceElementList(list, list.indexOf(object) + 1, 0, [
      { value: 'after' }
    ])
    draw.render({ isLazy: false, isSetCursor: false })
    const node = layout(draw).nodes.find(
      n => n.kind === 'block' && n.blockType === 'iframe'
    ) as BlockBox
    expect(node.source.start).toBe(list.indexOf(object))
    expect(node.anchor?.position.elementIndex).toBe(list.indexOf(object))
    expect(
      draw.getPosition().getOriginalMainPositionList().filter(Boolean)
    ).toHaveLength(list.length)
  })
})

describe('object boundaries followed by headings', () => {
  it.each([ElementType.PAGE_BREAK, ElementType.SEPARATOR])(
    'keeps every source position after a newline-valued %s',
    async type => {
      const draw = await setup([
        { value: 'Before' },
        { value: '\n', type },
        {
          value: '',
          type: ElementType.TITLE,
          level: TitleLevel.FIRST,
          valueList: [{ value: 'Next heading' }]
        },
        { value: '\nAfter' }
      ])
      const elements = draw.getOriginalMainElementList()
      const positions = draw.getPosition().getOriginalMainPositionList()
      expect(positions.length).toBe(elements.length)
      for (let index = 0; index < elements.length; index++) {
        expect(positions[index], `source slot ${index}`).toBeDefined()
        expect(positions[index].index).toBe(index)
      }
      const heading = elements.findIndex(element => !!element.titleId)
      expect(heading).toBeGreaterThan(0)
      if (type === ElementType.PAGE_BREAK)
        expect(positions[heading].pageNo).toBeGreaterThan(positions[0].pageNo)
    }
  )
})
