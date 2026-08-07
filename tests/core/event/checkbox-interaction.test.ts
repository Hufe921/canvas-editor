import { describe, expect, it, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ControlType, ElementType } from '@/editor'
import { ControlComponent } from '@/editor/dataset/enum/Control'

function withOffset(evt: MouseEvent, x: number, y: number) {
  Object.defineProperty(evt, 'offsetX', { value: x, configurable: true })
  Object.defineProperty(evt, 'offsetY', { value: y, configurable: true })
  return evt
}

describe('checkbox interaction', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  function setup() {
    const main: any[] = [
      { value: '\u200B' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'agree',
          type: ControlType.CHECKBOX,
          code: '1',
          value: '',
          valueSets: [{ value: '同意', code: '1' }]
        }
      },
      { value: '\n' }
    ]
    const options = mergeOption({
      textEngine: 'legacy' as any,
      margins: [20, 20, 20, 20],
      header: { disabled: true },
      footer: { disabled: true }
    })
    formatElementList(main, {
      editorOptions: options,
      isForceCompensation: true
    })
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
    draw.render({ isSubmitHistory: false, isSetCursor: false, isLazy: false })
    return draw
  }

  function boxPosition() {
    const elList = draw!.getOriginalElementList()
    const posList = draw!.getPosition().getOriginalPositionList()
    const idx = elList.findIndex(
      (el: any) => el.controlComponent === ControlComponent.CHECKBOX
    )
    const pos = posList[idx]
    return {
      x: (pos.coordinate.leftTop[0] + pos.coordinate.rightTop[0]) / 2,
      y: (pos.coordinate.leftTop[1] + pos.coordinate.leftBottom[1]) / 2
    }
  }

  it('does not draw the caret when toggling a checkbox', () => {
    setup()
    const { x, y } = boxPosition()
    const canvas = draw!.getPageList()[0]
    canvas.dispatchEvent(
      withOffset(new MouseEvent('mousedown', { bubbles: true }), x, y)
    )
    expect(draw!.getCursor().getCursorDom().style.display).toBe('none')
  })

  it('shows pointer cursor when hovering a checkbox', () => {
    setup()
    const { x, y } = boxPosition()
    const canvas = draw!.getPageList()[0]
    canvas.dispatchEvent(
      withOffset(new MouseEvent('mousemove', { bubbles: true }), x, y)
    )
    expect(canvas.style.cursor).toBe('pointer')
  })

  it('keeps text cursor over normal text', () => {
    setup()
    const elList = draw!.getOriginalElementList()
    const posList = draw!.getPosition().getOriginalPositionList()
    const valueIndex = elList.findIndex(
      (el: any) => el.controlComponent === ControlComponent.VALUE
    )
    const pos = posList[valueIndex]
    const x = pos.coordinate.leftTop[0] + 1
    const y = pos.coordinate.leftTop[1] + 1
    const canvas = draw!.getPageList()[0]
    canvas.dispatchEvent(
      withOffset(new MouseEvent('mousemove', { bubbles: true }), x, y)
    )
    expect(canvas.style.cursor).toBe('text')
  })
})
