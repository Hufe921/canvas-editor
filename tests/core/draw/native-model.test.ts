import { CommandAdapt } from '@/editor/core/command/CommandAdapt'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ListStyle, ListType } from '@/editor/dataset/enum/List'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IElement } from '@/editor/interface/Element'
import {
  createDomFromElementList,
  formatElementList,
  getElementListByHTML,
  getSlimCloneElementList,
  getTextFromElementList,
  zipElementList
} from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const data = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
const draws: Draw[] = []
afterEach(() => {
  draws.splice(0).forEach(draw => draw.destroy())
  vi.restoreAllMocks()
  document.body.replaceChildren()
})
function textElements(elements: IElement[]): IElement[] {
  return elements.flatMap(element =>
    element.trList
      ? element.trList.flatMap(row =>
          row.tdList.flatMap(cell => textElements(cell.value))
        )
      : [element]
  )
}
async function setup(incrementalCompute = true, freeze = false) {
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    pageNumber: { disabled: true },
    width: 360,
    height: 300,
    margins: [20, 20, 20, 20],
    lab: { incrementalCompute },
    header: { disabled: false },
    footer: { disabled: true }
  })
  const main: IElement[] = [
    {
      value: 'مرحبا abc',
      direction: TextDirection.RTL,
      groupIds: ['g'],
      spacingAfter: 12,
      extension: { metrics: 'user-data', sourceIndex: 77 }
    },
    { value: '\n' },
    { value: '2', type: ElementType.SUPERSCRIPT },
    {
      value: '',
      type: ElementType.TABLE,
      id: 'table-id',
      colgroup: [{ width: 260 }],
      trList: [
        {
          id: 'row-id',
          height: 40,
          tdList: [
            {
              id: 'cell-id',
              colspan: 1,
              rowspan: 1,
              value: [{ value: 'cell مرحبا', groupIds: ['cell-group'] }]
            }
          ]
        }
      ]
    }
  ]
  const content = {
    main,
    header: [{ value: 'header مرحبا' }],
    footer: [{ value: ZERO }]
  }
  Object.values(content).forEach(elements =>
    formatElementList(elements, {
      editorOptions: options,
      isForceCompensation: true
    })
  )
  if (freeze)
    Object.values(content).flatMap(textElements).forEach(Object.freeze)
  const container = document.createElement('div')
  document.body.append(container)
  const draw = new Draw(
    container,
    options,
    content,
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  await draw.ready
  draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
  return draw
}

