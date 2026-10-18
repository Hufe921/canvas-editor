import { CommandAdapt } from '@/editor/core/command/CommandAdapt'
import { Draw } from '@/editor/core/draw/Draw'
import { LineNumber } from '@/editor/core/draw/frame/LineNumber'
import { PageNumber } from '@/editor/core/draw/frame/PageNumber'
import { Placeholder } from '@/editor/core/draw/frame/Placeholder'
import { Watermark } from '@/editor/core/draw/frame/Watermark'
import { PageBreakParticle } from '@/editor/core/draw/particle/PageBreakParticle'
import { Ruler } from '@/editor/core/draw/ruler/Ruler'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { LayoutHostAdapter } from '@/editor/core/text-engine-host/LayoutHostAdapter'
import {
  drawPlainText,
  measurePlainText,
  truncatePlainText
} from '@/editor/core/text-engine-host/drawPlainText'
import { ZERO } from '@/editor/dataset/constant/Common'
import { PaperDirection } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IEditorOption } from '@/editor/interface/Editor'
import type { IElement } from '@/editor/interface/Element'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const data = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
const draws: Draw[] = []
afterEach(() => {
  draws.splice(0).forEach(draw => draw.destroy())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
async function setup(
  main: IElement[],
  extra: Partial<IEditorOption> = {},
  header: IElement[] = [{ value: ZERO }]
) {
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    pageNumber: { disabled: true },
    width: 300,
    height: 500,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    ...extra
  })
  const content = { main, header, footer: [{ value: ZERO }] }
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

const style = {
  text: 'Latin مرحبا',
  fontFamily: 'Arabic',
  fontSize: 16,
  color: '#000'
}
function forbidBrowserText(ctx: CanvasRenderingContext2D) {
  vi.spyOn(ctx, 'measureText').mockImplementation(() => {
    throw new Error('browser measure')
  })
  vi.spyOn(ctx, 'fillText').mockImplementation(() => {
    throw new Error('browser paint')
  })
  vi.spyOn(ctx, 'strokeText').mockImplementation(() => {
    throw new Error('browser paint')
  })
}
describe('T16 native auxiliary text and measurement', () => {
  it('defers chrome before ready and rejects public measurement even for empty input', async () => {
    const options = mergeOption({
      autoDownloadFonts: false
    })
    const adapter = new LayoutHostAdapter(() => options)
    const ctx = document.createElement('canvas').getContext('2d')!
    forbidBrowserText(ctx)
    expect(measurePlainText(adapter, style)).toBeNull()
    expect(drawPlainText(adapter, ctx, style, 0, 0)).toBeNull()
    expect(truncatePlainText(adapter, ctx, style, 10)).toBe('')
    expect(() =>
      CommandAdapt.prototype.computeElementListHeight.call(
        {
          draw: {
            getLifecycle: () => ({
              assertReady: () => {
                throw new Error('EDITOR_NOT_READY')
              }
            })
          }
        },
        []
      )
    ).toThrow('EDITOR_NOT_READY')
    adapter.destroy()
  })
  it('uses the service font box for one-line templates and scales exactly once', async () => {
    const draw = await setup([{ value: 'body' }])
    const adapter = draw.getLayoutHostAdapter()
    const service = vi.spyOn(adapter.getTextLayoutService(), 'layoutSingleLine')
    const one = adapter.layoutPlainText({ ...style, text: 'a\nb' })!
    expect(one.lines).toHaveLength(1)
    expect(one.paragraphText).toBe('a b')
    const metrics = measurePlainText(adapter, style)!
    const doubled = measurePlainText(adapter, { ...style, fontSize: 32 })!
    expect(doubled.width).toBeCloseTo(metrics.width * 2)
    expect(doubled.height).toBeCloseTo(metrics.height * 2)
    expect(metrics.height).toBeCloseTo(
      adapter.layoutCaption(
        {
          value: '',
          imgCaption: { value: style.text, font: 'Arabic', size: 16 }
        },
        style.text
      ).lines[0].height
    )
    expect(service).toHaveBeenCalled()
  })
  it('truncates only complete graphemes and shaping clusters and fits the suffix', async () => {
    const draw = await setup([{ value: 'body' }])
    const adapter = draw.getLayoutHostAdapter()
    const ctx = document.createElement('canvas').getContext('2d')!
    forbidBrowserText(ctx)
    for (const text of ['A😀é👩‍👩‍👧‍👦Z مرحبا', 'office لا مرحبا']) {
      const input = { ...style, text }
      const original = adapter.layoutPlainText(input)!
      const glyphs = original.lines[0].glyphs
      const boundaries = [
        0,
        ...[
          ...new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(
            text
          )
        ].map(g => g.index + g.segment.length)
      ]
      for (const width of [0, 1, 18, 40, 65, 90]) {
        const result = truncatePlainText(adapter, ctx, input, width)
        if (result.endsWith('...')) {
          const end = result.length - 3
          expect(boundaries).toContain(end)
          expect(glyphs.some(g => g.charStart < end && end < g.charEnd)).toBe(
            false
          )
        }
        expect(
          measurePlainText(adapter, { ...input, text: result })?.width || 0
        ).toBeLessThanOrEqual(width)
      }
    }
  })
  it('paints line/page numbers, rotated watermark, page break and ruler through glyphs', async () => {
    const draw = await setup(
      [
        { value: 'body' },
        {
          value: '',
          type: ElementType.PAGE_BREAK,
          paperDirection: PaperDirection.HORIZONTAL
        },
        { value: 'tail' }
      ],
      {
        scale: 1.5,
        lineNumber: { disabled: false, font: 'Arabic' },
        pageNumber: { font: 'Arabic' },
        watermark: { data: 'مرحبا', font: 'Arabic' }
      }
    )
    const ctx = document.createElement('canvas').getContext('2d')!
    forbidBrowserText(ctx)
    const renderer = vi.spyOn(
      draw.getLayoutHostAdapter().getGlyphRenderer(),
      'drawLine'
    )
    new LineNumber(draw).render(ctx, 1)
    const numberCall = renderer.mock.calls[0]
    const page = draw.getPageSize(1)
    expect(numberCall[2]).toBeLessThan(page.width)
    new PageNumber(draw).render(ctx, 1)
    new Watermark(draw).renderText(ctx, 1)
    const element = draw.getRowList().find(r => r.isPageBreak)!.elementList[0]
    new PageBreakParticle(draw).render(ctx, element, 20, 20)
    draw.getOptions().ruler.disabled = false
    const ruler = new Ruler(draw)
    ruler.render()
    ruler.dispose()
    expect(renderer.mock.calls.length).toBeGreaterThan(10)
    expect(ctx.rotate).toHaveBeenCalledWith(-Math.PI / 4)
  })
  it('isolates placeholder and standalone text/table measurement from body and cell handles', async () => {
    const table: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 200 }],
      trList: [
        {
          height: 30,
          tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell مرحبا' }] }]
        }
      ]
    }
    const draw = await setup([{ value: 'body' }, table])
    const adapter = draw.getLayoutHostAdapter()
    const model = draw.getOriginalMainElementList()
    const actualTable = model.find(e => e.type === ElementType.TABLE)!
    const tdScope = 'td:' + actualTable.trList![0].tdList[0].id
    const body = adapter.findLayoutByElementIndex(1)!.layout
    const cell = adapter.findLayoutByElementIndex(1, tdScope)!.layout
    const before = JSON.stringify(model)
    const command = new CommandAdapt(draw)
    expect(command.computeElementListHeight(model)).toBeGreaterThan(0)
    expect(command.computeElementListHeight([])).toBe(0)
    const ctx = document.createElement('canvas').getContext('2d')!
    forbidBrowserText(ctx)
    new Placeholder(draw).render(ctx, {
      placeholder: {
        data: 'placeholder مرحبا',
        font: 'Arabic',
        size: 16,
        color: '#999',
        opacity: 0.5
      },
      startY: 0
    })
    expect(adapter.findLayoutByElementIndex(1)!.layout).toBe(body)
    expect(adapter.findLayoutByElementIndex(1, tdScope)!.layout).toBe(cell)
    expect(adapter.findLayoutByElementIndex(1, 'measurement')).toBeUndefined()
    expect(
      adapter.findLayoutByElementIndex(1, 'measurement/' + tdScope)
    ).toBeUndefined()
    expect(JSON.stringify(model)).toBe(before)
  })
  it('lays out an empty cell Area placeholder at cell width and reports its own source', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const draw = await setup([
      { value: 'body' },
      {
        type: ElementType.TABLE,
        value: '',
        colgroup: [{ width: 90 }],
        trList: [
          {
            height: 80,
            tdList: [
              {
                colspan: 1,
                rowspan: 1,
                value: [
                  {
                    value: ZERO,
                    areaId: 'empty-cell',
                    area: {
                      placeholder: {
                        data: '汉 placeholder '.repeat(5),
                        font: 'Arabic'
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ])
    const adapter = draw.getLayoutHostAdapter()
    const virtual = adapter.findLayoutByElementIndex(
      1,
      'placeholder:area:empty-cell'
    )!.layout
    expect(virtual.lines.length).toBeGreaterThan(1)
    expect(
      Math.max(...virtual.lines.map(line => line.width))
    ).toBeLessThanOrEqual(90)
    const issues = draw.getFontCoverageReport().issues
    const location = issues
      .flatMap(issue => issue.locations)
      .find(loc => loc.scope.startsWith('td:'))!
    expect(location).toBeTruthy()
    expect(location.end).toBeGreaterThan(location.start)
  })

  it('includes line/ruler/placeholder fonts and resolves their diagnostics after font registration', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const draw = await setup([], {
      fonts: [],
      lineNumber: { disabled: false, font: 'Arabic' },
      ruler: { disabled: false },
      placeholder: { data: 'مرحبا', font: 'Arabic' }
    })
    const scopes = draw
      .getFontCoverageReport()
      .issues.flatMap(issue => issue.locations.map(loc => loc.scope))
    expect(scopes).toContain('aux:lineNumber')
    expect(scopes).toContain('aux:ruler')
    expect(scopes).toContain('aux:placeholder')
    await draw.registerFonts([{ family: 'Arabic', data }])
    expect(draw.getFontCoverageReport().issues).toEqual([])
  })

  it('reports complete auxiliary source text, updates on paint-only changes and clears removed options', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const draw = await setup([{ value: 'body' }], {
      watermark: { data: '汉', font: 'Arabic' },
      pageNumber: { disabled: false, font: 'Arabic', format: '字{pageNo}' }
    })
    let scopes = draw
      .getFontCoverageReport()
      .issues.flatMap(issue => issue.locations.map(loc => loc.scope))
    expect(scopes).toContain('aux:watermark')
    expect(scopes).toContain('aux:pageNumber')
    expect(document.querySelector('.ce-font-diagnostics button')).toBeNull()
    draw.getOptions().watermark.data = ''
    draw.getOptions().pageNumber.disabled = true
    draw.render({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    expect(draw.getFontCoverageReport().issues).toEqual([])
    const image: IElement = {
      type: ElementType.IMAGE,
      value: '',
      width: 10,
      height: 20,
      imgCaption: { value: '字{imageNo}𠀀', font: 'Arabic' }
    }
    draw.getOriginalMainElementList().push(image)
    draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
    const issues = draw.getFontCoverageReport().issues
    expect(issues.flatMap(issue => issue.missingCharacters)).toContain('𠀀')
    expect(
      issues
        .flatMap(issue => issue.locations)
        .some(loc => loc.scope === 'main' && loc.end > loc.start)
    ).toBe(true)
    scopes = issues.flatMap(issue => issue.locations.map(loc => loc.scope))
    expect(scopes).not.toContain('aux:watermark')
  })
})
