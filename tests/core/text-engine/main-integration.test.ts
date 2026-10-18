import { createTestDraw } from '../../factories/draw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { Highlight } from '@/editor/core/draw/richtext/Highlight'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { TextDirection } from '@/editor'
import type { IElement } from '@/editor/interface/Element'

const draws: Draw[] = []
afterEach(() => {
  draws.forEach(draw => draw.destroy())
  draws.length = 0
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

async function setup(main: IElement[], scale = 1) {
  const options = mergeOption({
    scale,
    width: 400,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    lab: { incrementalCompute: true }
  })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const draw = await createTestDraw(
    container,
    options,
    { main, header: [], footer: [] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  await draw.getLayoutHostAdapter().ensureReady()
  draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
  return draw
}

describe.each([TextDirection.LTR, TextDirection.RTL])(
  'main integration with %s paragraphs',
  direction => {
    function content(spaced: boolean): IElement[] {
      return [
        {
          value: 'alpha',
          direction,
          spacingAfter: spaced ? 10 : 0,
          highlight: '#ff0'
        },
        { value: '\n', spacingBefore: spaced ? 20 : 0 },
        { value: 'beta', direction, spacingAfter: spaced ? 30 : 0 },
        { value: '\n' }
      ]
    }

    it('applies scaled spacing without extending highlights', async () => {
      const highlight = vi.spyOn(Highlight.prototype, 'recordFillInfo')
      const base = await setup(content(false), 1.5)
      const baseHeight = highlight.mock.calls[0][4]
      highlight.mockClear()
      const spaced = await setup(content(true), 1.5)
      const baseRows = base.getRowList()
      const rows = spaced.getRowList()
      expect(rows[0].height).toBeCloseTo(baseRows[0].height + 15)
      expect(rows[1].offsetY).toBeCloseTo(30)
      expect(rows[1].height).toBeCloseTo(baseRows[1].height + 45)
      expect(highlight.mock.calls[0][4]).toBeCloseTo(baseHeight!)
      const position = spaced.getPosition()
      const beta = position.getPositionList().find(p => p.value === 'b')!
      expect(
        position.getPositionByXY({
          x: beta.coordinate.leftTop[0] + 1,
          y: beta.coordinate.leftTop[1] - 15
        }).index
      ).toBe(rows[1].startIndex)
    })

    it('keeps complete shaped layout after editing with incremental enabled', async () => {
      const draw = await setup(content(true))
      const elements = draw.getOriginalMainElementList()
      draw.spliceElementList(elements, 2, 0, [{ value: 'Z', direction }])
      draw.render({ isSetCursor: false, isSubmitHistory: false })
      const snapshot = () =>
        draw.getRowList().map(row => ({
          startIndex: row.startIndex,
          height: row.height,
          offsetY: row.offsetY,
          values: row.elementList.map(el => el.value)
        }))
      const actual = snapshot()
      draw.getOptions().lab.incrementalCompute = false
      draw.render({ isSetCursor: false, isSubmitHistory: false })
      expect(snapshot()).toEqual(actual)
      expect(actual.flatMap(row => row.values)).toContain('Z')
    })

    it('preserves the selection anchor when shift-clicking shaped text', async () => {
      const draw = await setup(content(false))
      const position = draw.getPosition()
      const positions = position.getPositionList()
      draw.getRange().setRange(1, 1)
      position.setCursorPosition(positions[1])
      const target = positions[4]
      const evt = new MouseEvent('mousedown', {
        bubbles: true,
        shiftKey: true
      })
      Object.defineProperties(evt, {
        offsetX: { value: target.coordinate.rightTop[0] - 0.1 },
        offsetY: { value: target.coordinate.leftTop[1] + 1 }
      })
      draw.getPageList()[0].dispatchEvent(evt)
      expect(draw.getRange().getRange().startIndex).toBe(1)
      expect(draw.getRange().getRange().endIndex).toBeGreaterThan(1)
      expect(position.getCursorPosition()?.index).toBe(1)
    })
  }
)