describe('T19 native model/layout separation', () => {
  it.each([false, true])(
    'lays out frozen source text without render fields (incremental: %s)',
    async incremental => {
      const draw = await setup(incremental, true)
      const source = draw.getOriginalMainElementList()
      for (const element of textElements(source)) {
        for (const key of [
          'metrics',
          'style',
          'visualLeft',
          'sourceIndex',
          'actualSize',
          'clusterStart'
        ])
          expect(Object.hasOwn(element, key), key).toBe(false)
      }
      for (const row of draw.getRawLayoutRows()) {
        expect(row).not.toHaveProperty('engineLine')
        expect(row).not.toHaveProperty('engineParagraphText')
        row.elementList.forEach((element, offset) => {
          expect(source[row.sourceIndices![offset]]).toBe(element)
        })
      }
      const table = source.find(element => element.type === ElementType.TABLE)!
      const cell = table.trList![0].tdList[0]
      expect(cell.rowList!.length).toBeGreaterThan(0)
      expect(cell.positionList!.length).toBeGreaterThan(0)
      expect(Object.keys(cell)).not.toContain('rowList')
      expect(JSON.stringify(source)).not.toContain('nativeLine')
    }
  )

  it('keeps zero-ink and empty source slots in native mappings and page exports', async () => {
    const draw = await setup()
    const source = draw.getOriginalMainElementList()
    draw.spliceElementList(source, 3, 0, [
      { value: '', extension: { retained: true } },
      { value: 'hidden', hide: true }
    ])
    draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
    const mapped = new Set(
      draw.getRawLayoutRows().flatMap(row => row.sourceIndices || [])
    )
    expect(mapped.has(3)).toBe(true)
    expect(mapped.has(4)).toBe(true)
    expect(
      draw
        .getOriginValue({ pageNo: 0 })
        .main.some(
          el =>
            el.extension && (el.extension as { retained?: boolean }).retained
        )
    ).toBe(true)
  })

  it('paints checkbox list markers at their declared object size without synthetic row elements', async () => {
    const draw = await setup()
    const source = draw.getOriginalMainElementList()
    const end = source.findIndex(
      (element, index) => index > 0 && element.value === ZERO
    )
    draw.setElementProperty(source.slice(0, end), {
      listId: 'todo',
      listType: ListType.UL,
      listStyle: ListStyle.CHECKBOX
    })
    const rect = vi.spyOn(draw.getCtx(), 'rect')
    draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
    const { checkbox, scale } = draw.getOptions()
    expect(
      rect.mock.calls.some(
        ([, , width, height]) =>
          width === checkbox.width * scale && height === checkbox.height * scale
      )
    ).toBe(true)
    expect(draw.getLayoutRowList()[0].elementList[0]).toBe(source[0])
  })

  it('emits detached compatibility rows and positions without feeding them back into layout', async () => {
    const draw = await setup()
    const live = draw.getLayoutRowList()[0]
    const output = draw.getRowList()[0]
    expect(output.nativeLine).toEqual(live.nativeLine)
    expect(output.elementList[1].metrics.width).toBeGreaterThan(0)
    output.elementList[1].value = 'changed'
    output.elementList[1].metrics.width = 9999
    output.nativeLine!.rect.width = 9999
    expect(live.elementList[1].value).not.toBe('changed')
    expect(live.nativeLine!.rect.width).not.toBe(9999)
    expect(live.elementList[1]).not.toHaveProperty('metrics')
  })

  it('keeps save/copy/HTML text, paragraph styles, groups and table identity', async () => {
    const draw = await setup()
    const source = draw.getOriginalMainElementList()
    const copy = zipElementList(source, { extraPickAttrs: ['id'] })
    const table = source.find(element => element.type === ElementType.TABLE)!
    const copiedTable = copy.find(
      element => element.type === ElementType.TABLE
    )!
    expect(copiedTable.id).toBe(table.id)
    expect(copiedTable.trList![0].id).toBe(table.trList![0].id)
    expect(copiedTable.trList![0].tdList[0].id).toBe(
      table.trList![0].tdList[0].id
    )
    expect(copy[0].direction).toBe(TextDirection.RTL)
    expect(copy[0].spacingAfter).toBe(12)
    expect(copy[0].groupIds).toEqual(['g'])
    const html = createDomFromElementList(copy, draw.getOptions()).innerHTML
    const imported = getElementListByHTML(html, { innerWidth: 320 })
    expect(getTextFromElementList(imported).replace(/\s/g, '')).toContain(
      getTextFromElementList(copy).replace(/\s/g, '')
    )
    expect(JSON.stringify(draw.getValue())).not.toContain('visualLeft')
    expect(JSON.stringify(copy)).not.toContain('rowList')
    const command = new CommandAdapt(draw)
    const rects = command.getGroupRectList('g')!
    expect(rects.length).toBeGreaterThan(0)
    expect(rects.every(rect => rect.width > 0)).toBe(true)
  })

  it('history clones discard layout state and preserve extension keys and table IDs', async () => {
    const draw = await setup()
    const before = draw.getValue({ extraPickAttrs: ['id'] }).data
    const source = draw.getOriginalMainElementList()
    const history = getSlimCloneElementList(source)
    expect(JSON.stringify(history)).not.toContain('nativeLine')
    expect(history.find(el => el.extension)?.extension).toEqual({
      metrics: 'user-data',
      sourceIndex: 77
    })
    draw.getHistoryManager().recovery()
    draw.submitHistory(2)
    draw.spliceElementList(source, 3, 0, [{ value: 'x' }])
    draw.render({ curIndex: 3, isLazy: false })
    draw.getHistoryManager().undo()
    expect(draw.getValue({ extraPickAttrs: ['id'] }).data).toEqual(before)
    draw.getHistoryManager().redo()
    expect(draw.getOriginalMainElementList()[3].value).toBe('x')
  })
})
