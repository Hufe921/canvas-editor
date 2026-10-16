import { describe, expect, it, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
  ElementType,
  TextEngineMode,
  TextDirection
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'

describe('DEFER-008 table-cell Area', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  function buildTable(
    tdValue: any[],
    direction: TextDirection = TextDirection.LTR
  ) {
    const main: any[] = [
      { value: ZERO },
      {
        type: ElementType.TABLE,
        value: '',
        direction,
        width: 300,
        colgroup: [{ width: 150 }, { width: 150 }],
        trList: [
          {
            height: 40,
            tdList: [
              { colspan: 1, rowspan: 1, value: tdValue },
              { colspan: 1, rowspan: 1, value: [{ value: '\n' }] }
            ]
          }
        ]
      },
      { value: '\n' }
    ]
    return main
  }

  async function setup(main: any[]) {
    const options = mergeOption({
      textEngine: TextEngineMode.HARFBUZZ,
      defaultDirection: TextDirection.AUTO,
      fonts: []
    })
    formatElementList(main, { editorOptions: options, isForceCompensation: true })
    container = document.createElement('div')
    document.body.appendChild(container)
    draw = new Draw(
      container,
      options,
      { main, header: [{ value: '\n' }], footer: [{ value: '\n' }] },
      new Listener(),
      new EventBus(),
      new Override()
    )
    await draw.getLayoutHostAdapter().ensureReady()
    draw.render({ isSubmitHistory: false, isSetCursor: false, isLazy: false })
    return draw
  }

  function areaRect(fillSpy: ReturnType<typeof vi.spyOn>): string | null {
    const rects = fillSpy.mock.calls.map((c: unknown[]) =>
      [c[0], c[1], c[2], c[3]].map(v => Math.round(v as number)).join(',')
    )
    return rects[0] || null
  }

  it('renders the area background spanning the td content box', async () => {
    const tdValue = [
      { value: ZERO },
      { value: '区', areaId: 'a1', area: { backgroundColor: '#FF0000' } },
      { value: '域', areaId: 'a1', area: { backgroundColor: '#FF0000' } },
      { value: '\n' }
    ]
    const d = await setup(buildTable(tdValue))
    const fillSpy = vi
      .spyOn(CanvasRenderingContext2D.prototype, 'fillRect')
      .mockImplementation(() => {})
    const ctx = document.createElement('canvas').getContext('2d')!
    d.getArea().render(ctx, 0)
    const rect = areaRect(fillSpy)
    expect(rect).toBeTruthy()
    // x/width = td content box; y/height = area rows
    const [x, , w, h] = rect!.split(',').map(Number)
    expect(w).toBeGreaterThan(100)
    expect(h).toBeGreaterThan(10)
    const table = d
      .getOriginalElementList()
      .find(el => el.type === ElementType.TABLE)!
    const td = table.trList![0].tdList[0]
    const tablePos = d.getPosition().getOriginalMainPositionList()[
      d.getOriginalElementList().indexOf(table)
    ]
    const padding = d.getTdPadding()
    expect(x).toBe(
      Math.round(tablePos.coordinate.leftTop[0] + td.x! + padding[3])
    )
  })

  it('mirrors the area background into the right td for an rtl table', async () => {
    const tdValue = [
      { value: ZERO },
      { value: 'نص', areaId: 'a1', area: { backgroundColor: '#FF0000' }, direction: TextDirection.RTL },
      { value: '\n' }
    ]
    const d = await setup(
      buildTable(tdValue, TextDirection.RTL)
    )
    const fillSpy = vi
      .spyOn(CanvasRenderingContext2D.prototype, 'fillRect')
      .mockImplementation(() => {})
    const ctx = document.createElement('canvas').getContext('2d')!
    d.getArea().render(ctx, 0)
    const rect = areaRect(fillSpy)
    expect(rect).toBeTruthy()
    const table = d
      .getOriginalElementList()
      .find(el => el.type === ElementType.TABLE)!
    const td = table.trList![0].tdList[0]
    // mirrored: the first logical cell sits on the right (larger x)
    expect(td.x).toBe(150)
    const [x] = rect!.split(',').map(Number)
    const tablePos = d.getPosition().getOriginalMainPositionList()[
      d.getOriginalElementList().indexOf(table)
    ]
    const padding = d.getTdPadding()
    expect(x).toBe(
      Math.round(tablePos.coordinate.leftTop[0] + td.x! + padding[3])
    )
  })

  it('hit-tests an area element inside a td and activates the area', async () => {
    const tdValue = [
      { value: ZERO },
      { value: '区', areaId: 'a1', area: { backgroundColor: '#FF0000' } },
      { value: '域', areaId: 'a1', area: { backgroundColor: '#FF0000' } },
      { value: '\n' }
    ]
    const d = await setup(buildTable(tdValue))
    const table = d
      .getOriginalElementList()
      .find(el => el.type === ElementType.TABLE)!
    const td = table.trList![0].tdList[0]
    const areaIdx = td.value.findIndex((el: any) => el.areaId === 'a1')
    const pos = td.positionList![areaIdx]

    const hit = d.getPosition().getPositionByXY({
      x: (pos.coordinate.leftTop[0] + pos.coordinate.rightTop[0]) / 2,
      y: (pos.coordinate.leftTop[1] + pos.coordinate.leftBottom[1]) / 2,
      pageNo: 0
    })
    expect(hit.isTable).toBe(true)
    expect(hit.tdIndex).toBe(0)
    expect(td.value[hit.index].areaId).toBe('a1')

    // commit the hit like the mouse handler
    d.getPosition().setPositionContext({
      isTable: true,
      index: d.getOriginalElementList().indexOf(table),
      trIndex: hit.trIndex,
      tdIndex: hit.tdIndex,
      tdId: hit.tdId,
      trId: hit.trId,
      tableId: hit.tableId
    })
    d.getRange().setRange(hit.index, hit.index)
    d.render({
      curIndex: hit.index,
      isCompute: false,
      isSetCursor: true,
      isSubmitHistory: false
    })
    expect(d.getArea().getActiveAreaId()).toBe('a1')
  })
})
