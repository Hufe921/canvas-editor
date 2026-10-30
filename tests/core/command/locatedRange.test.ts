import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  EditorMode,
  EditorZone,
  PaperDirection
} from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import { MaxHeightRatio, ImageDisplay } from '@/editor/dataset/enum/Common'
import { ControlType } from '@/editor/dataset/enum/Control'
import { Draw } from '@/editor/core/draw/Draw'
import { Command } from '@/editor/core/command/Command'
import { CommandAdapt } from '@/editor/core/command/CommandAdapt'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import type { IEditorData, IEditorOption } from '@/editor/interface/Editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'
import type { ILocatedRange } from '@/editor/interface/Range'
import { createTestEditor } from '../../factories/editor'

function nested(): IElement[] {
  return [
    { value: 'Body' },
    {
      type: ElementType.TABLE,
      id: 'outer',
      value: '',
      colgroup: [{ width: 400 }],
      trList: [
        {
          id: 'outer-row',
          height: 140,
          tdList: [
            {
              id: 'outer-cell',
              colspan: 1,
              rowspan: 1,
              value: [
                {
                  type: ElementType.TABLE,
                  id: 'inner',
                  value: '',
                  colgroup: [{ width: 180 }, { width: 180 }],
                  trList: [
                    {
                      id: 'inner-row',
                      height: 80,
                      tdList: ['left', 'right'].map(id => ({
                        id,
                        colspan: 1,
                        rowspan: 1,
                        value: [{ value: '🔔 é' }]
                      }))
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
const located = (cellId = 'left'): ILocatedRange => ({
  zone: EditorZone.MAIN,
  tablePath: [
    { tableId: 'outer', rowId: 'outer-row', cellId: 'outer-cell' },
    { tableId: 'inner', rowId: 'inner-row', cellId }
  ],
  startIndex: 0,
  endIndex: 1,
  sourceText: ZERO + '🔔 é'
})

function engine(data: IEditorData, input: IEditorOption = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const options = mergeOption(input)
  const source: IEditorData = {
    ...structuredClone(data),
    header: structuredClone(data.header ?? []),
    footer: structuredClone(data.footer ?? [])
  }
  for (const items of [source.main, source.header ?? [], source.footer ?? []]) {
    formatElementList(items, {
      editorOptions: options,
      isForceCompensation: true
    })
  }
  const draw = new Draw(
    container,
    options,
    source,
    new Listener(),
    new EventBus(),
    new Override()
  )
  return {
    draw,
    command: new Command(new CommandAdapt(draw)),
    destroy: () => {
      draw.destroy()
      container.remove()
    }
  }
}

describe('stable nested range restoration and element geometry', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    ctx?.destroy()
  })

  it('restores repeated text into the exact nested cell and exposes cloned boxes', () => {
    ctx = createTestEditor({ data: nested() })
    const command = ctx.editor.command
    const before = command.getValue().data
    command.executeRestoreRange(located())
    expect(command.getRangeContext()?.selectionText).toContain('🔔')
    expect(command.getRangeContext()?.tdIndex).toBe(0)
    const left = command.getLocatedElementRects(located())
    command.executeRestoreRange(located('right'))
    expect(command.getRangeContext()?.tdIndex).toBe(1)
    const right = command.getLocatedElementRects(located('right'))
    expect(right.at(-1)?.x).toBeGreaterThan(left.at(-1)?.x ?? 0)
    expect(right.at(-1)?.height).toBeGreaterThan(0)
    right[0].x = -999
    expect(command.getLocatedElementRects(located('right'))[0].x).not.toBe(-999)
    expect(command.getValue().data).toEqual(before)
    command.executeSize(22)
    expect(
      command
        .getRangeContext()
        ?.selectionElementList.some(item => item.size === 22)
    ).toBe(true)
    command.executeUndo()
    expect(command.getValue().data).toEqual(before)
  })

  it('rejects stale text, ownership, indices and depth without changing context or range', () => {
    ctx = createTestEditor({ data: nested() })
    const command = ctx.editor.command
    command.executeRestoreRange(located('right'))
    const before = command.getValue().data
    const range = command.getRangeContext()
    let changes = 0
    ctx.editor.eventBus.on('rangeChange', () => {
      changes++
    })
    for (const input of [
      { ...located(), sourceText: ZERO + 'changed' },
      { ...located(), endIndex: 999 },
      { ...located(), startIndex: -1 },
      {
        ...located(),
        tablePath: [...located().tablePath, ...located().tablePath]
      },
      {
        ...located(),
        tablePath: Array.from({ length: 9 }, () => located().tablePath[0])
      },
      located('unknown')
    ]) {
      expect(() => command.executeRestoreRange(input)).toThrow()
      expect(() => command.getLocatedElementRects(input)).toThrow()
      expect(command.getRangeContext()).toEqual(range)
      expect(command.getValue().data).toEqual(before)
    }
    expect(changes).toBe(0)
  })

  it('rejects grapheme boundaries split across formatting elements', () => {
    ctx = createTestEditor({
      data: [
        { value: 'e', bold: true },
        { value: '́', italic: true }
      ]
    })
    const command = ctx.editor.command
    const input: ILocatedRange = {
      zone: EditorZone.MAIN,
      tablePath: [],
      startIndex: 0,
      endIndex: 1,
      sourceText: ZERO + 'é'
    }
    expect(() => command.executeRestoreRange(input)).toThrow(/Unicode/)
    command.executeRestoreRange({ ...input, endIndex: 2 })
    expect(command.getRangeContext()?.selectionText).toContain('é')
  })

  it('switches from a deep cell to an enabled header and back without stale cell context', () => {
    ctx = createTestEditor({
      data: { header: [{ value: 'Header' }], main: nested(), footer: [] },
      options: { header: { disabled: false, editable: true } }
    })
    const command = ctx.editor.command
    command.executeRestoreRange(located())
    command.executeRestoreRange({
      zone: EditorZone.HEADER,
      tablePath: [],
      startIndex: 0,
      endIndex: 1,
      sourceText: ZERO + 'Header'
    })
    expect(command.getRangeContext()?.zone).toBe(EditorZone.HEADER)
    expect(command.getRangeContext()?.isTable).toBe(false)
    command.executeRestoreRange(located('right'))
    expect(command.getRangeContext()?.zone).toBe(EditorZone.MAIN)
    expect(command.getRangeContext()?.tdIndex).toBe(1)
  })

  it('returns page units independent of zoom', () => {
    ctx = createTestEditor({ data: nested() })
    const command = ctx.editor.command
    const before = command.getLocatedElementRects(located('right'))
    command.executePageScale(2)
    const after = command.getLocatedElementRects(located('right'))
    expect(after.at(-1)?.x).toBeCloseTo(before.at(-1)?.x ?? 0)
    expect(after.at(-1)?.y).toBeCloseTo(before.at(-1)?.y ?? 0)
    expect(after.at(-1)?.width).toBeCloseTo(before.at(-1)?.width ?? 0)
  })

  it('rejects disabled story geometry before changing selection or undo', () => {
    ctx = createTestEditor({
      data: {
        main: nested(),
        header: [{ value: 'Header' }],
        footer: [{ value: 'Footer' }]
      },
      options: { header: { disabled: true }, footer: { disabled: true } }
    })
    const command = ctx.editor.command
    for (const [zone, text] of [
      [EditorZone.HEADER, 'Header'],
      [EditorZone.FOOTER, 'Footer']
    ] satisfies Array<[EditorZone, string]>) {
      const range: ILocatedRange = {
        zone,
        tablePath: [],
        startIndex: 0,
        endIndex: 1,
        sourceText: ZERO + text
      }
      expect(() => command.getLocatedElementRects(range)).toThrow(/unavailable/)
      expect(() => command.executeRestoreRange(range)).toThrow(/unavailable/)
      expect(command.getRangeContext()).toBeNull()
      expect(command.getRange()).toMatchObject({ startIndex: -1, endIndex: -1 })
    }
  })

  it('preserves redo across selection-only restoration and ignores edits in readonly mode', () => {
    ctx = createTestEditor({ data: nested() })
    const command = ctx.editor.command
    command.executeRestoreRange(located('right'))
    command.executeSize(22)
    const edited = command.getValue().data
    command.executeUndo()
    command.executeRestoreRange(located('left'))
    command.executeRedo()
    expect(command.getValue().data).toEqual(edited)
    command.executeMode(EditorMode.READONLY)
    command.executeRestoreRange(located('left'))
    command.executeSize(30)
    expect(command.getValue().data).toEqual(edited)
  })

  it('validates collapsed Unicode boundaries and end-of-container carets', () => {
    ctx = createTestEditor({
      data: [
        { value: 'e', bold: true },
        { value: '́', italic: true }
      ]
    })
    const command = ctx.editor.command
    const range: ILocatedRange = {
      zone: EditorZone.MAIN,
      tablePath: [],
      startIndex: 1,
      endIndex: 1,
      sourceText: ZERO + 'é'
    }
    expect(() => command.executeRestoreRange(range)).toThrow(/Unicode/)
    command.executeRestoreRange({ ...range, startIndex: 2, endIndex: 2 })
    expect(
      command.getLocatedElementRects({ ...range, startIndex: 2, endIndex: 2 })
    ).toEqual([])
    expect(command.getRangeContext()?.isCollapsed).toBe(true)
  })

  it('rejects missing Unicode segmentation with an actionable validation error', () => {
    ctx = createTestEditor({ data: nested() })
    vi.stubGlobal('Intl', { Segmenter: undefined })
    expect(() => ctx.editor.command.executeRestoreRange(located())).toThrow(
      /requires Intl.Segmenter/
    )
    expect(ctx.editor.command.getRange()).toMatchObject({
      startIndex: -1,
      endIndex: -1
    })
  })

  it('rejects absent layout positions rather than silently returning partial boxes or installing an unusable range', () => {
    const fixture = engine({ main: [{ value: 'Body' }] })
    try {
      const { command, draw } = fixture
      draw.getPosition().setPositionList([])
      const range: ILocatedRange = {
        zone: EditorZone.MAIN,
        tablePath: [],
        startIndex: 0,
        endIndex: 1,
        sourceText: ZERO + 'Body'
      }
      expect(() => command.getLocatedElementRects(range)).toThrow(/geometry/)
      expect(() => command.executeRestoreRange(range)).toThrow(/geometry/)
      expect(draw.getHistoryManager().isStackEmpty()).toBe(true)
      expect(command.getRange()).toMatchObject({ startIndex: -1, endIndex: -1 })
    } finally {
      fixture.destroy()
    }
  })

  it('restores a later-page caret before the following header selection', () => {
    const fixture = engine(
      {
        main: [
          { value: 'First' },
          {
            type: ElementType.PAGE_BREAK,
            value: '\n',
            paperDirection: PaperDirection.HORIZONTAL
          },
          { value: 'Second' }
        ],
        header: [{ value: 'Header' }]
      },
      { header: { disabled: false, editable: true } }
    )
    try {
      const { command, draw } = fixture
      const main = draw.getOriginalMainElementList()
      const last = main.length - 1
      expect(
        draw.getPosition().getOriginalMainPositionList()[last]?.pageNo
      ).toBe(1)
      command.executeRestoreRange({
        zone: EditorZone.MAIN,
        tablePath: [],
        startIndex: last,
        endIndex: last,
        sourceText: main.map(item => item.value).join('')
      })
      expect(draw.getPageNo()).toBe(1)
      const header: ILocatedRange = {
        zone: EditorZone.HEADER,
        tablePath: [],
        startIndex: 0,
        endIndex: 1,
        sourceText: ZERO + 'Header'
      }
      expect(
        command.getLocatedElementRects(header).every(rect => rect.pageNo === 1)
      ).toBe(true)
      command.executeRestoreRange(header)
      expect(draw.getPageDirection(draw.getPageNo())).toBe(
        PaperDirection.HORIZONTAL
      )
    } finally {
      fixture.destroy()
    }
  })

  it('emits a range event between nested controls while leaving an identical restoration unchanged', () => {
    const data = nested()
    const inner = data[1]?.trList?.[0]?.tdList[0]?.value[0]
    const cells = inner?.trList?.[0]?.tdList
    if (!cells) throw new Error('Missing independent nested control fixture')
    for (const cell of cells)
      cell.value = [
        {
          type: ElementType.CONTROL,
          value: '',
          control: {
            type: ControlType.TEXT,
            prefix: '[',
            postfix: ']',
            value: [{ value: 'AB' }]
          }
        }
      ]
    const fixture = engine({ main: data })
    try {
      const { command, draw } = fixture
      const before = command.getValue().data
      let events = 0
      draw.getEventBus().on('rangeChange', () => {
        events++
      })
      const control = (cellId: string): ILocatedRange => ({
        ...located(cellId),
        startIndex: 2,
        endIndex: 2,
        sourceText: ZERO + '[AB]'
      })
      command.executeRestoreRange(control('left'))
      expect(events).toBe(1)
      command.executeRestoreRange(control('right'))
      expect(events).toBe(2)
      command.executeRestoreRange(control('right'))
      expect(events).toBe(2)
      expect(command.getValue().data).toEqual(before)
    } finally {
      fixture.destroy()
    }
  })

  it('does not expose nested story geometry from a different page direction', () => {
    const fixture = engine(
      {
        main: [
          { value: 'First' },
          {
            type: ElementType.PAGE_BREAK,
            value: '\n',
            paperDirection: PaperDirection.HORIZONTAL
          },
          { value: 'Second' }
        ],
        footer: nested()
      },
      {
        footer: {
          disabled: false,
          editable: true,
          maxHeightRadio: MaxHeightRatio.HALF
        }
      }
    )
    try {
      const { command, draw } = fixture
      draw.setPageNo(0)
      const tableIndex = draw
        .getFooterElementList()
        .findIndex(item => item.id === 'outer')
      const root = draw.getFooter().getPositionList(PaperDirection.VERTICAL)[
        tableIndex
      ]
      expect(root).toBeDefined()
      const range = { ...located(), zone: EditorZone.FOOTER }
      const before = command.getValue().data
      expect(() => command.getLocatedElementRects(range)).toThrow(
        /table paths in header\/footer/
      )
      expect(() => command.executeRestoreRange(range)).toThrow(
        /table paths in header\/footer/
      )
      expect(command.getValue().data).toEqual(before)
      expect(draw.getPageNo()).toBe(0)
      expect(draw.getHistoryManager().isStackEmpty()).toBe(true)
    } finally {
      fixture.destroy()
    }
  })

  it('rejects floated objects instead of returning their neighboring text box', () => {
    const fixture = engine({
      main: [
        { value: 'A' },
        {
          type: ElementType.IMAGE,
          value: 'data:image/png;base64,iVBORw0KGgo=',
          width: 40,
          height: 40,
          imgDisplay: ImageDisplay.FLOAT_TOP,
          imgFloatPosition: { x: 300, y: 500, pageNo: 0 }
        }
      ]
    })
    try {
      const { draw, command } = fixture
      const main = draw.getOriginalMainElementList()
      const index = main.findIndex(item => item.type === ElementType.IMAGE)
      const range: ILocatedRange = {
        zone: EditorZone.MAIN,
        tablePath: [],
        startIndex: index - 1,
        endIndex: index,
        sourceText: main.map(item => item.value).join('')
      }
      const before = command.getValue().data
      expect(() => command.getLocatedElementRects(range)).toThrow(/floating/)
      expect(() => command.executeRestoreRange(range)).toThrow(/floating/)
      expect(command.getValue().data).toEqual(before)
      expect(draw.getHistoryManager().isStackEmpty()).toBe(true)
    } finally {
      fixture.destroy()
    }
  })

  it('targets explicit story pages and rejects invalid or disabled pages before mutation', () => {
    const fixture = engine(
      {
        main: [
          { value: 'First' },
          {
            type: ElementType.PAGE_BREAK,
            value: '\n',
            paperDirection: PaperDirection.HORIZONTAL
          },
          { value: 'Second' }
        ],
        header: [{ value: 'Header' }],
        footer: [{ value: 'Footer' }]
      },
      {
        header: { disabled: false, editable: true, disabledPages: [1] },
        footer: { disabled: false, editable: true }
      }
    )
    try {
      const { command, draw } = fixture
      const footer: ILocatedRange = {
        zone: EditorZone.FOOTER,
        pageNo: 1,
        tablePath: [],
        startIndex: 0,
        endIndex: 1,
        sourceText: ZERO + 'Footer'
      }
      const rects = command.getLocatedElementRects(footer)
      expect(rects.every(rect => rect.pageNo === 1)).toBe(true)
      expect(draw.getPageNo()).toBe(0)
      command.executeRestoreRange(footer)
      expect(draw.getPageNo()).toBe(1)
      const before = command.getValue().data
      const range = { ...command.getRange() }
      for (const bad of [
        { ...footer, pageNo: -1 },
        { ...footer, pageNo: 99 },
        { ...footer, pageNo: 0.5 },
        { ...footer, pageNo: NaN },
        { ...footer, zone: EditorZone.HEADER, sourceText: ZERO + 'Header' },
        { ...footer, zone: EditorZone.MAIN }
      ]) {
        expect(() => command.executeRestoreRange(bad)).toThrow()
        expect(() => command.getLocatedElementRects(bad)).toThrow()
        expect(command.getRange()).toEqual(range)
        expect(command.getValue().data).toEqual(before)
        expect(draw.getPageNo()).toBe(1)
      }
    } finally {
      fixture.destroy()
    }
  })

  it('checks ambiguous owning identities without choosing the first table, row or cell', () => {
    for (const kind of ['table', 'row', 'cell']) {
      const data = nested()
      const table = data.find(item => item.id === 'outer')
      const row = table?.trList?.[0]
      const cell = row?.tdList[0]
      if (!table || !row || !cell)
        throw new Error('Missing independent table fixture')
      if (kind === 'table') data.push(structuredClone(table))
      else if (kind === 'row') table.trList?.push(structuredClone(row))
      else {
        row.tdList.push(structuredClone(cell))
        table.colgroup?.push({ width: 400 })
      }
      ctx = createTestEditor({ data })
      const before = ctx.editor.command.getValue().data
      expect(() => ctx.editor.command.executeRestoreRange(located())).toThrow()
      expect(ctx.editor.command.getValue().data).toEqual(before)
      expect(ctx.editor.command.getRange()).toMatchObject({
        startIndex: -1,
        endIndex: -1
      })
      ctx.destroy()
    }
  })

  it('allows visible noneditable story geometry while refusing selection changes', () => {
    ctx = createTestEditor({
      data: { main: nested(), header: [{ value: 'Header' }] },
      options: { header: { disabled: false, editable: false } }
    })
    const range: ILocatedRange = {
      zone: EditorZone.HEADER,
      tablePath: [],
      startIndex: 0,
      endIndex: 1,
      sourceText: ZERO + 'Header'
    }
    expect(ctx.editor.command.getLocatedElementRects(range).length).toBe(2)
    expect(() => ctx.editor.command.executeRestoreRange(range)).toThrow(
      /unavailable/
    )
    expect(ctx.editor.command.getRange()).toMatchObject({
      startIndex: -1,
      endIndex: -1
    })
  })

  it('preserves pending caret formatting when restoring the same location', () => {
    const fixture = engine({ main: [{ value: 'Body' }] })
    try {
      const { command, draw } = fixture
      const range: ILocatedRange = {
        zone: EditorZone.MAIN,
        tablePath: [],
        startIndex: 1,
        endIndex: 1,
        sourceText: ZERO + 'Body'
      }
      command.executeRestoreRange(range)
      command.executeBold()
      expect(draw.getRange().getDefaultStyle()?.bold).toBe(true)
      command.executeRestoreRange(range)
      expect(draw.getRange().getDefaultStyle()?.bold).toBe(true)
    } finally {
      fixture.destroy()
    }
  })

  it('preserves interception and rejects oversized context without creating undo state', () => {
    const fixture = engine({ main: [{ value: 'Body' }] })
    try {
      const { command, draw } = fixture
      const range: ILocatedRange = {
        zone: EditorZone.MAIN,
        tablePath: [],
        startIndex: 0,
        endIndex: 1,
        sourceText: ZERO + 'Body'
      }
      const intercepted = vi.fn(() => {
        throw new Error('Denied by interceptor')
      })
      command.setInterceptor(intercepted)
      expect(command.getLocatedElementRects(range).length).toBe(2)
      expect(intercepted).not.toHaveBeenCalled()
      expect(() => command.executeRestoreRange(range)).toThrow(/interceptor/)
      expect(command.getRange()).toMatchObject({ startIndex: -1, endIndex: -1 })
      command.setInterceptor(undefined)
      expect(() =>
        command.executeRestoreRange({
          ...range,
          sourceText: 'x'.repeat(4194305)
        })
      ).toThrow(/bound/)
      expect(draw.getHistoryManager().isStackEmpty()).toBe(true)
    } finally {
      fixture.destroy()
    }
  })

  it('rejects split surrogate, flag and ZWJ clusters across formatted elements', () => {
    for (const [left, right] of [
      ['\ud83d', '\ude14'],
      ['🇺', '🇸'],
      ['👩\u200d', '👩\u200d👧\u200d👦']
    ] satisfies Array<[string, string]>) {
      ctx = createTestEditor({
        data: [
          { value: left, bold: true },
          { value: right, italic: true }
        ]
      })
      const range: ILocatedRange = {
        zone: EditorZone.MAIN,
        tablePath: [],
        startIndex: 0,
        endIndex: 1,
        sourceText: ZERO + left + right
      }
      expect(() => ctx.editor.command.executeRestoreRange(range)).toThrow(
        /Unicode/
      )
      ctx.editor.command.executeRestoreRange({ ...range, endIndex: 2 })
      expect(ctx.editor.command.getRangeContext()?.selectionText).toContain(
        left + right
      )
      ctx.destroy()
    }
  })

  it('can restore main content after shrinking leaves an obsolete current page', () => {
    const fixture = engine({
      main: [
        { value: 'First' },
        { type: ElementType.PAGE_BREAK, value: '\n' },
        { value: 'Second' }
      ]
    })
    try {
      const { command, draw } = fixture
      draw.setPageNo(1)
      command.executeSetValue({ main: [{ value: 'Body' }] })
      expect(draw.getPageList().length).toBe(1)
      // Reproduce a retained viewport page that the engine has not clamped.
      draw.setPageNo(1)
      const range: ILocatedRange = {
        zone: EditorZone.MAIN,
        tablePath: [],
        startIndex: 1,
        endIndex: 1,
        sourceText: ZERO + 'Body'
      }
      command.executeRestoreRange(range)
      expect(draw.getPageNo()).toBe(0)
      expect(command.getRangeContext()?.isCollapsed).toBe(true)
    } finally {
      fixture.destroy()
    }
  })
})
