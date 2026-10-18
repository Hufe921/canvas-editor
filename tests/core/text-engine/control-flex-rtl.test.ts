import { createTestDraw } from '../../factories/draw'
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
  TextDirection
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'

async function createDraw(
  main: IElement[],
  opts: Record<string, unknown> = {}
) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    defaultDirection: TextDirection.AUTO,

    header: { disabled: true },
    footer: { disabled: true },
    ...opts
  })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const draw = await createTestDraw(
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
    ;({ draw, container } = await createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const row = rows.find(r =>
      r.elementList.some(
        (el: IElement) => el.controlComponent === ControlComponent.CHECKBOX
      )
    )!
    const box = row.elementList.find(
      (el: IElement) => el.controlComponent === ControlComponent.CHECKBOX
    )!
    const firstValue = row.elementList.find(
      (el: IElement) => el.controlComponent === ControlComponent.VALUE
    )!
    // LTR: 盒在值文本左侧（box visualLeft 更小）
    expect(
      (box.visualLeft || 0) + (box.metrics?.width || 0)
    ).toBeLessThanOrEqual((firstValue.visualLeft || 0) + 1)
  })

  it('RTL ROW: checkbox box sits on the right of its value text', async () => {
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
    ;({ draw, container } = await createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const row = rows.find(r =>
      r.elementList.some(
        (el: IElement) => el.controlComponent === ControlComponent.CHECKBOX
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
