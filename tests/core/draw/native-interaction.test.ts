import { CommandAdapt } from '@/editor/core/command/CommandAdapt'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import {
  lineCarets,
  pageRect,
  textRangeRects
} from '@/editor/core/layout/InteractionGeometry'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ZERO } from '@/editor/dataset/constant/Common'
import { EditorZone, PaperDirection } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import {
  CaretMovement,
  DeleteMovement,
  TextDirection
} from '@/editor/dataset/enum/TextDirection'
import { TextScript } from '@/editor/dataset/enum/TextScript'
import type { IEditorOption } from '@/editor/interface/Editor'
import type { IElement } from '@/editor/interface/Element'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
const arabic = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
const latin = new Uint8Array(
  readFileSync('tests/fixtures/fonts/NotoSans-Latin-Regular.woff2')
).buffer
const draws: Draw[] = []
afterEach(() => {
  draws.splice(0).forEach(d => d.destroy())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
async function setup(main: IElement[], extra: Partial<IEditorOption> = {}) {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Latin',
    fonts: [
      { family: 'Latin', data: latin },
      { family: 'Arabic', scripts: [TextScript.ARAB], data: arabic }
    ],
    width: 360,
    height: 320,
    margins: [20, 20, 20, 20],
    pageNumber: { disabled: true },
    header: { disabled: true },
    footer: { disabled: true },
    ...extra
  })
  const content = { main, header: [{ value: ZERO }], footer: [{ value: ZERO }] }
  Object.values(content).forEach(elements =>
    formatElementList(elements, {
      editorOptions: options,
      isForceCompensation: true
    })
  )
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
function caret(draw: Draw, index: number) {
  draw.getPosition().setNativeCaretHint(null)
  draw.getRange().setRange(index, index)
  draw.render({ curIndex: index, isCompute: false, isSubmitHistory: false })
}
function key(draw: Draw, key: string, shiftKey = false) {
  draw.getCanvasEvent().keydown(
    new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true
    })
  )
}
describe('T17 native interaction geometry', () => {
  for (const scale of [0.75, 1.75])
    for (const direction of [TextDirection.LTR, TextDirection.RTL]) {
      it(`round-trips native carets, keeps graphemes intact and scales once: ${scale}/${direction}`, async () => {
        const draw = await setup(
          [{ value: 'office é مرحبا 👩‍👩‍👧‍👦 words '.repeat(8), direction }],
          { scale }
        )
        const position = draw.getPosition()
        const before = JSON.stringify(
          position.getNativeLines().map(p => p.line)
        )
        const old = draw.getLayoutHostAdapter().getHitTest()
        vi.spyOn(old, 'pointToLogicalIndex').mockImplementation(() => {
          throw new Error('old hit geometry')
        })
        vi.spyOn(old, 'caretMetrics').mockImplementation(() => {
          throw new Error('old caret geometry')
        })
        for (const placed of position.getNativeLines()) {
          for (const stop of lineCarets(placed)) {
            const hit = position.getPositionByXY({
              pageNo: stop.pageNo,
              x: stop.x,
              y: stop.y + stop.height / 2
            })
            expect(hit.nativeCaret).toBeTruthy()
            expect(hit.nativeCaret!.x).toBeCloseTo(stop.x)
            const element =
              draw.getOriginalMainElementList()[
                hit.nativeCaret!.position.elementIndex
              ]
            if (element)
              expect([0, element.value.length]).toContain(
                hit.nativeCaret!.position.offset
              )
          }
        }
        expect(JSON.stringify(position.getNativeLines().map(p => p.line))).toBe(
          before
        )
      })
    }
  it('uses the true native caret box for cursor and IME placement, including soft-wrap affinity', async () => {
    const draw = await setup([{ value: 'office مرحبا '.repeat(70) }], {
      scale: 1.25
    })
    const position = draw.getPosition()
    const placed = position.getNativeLines().find(p => p.pageNo === 1)!
    const stop = lineCarets(placed)[0]
    position.setNativeCaretHint(stop)
    draw.getRange().setRange(stop.index, stop.index)
    draw.render({
      curIndex: stop.index,
      isCompute: false,
      isSubmitHistory: false
    })
    const dom = draw.getCursor().getCursorDom()
    const offset = draw.getPageOffset(stop.pageNo)
    expect(parseFloat(dom.style.left)).toBeCloseTo(stop.x + offset.x)
    expect(parseFloat(dom.style.top)).toBeCloseTo(stop.y + offset.y)
    expect(parseFloat(dom.style.height)).toBeCloseTo(stop.height)
    expect(draw.getPageNo()).toBe(stop.pageNo)
  })
  it('uses cluster/caret ranges for selection, search and spellcheck without paragraph spacing', async () => {
    const draw = await setup(
      [
        { value: 'office مرحبا', spacingAfter: 60 },
        { value: ZERO },
        { value: 'next' }
      ],
      { spellcheck: { disabled: false } }
    )
    const position = draw.getPosition(),
      elements = draw.getOriginalMainElementList()
    const end = elements.findIndex((e, i) => i > 0 && e.value === ZERO) - 1
    draw.getRange().setRange(0, end)
    const rangePaint = vi.spyOn(draw.getRange(), 'render')
    draw.render({
      isCompute: false,
      isSetCursor: false,
      isLazy: false,
      isSubmitHistory: false
    })
    const rects = position.getNativeRangeRects(1, end + 1)
    expect(rangePaint.mock.calls.map(c => c.slice(1))).toEqual(
      rects.map(r => [r.x, r.y, r.width, r.height])
    )
    const line = position.getNativeLines()[0],
      box = pageRect(line, line.line.rect)
    expect(
      draw.getRange().getIsPointInRange(box.x + 1, box.y + box.height + 20)
    ).toBe(false)
    draw.getSearch().setSearchKeyword('office')
    draw.getSearch().compute('office')
    const ctx = document.createElement('canvas').getContext('2d')!
    const fill = vi.spyOn(ctx, 'fillRect')
    draw.getSearch().render(ctx, 0)
    expect(fill).toHaveBeenCalled()
    for (const call of fill.mock.calls)
      expect(call[3]).toBeLessThanOrEqual(box.height)
    draw
      .getSpellcheck()
      .setSpellcheckRangeList([{ startIndex: 1, endIndex: 6 }])
    const wave = vi.spyOn(draw.getSpellcheck() as any, '_drawWave')
    draw.getSpellcheck().render(ctx, 0)
    expect(wave.mock.calls[0][2]).toBeCloseTo(box.y + box.height)
  })
  it('keeps BiDi group gaps unpainted and returns the same visual intervals as selection', async () => {
    const draw = await setup([{ value: 'abc مرحبا xyz' }])
    const elements = draw.getOriginalMainElementList()
    elements[2].groupIds = ['g']
    elements[8].groupIds = ['g']
    const ctx = document.createElement('canvas').getContext('2d')!
    const fill = vi.spyOn(ctx, 'fillRect')
    const group = draw.getGroup()
    for (const index of [2, 8])
      for (const rect of draw
        .getPosition()
        .getNativeRangeRects(index, index + 1))
        group.recordFillInfo(
          elements[index],
          rect.x,
          rect.y,
          rect.width,
          rect.height
        )
    group.render(ctx)
    expect(fill.mock.calls.length).toBe(2)
  })
  it('publishes native range/group rectangles in container CSS pixels at zoom', async () => {
    const draw = await setup([{ value: 'abc مرحبا xyz' }], { scale: 1.75 })
    const command = new CommandAdapt(draw)
    const elements = draw.getOriginalMainElementList()
    elements.slice(2, 9).forEach(element => {
      element.groupIds = ['g']
    })
    draw.getRange().setRange(1, 8)
    const context = command.getRangeContext()!
    const rects = command.getGroupRectList('g')!
    expect(context.rangeRects).toEqual(rects)
    expect(rects.every(rect => rect.width > 0 && rect.height > 0)).toBe(true)
    expect(rects[0].height).toBeCloseTo(
      draw.getPosition().getNativeLines()[0].line.contentHeight * 1.75
    )
  })

  it('retains dedicated object geometry in mixed text selection and group queries', async () => {
    const draw = await setup(
      [
        { value: 'body' },
        { type: ElementType.SEPARATOR, value: '', groupIds: ['object'] }
      ],
      { scale: 1.25 }
    )
    const elements = draw.getOriginalMainElementList()
    const index = elements.findIndex(e => e.type === ElementType.SEPARATOR)
    const command = new CommandAdapt(draw)
    draw.getRange().setRange(index - 1, index)
    const rectangles = command.getGroupRectList('object')!
    expect(rectangles.length).toBeGreaterThan(0)
    expect(rectangles[0].width).toBeGreaterThan(0)
    expect(command.getRangeContext()!.rangeRects).toEqual(rectangles)
    const pos = draw.getPosition().getOriginalMainPositionList()[index]
    expect(
      draw
        .getRange()
        .getIsPointInRange(
          pos.coordinate.leftTop[0] + 1,
          pos.coordinate.leftTop[1] + 1
        )
    ).toBe(true)
  })

  it('moves visually on screen, logically in source order, and preserves a fixed Shift anchor', async () => {
    const draw = await setup([{ value: 'abc مرحبا xyz' }])
    const position = draw.getPosition()
    const stops = lineCarets(position.getNativeLines()[0])
    const first = stops[0]
    position.setNativeCaretHint(first)
    draw.getRange().setRange(first.index, first.index)
    draw.render({
      curIndex: first.index,
      isCompute: false,
      isSubmitHistory: false
    })
    let previous = first.x
    for (let i = 0; i < stops.length - 1; i++) {
      key(draw, 'ArrowRight')
      const next = position.getNativeCaret(
        draw.getRange().getRange().startIndex
      )!
      expect(next.x).toBeGreaterThanOrEqual(previous)
      previous = next.x
    }
    draw.getOptions().caretMovement = CaretMovement.LOGICAL
    caret(draw, 2)
    key(draw, 'ArrowRight', true)
    key(draw, 'ArrowRight', true)
    expect(draw.getRange().getRange()).toMatchObject({
      startIndex: 2,
      endIndex: 4
    })
    key(draw, 'ArrowLeft', true)
    expect(draw.getRange().getRange()).toMatchObject({
      startIndex: 2,
      endIndex: 3
    })
    expect(position.getCursorPosition()!.index).toBe(2)
  })
  it('deletes a combining cluster across source elements atomically and retains missing ZWJ text', async () => {
    const draw = await setup([{ value: 'e' }, { value: '́' }, { value: 'X' }], {
      caretMovement: CaretMovement.LOGICAL,
      deleteMovement: DeleteMovement.LOGICAL
    })
    const position = draw.getPosition()
    expect(position.getNativeDeleteRange(2, true, false)).toMatchObject({
      index: 1,
      count: 2,
      cursorIndex: 0
    })
    caret(draw, 1)
    expect(draw.getRange().getRange().startIndex).toBe(2)
    caret(draw, 0)
    key(draw, 'ArrowRight')
    expect(draw.getRange().getRange().startIndex).toBe(2)
    key(draw, 'Backspace')
    expect(
      draw
        .getOriginalMainElementList()
        .map(e => e.value)
        .join('')
    ).toBe(ZERO + 'X')
    const missing = await setup([{ value: '👩‍👩‍👧‍👦' }, { value: 'A' }])
    caret(missing, 1)
    new CommandAdapt(missing).backspace()
    expect(
      missing
        .getOriginalMainElementList()
        .map(e => e.value)
        .join('')
    ).toBe(ZERO + 'A')
  })
  it('places cell interaction geometry with vertical alignment and fragment clipping, including nested scopes', async () => {
    const table: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 160 }, { width: 160 }],
      trList: [
        {
          height: 80,
          tdList: [
            {
              colspan: 1,
              rowspan: 1,
              verticalAlign: 'bottom' as any,
              value: [{ value: 'cell' }]
            },
            { colspan: 1, rowspan: 1, value: [{ value: 'second' }] }
          ]
        },
        {
          height: 40,
          tdList: [
            {
              colspan: 2,
              rowspan: 1,
              value: [{ value: 'long مرحبا '.repeat(90) }]
            }
          ]
        }
      ]
    }
    const draw = await setup([table])
    const position = draw.getPosition(),
      model = draw
        .getOriginalMainElementList()
        .find(e => e.type === ElementType.TABLE)!
    for (const row of model.trList!)
      for (const td of row.tdList) {
        for (const placed of position.getNativeLines(td.positionList!)) {
          for (const rect of textRangeRects(placed, 0, td.value.length)) {
            expect(rect.y).toBeGreaterThanOrEqual(placed.clip!.y - 0.01)
            expect(rect.y + rect.height).toBeLessThanOrEqual(
              placed.clip!.y + placed.clip!.height + 0.01
            )
            const hit = position.getPositionByXY({
              pageNo: placed.pageNo,
              x: rect.x + Math.min(1, rect.width / 2),
              y: rect.y + rect.height / 2
            })
            expect(hit.isTable).toBe(true)
            expect(hit.tdId).toBe(td.id)
          }
        }
      }
  })
  it('maps UTF-16 search matches to grapheme sources and highlights/replaces inside nested cells', async () => {
    const nested: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 220 }],
      trList: [
        {
          height: 40,
          tdList: [
            { colspan: 1, rowspan: 1, value: [{ value: 'A👩‍👩‍👧‍👦B é office' }] }
          ]
        }
      ]
    }
    const outer: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 280 }],
      trList: [
        {
          height: 180,
          tdList: [
            {
              colspan: 1,
              rowspan: 1,
              verticalAlign: 'bottom' as any,
              value: [nested]
            }
          ]
        }
      ]
    }
    const draw = await setup([outer])
    const root = draw.getOriginalMainElementList()
    const search = draw.getSearch()
    const results = search.getMatchList('B', root)
    expect(results).toHaveLength(1)
    expect(results[0].tablePath).toHaveLength(2)
    const context = {
      isTable: true,
      index: results[0].tableIndex,
      tablePath: results[0].tablePath
    }
    const cell = draw.getPosition().getTableTdByContext(root, context)!
    expect(
      lineCarets(draw.getPosition().getNativeLines(cell.positionList!)[0])
        .length
    ).toBeGreaterThan(0)
    expect(cell.value[results[0].index].value).toBe('B')
    cell.value[results[0].index].groupIds = ['nested-group']
    expect(
      new CommandAdapt(draw).getGroupRectList('nested-group')?.length
    ).toBeGreaterThan(0)

    expect(search.getMatchList('👩', root)).toHaveLength(1)
    search.setSearchKeyword('office')
    search.compute('office')
    const ctx = document.createElement('canvas').getContext('2d')!
    const fill = vi.spyOn(ctx, 'fillRect')
    search.render(ctx, 0)
    expect(fill).toHaveBeenCalled()
    search.replace('👩‍👩‍👧‍👦')
    expect(cell.value.filter(e => e.value === '👩‍👩‍👧‍👦')).toHaveLength(2)
    expect(cell.value.map(e => e.value).join('')).not.toContain('office')
    expect(draw.getPosition().getPositionContext().tablePath).toHaveLength(2)
  })

  it('keeps header geometry separate for mixed paper directions', async () => {
    const draw = await setup(
      [
        { value: 'body' },
        {
          value: '',
          type: ElementType.PAGE_BREAK,
          paperDirection: PaperDirection.HORIZONTAL
        },
        { value: 'wide' }
      ],
      { header: { disabled: false } }
    )
    draw.getHeader().setElementList([{ value: ZERO }, { value: 'header' }])
    draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
    draw.getZone().setZone(EditorZone.HEADER)
    draw.setPageNo(1)
    const position = draw.getPosition()
    const lines = position.getNativeLines(position.getOriginalPositionList(1))
    expect(lines[0].line.source.scope).toBe('header:horizontal')
    const stop = lineCarets(lines[0]).at(-1)!
    const hit = position.getPositionByXY({
      pageNo: 1,
      x: stop.x,
      y: stop.y + stop.height / 2
    })
    expect(hit.nativeCaret?.scope).toBe('header:horizontal')
  })
})
