import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
  ControlType,
  ElementType,
  TextDirection,
  TextEngineMode
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'

function stubMeasureText() {
  vi.spyOn(CanvasRenderingContext2D.prototype, 'measureText').mockImplementation(
    function (text: string) {
      return {
        width: [...text].length * 16,
        actualBoundingBoxAscent: 12.8,
        actualBoundingBoxDescent: 3.2,
        fontBoundingBoxAscent: 12.8,
        fontBoundingBoxDescent: 3.2
      } as TextMetrics
    }
  )
}

function createDraw(main: IElement[]) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    defaultDirection: TextDirection.AUTO,
    textEngine: TextEngineMode.HARFBUZZ,
    header: { disabled: true },
    footer: { disabled: true }
  })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const draw = new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  return { draw, container }
}

function getControlSearch(draw: Draw) {
  return (draw.getControl() as any).controlSearch
}

describe('ControlSearch RTL and nested controls', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined

  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  it('uses the text-engine visual rectangle for RTL matches', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      {
        type: ElementType.CONTROL,
        value: '',
        direction: TextDirection.RTL,
        control: {
          type: ControlType.TEXT,
          value: [{ value: 'موافق' }],
          placeholder: 'قيمة'
        }
      },
      { value: '\n', direction: TextDirection.RTL }
    ]
    ;({ draw, container } = createDraw(main))
    await draw.getLayoutHostAdapter().ensureReady()

    const control = draw
      .getOriginalElementList()
      .find(element => element.control?.placeholder === 'قيمة')!
    const rectSpy = vi.spyOn(draw, 'getEngineHighlightRectByIndex')
    draw.getControl().setHighlightList([
      { id: control.controlId, ruleList: [{ keyword: 'وافق' }] }
    ])
    expect(control.controlId).toBeDefined()
    expect(getControlSearch(draw).getHighlightList()).toHaveLength(1)
    getControlSearch(draw).computeHighlightList()
    expect(getControlSearch(draw).getHighlightMatchResult().length).toBeGreaterThan(
      0
    )
    draw.render({ isSubmitHistory: false, isSetCursor: false, isLazy: false })

    expect(rectSpy).toHaveBeenCalled()
    const rect = rectSpy.mock.results[0].value
    expect(rect).toBeDefined()
    expect(rect!.width).toBeGreaterThan(0)
    expect(rect!.x).toBeGreaterThanOrEqual(0)
  })

  it('uses the cell text-engine rows for RTL table control matches', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      {
        type: ElementType.TABLE,
        value: '',
        direction: TextDirection.RTL,
        colgroup: [{ width: 500 }],
        trList: [
          {
            height: 100,
            tdList: [
              {
                colspan: 1,
                rowspan: 1,
                value: [
                  { value: ZERO },
                  {
                    type: ElementType.CONTROL,
                    value: '',
                    direction: TextDirection.RTL,
                    control: {
                      type: ControlType.TEXT,
                      value: [{ value: 'موافق' }],
                      placeholder: 'جدول'
                    }
                  },
                  { value: '\n', direction: TextDirection.RTL }
                ]
              }
            ]
          }
        ]
      },
      { value: '\n' }
    ]
    ;({ draw, container } = createDraw(main))
    await draw.getLayoutHostAdapter().ensureReady()

    const table = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    const td = table.trList![0].tdList[0]
    const control = td.value.find(
      element => element.control?.placeholder === 'جدول'
    )!
    const rectSpy = vi.spyOn(draw, 'getEngineHighlightRectByIndex')
    draw.getControl().setHighlightList([
      { id: control.controlId, ruleList: [{ keyword: 'وافق' }] }
    ])
    expect(control.controlId).toBeDefined()
    expect(getControlSearch(draw).getHighlightList()).toHaveLength(1)
    getControlSearch(draw).computeHighlightList()
    expect(getControlSearch(draw).getHighlightMatchResult().length).toBeGreaterThan(
      0
    )
    draw.render({ isSubmitHistory: false, isSetCursor: false, isLazy: false })

    expect(rectSpy).toHaveBeenCalled()
    expect(rectSpy.mock.calls[0][2]).toBe(td.rowList)
    expect(rectSpy.mock.results[0].value).toBeDefined()
  })

  it('resolves visual rectangles for wrapped mixed-direction matches', async () => {
    stubMeasureText()
    const value =
      'نص عربي طويل لاختبار التفاف البحث RTL mixed text '.repeat(24)
    const main: IElement[] = [
      { value: ZERO },
      {
        type: ElementType.CONTROL,
        value: '',
        direction: TextDirection.AUTO,
        control: {
          type: ControlType.TEXT,
          value: [{ value }],
          placeholder: '混排'
        }
      },
      { value: '\n' }
    ]
    ;({ draw, container } = createDraw(main))
    await draw.getLayoutHostAdapter().ensureReady()

    const control = draw
      .getOriginalElementList()
      .find(element => element.control?.placeholder === '混排')!
    const rectSpy = vi.spyOn(draw, 'getEngineHighlightRectByIndex')
    draw.getControl().setHighlightList([
      { id: control.controlId, ruleList: [{ keyword: 'طويل' }] }
    ])
    draw.render({ isSubmitHistory: false, isSetCursor: false, isLazy: false })

    const matches = getControlSearch(draw).getHighlightMatchResult()
    expect(matches.length).toBeGreaterThan(0)
    expect(rectSpy).toHaveBeenCalledTimes(matches.length)
    expect(rectSpy.mock.results.every(result => result.value)).toBe(true)
    expect(draw.getOriginalRowList().filter(row => row.engineLine).length).toBeGreaterThan(
      1
    )
  })

  it('keeps outer and inner controls as separate search scopes', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.TEXT,
          value: [
            { value: 'A' },
            {
              type: ElementType.CONTROL,
              value: '',
              control: {
                type: ControlType.TEXT,
                value: [{ value: 'X' }],
                placeholder: '内层'
              }
            },
            { value: 'B' }
          ],
          placeholder: '外层'
        }
      },
      { value: '\n' }
    ]
    ;({ draw, container } = createDraw(main))
    await draw.getLayoutHostAdapter().ensureReady()

    const elements = draw.getOriginalElementList()
    const outerId = elements.find(
      element => element.control?.placeholder === '外层'
    )!.controlId
    const innerId = elements.find(
      element => element.control?.placeholder === '内层'
    )!.controlId

    draw.getControl().setHighlightList([
      { id: outerId, ruleList: [{ keyword: 'X' }] }
    ])
    draw.render({ isSubmitHistory: false, isSetCursor: false })
    expect(getControlSearch(draw).getHighlightMatchResult()).toHaveLength(0)

    draw.getControl().setHighlightList([
      { id: innerId, ruleList: [{ keyword: 'X' }] }
    ])
    draw.render({ isSubmitHistory: false, isSetCursor: false })
    const matches = getControlSearch(draw).getHighlightMatchResult()
    expect(matches).toHaveLength(1)
    expect(elements[matches[0].index].controlId).toBe(innerId)
  })
})
