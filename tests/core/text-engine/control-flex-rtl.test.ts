import { describe, expect, it, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
  ControlComponent,
  ControlType,
  ElementType,
  FlexDirection,
  TextDirection,
  TextEngineMode
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'

function stubMeasureText() {
  vi.spyOn(CanvasRenderingContext2D.prototype, 'measureText').mockImplementation(
    function (text: string) {
      let width = 0
      for (const ch of text) {
        const cp = ch.codePointAt(0)!
        if (
          (cp >= 0x200b && cp <= 0x200d) ||
          cp === 0xfeff ||
          cp === 0x2060 ||
          (cp >= 0x2066 && cp <= 0x2069)
        ) {
          continue
        }
        width += cp > 0xff ? 16 : 8
      }
      return {
        width,
        actualBoundingBoxAscent: 12.8,
        actualBoundingBoxDescent: 3.2,
        fontBoundingBoxAscent: 12.8,
        fontBoundingBoxDescent: 3.2
      } as TextMetrics
    }
  )
}

function createDraw(main: IElement[], opts: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    defaultDirection: TextDirection.AUTO,
    textEngine: TextEngineMode.HARFBUZZ,
    header: { disabled: true },
    footer: { disabled: true },
    ...opts
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

describe('DEFER-006 checkbox/radio flexDirection ROW RTL', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  it('LTR ROW: checkbox box sits on the left of its value text', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      {
        type: ElementType.CONTROL,
        value: '',
        direction: TextDirection.LTR,
        control: {
          type: ControlType.CHECKBOX,
          value: null,
          code: '1',
          flexDirection: FlexDirection.ROW,
          valueSets: [{ value: 'option', code: '1' }]
        }
      },
      { value: '\n', direction: TextDirection.LTR }
    ]
    ;({ draw, container } = createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const row = rows.find(r =>
      r.elementList.some(
        (el: IElement) =>
          el.controlComponent === ControlComponent.CHECKBOX
      )
    )!
    const box = row.elementList.find(
      (el: IElement) => el.controlComponent === ControlComponent.CHECKBOX
    )!
    const firstValue = row.elementList.find(
      (el: IElement) => el.controlComponent === ControlComponent.VALUE
    )!
    // LTR: 盒在值文本左侧（box visualLeft 更小）
    expect((box.visualLeft || 0) + (box.metrics?.width || 0)).toBeLessThanOrEqual(
      (firstValue.visualLeft || 0) + 1
    )
  })

  it('RTL ROW: checkbox box sits on the right of its value text', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      {
        type: ElementType.CONTROL,
        value: '',
        direction: TextDirection.RTL,
        control: {
          type: ControlType.CHECKBOX,
          value: null,
          code: '1',
          flexDirection: FlexDirection.ROW,
          valueSets: [{ value: 'موافق', code: '1' }]
        }
      },
      { value: '\n', direction: TextDirection.RTL }
    ]
    ;({ draw, container } = createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const row = rows.find(r =>
      r.elementList.some(
        (el: IElement) =>
          el.controlComponent === ControlComponent.CHECKBOX
      )
    )!
    const box = row.elementList.find(
      (el: IElement) => el.controlComponent === ControlComponent.CHECKBOX
    )!
    const lastValue = row.elementList
      .filter((el: IElement) => el.controlComponent === ControlComponent.VALUE)
      .pop()!
    // RTL：盒在值文本右侧（box visualLeft 更大）
    expect(box.visualLeft || 0).toBeGreaterThan(
      (lastValue.visualLeft || 0) + (lastValue.metrics?.width || 0) - 1
    )
  })
})
