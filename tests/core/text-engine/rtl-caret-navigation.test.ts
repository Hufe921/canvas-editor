import { describe, expect, it, vi, afterEach } from 'vitest'
import { buildArabicEmrElementList } from '@/../src/mock-ar-emr'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { TextEngineMode, TextDirection } from '@/editor'

describe('RTL caret navigation on the BMI line', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  async function setup() {
    const main = buildArabicEmrElementList('')
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

  function setCaret(d: Draw, index: number) {
    d.getRange().setRange(index, index)
    d.render({
      curIndex: index,
      isCompute: false,
      isSetCursor: true,
      isSubmitHistory: false
    })
  }

  function pressKey(d: Draw, key: string) {
    d.getCanvasEvent().keydown(
      new KeyboardEvent('keydown', { key, bubbles: true })
    )
    return d.getRange().getRange().startIndex
  }

  it('arrow navigation is monotonic and never gets stuck at isolate boundaries', async () => {
    const d = await setup()
    const row = d
      .getOriginalRowList()
      .find(r => r.elementList.some(el => el.control?.conceptId === 'height'))!
    const adapter = d.getLayoutHostAdapter()
    const hitTest = (adapter as any).hitTest
    const startIndex = Math.max(
      ...row.elementList
        .map(el => el.sourceIndex)
        .filter((i): i is number => i !== undefined)
    )

    // walk right across the whole row; x must be non-decreasing and every
    // step must actually move (no phantom isolate slots, no stuck presses)
    let prevX = -Infinity
    let index = startIndex
    let visited = 0
    for (let step = 0; step < 200; step++) {
      const found = adapter.findLayoutByElementIndex(index, 'main')
      if (found) {
        const metrics = hitTest.caretMetrics(found.layout, index)
        if (metrics) {
          expect(metrics.x).toBeGreaterThanOrEqual(prevX)
          prevX = metrics.x
        }
      }

      const next = adapter.visualNeighbor(index, 1, 'main')
      if (next === null || next === index) break
      // never stuck: consecutive indexes must differ
      expect(next).not.toBe(index)
      index = next
      visited++
    }
    expect(visited).toBeGreaterThan(30)
  })

  it('right arrow advances in reading order on RTL rows (left arrow goes back)', async () => {
    const d = await setup()
    const elements = d.getOriginalElementList()
    const bmiPrefix = elements.findIndex(
      el =>
        el.control?.conceptId === 'bmi' &&
        (el as any).controlComponent === 'prefix'
    )
    expect(bmiPrefix).toBeGreaterThan(-1)

    // Right = forward in reading = next logical index (screen-left for RTL)
    setCaret(d, bmiPrefix)
    const right1 = pressKey(d, 'ArrowRight')
    const right2 = pressKey(d, 'ArrowRight')
    expect(right1).toBe(bmiPrefix + 1)
    expect(right2).toBe(bmiPrefix + 2)

    // Left = backward = previous logical index
    setCaret(d, bmiPrefix)
    const left1 = pressKey(d, 'ArrowLeft')
    const left2 = pressKey(d, 'ArrowLeft')
    expect(left1).toBe(bmiPrefix - 1)
    expect(left2).toBe(bmiPrefix - 2)
  })
})
