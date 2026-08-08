import { describe, expect, it, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
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

function createDraw(main: IElement[], textEngine: TextEngineMode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    defaultDirection: TextDirection.AUTO,
    textEngine,
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

function runRowList(draw: Draw) {
  draw.computeRowList({
    innerWidth: 500,
    elementList: draw.getOriginalElementList()
  })
}

describe('legacy RTL warning', () => {
  let container: HTMLDivElement | undefined
  let warnSpy: ReturnType<typeof vi.spyOn>
  afterEach(() => {
    container?.remove()
    container = undefined
    warnSpy?.mockRestore()
    vi.restoreAllMocks()
  })

  it('legacy + RTL content warns and suggests harfbuzz', () => {
    stubMeasureText()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const main: IElement[] = [
      { value: ZERO },
      { value: 'مرحبا', direction: TextDirection.RTL },
      { value: '\n', direction: TextDirection.RTL }
    ]
    const { draw, container: c } = createDraw(main, TextEngineMode.LEGACY)
    container = c
    runRowList(draw)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(String(warnSpy.mock.calls[0][0])).toContain('harfbuzz')
  })

  it('warns once across repeated legacy renders', () => {
    stubMeasureText()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const main: IElement[] = [
      { value: ZERO },
      { value: 'مرحبا', direction: TextDirection.RTL },
      { value: '\n', direction: TextDirection.RTL }
    ]
    const { draw, container: c } = createDraw(main, TextEngineMode.LEGACY)
    container = c
    runRowList(draw)
    runRowList(draw)
    runRowList(draw)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(String(warnSpy.mock.calls[0][0])).toContain('harfbuzz')
  })

  it('legacy + LTR content does not warn', () => {
    stubMeasureText()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const main: IElement[] = [
      { value: ZERO },
      { value: 'hello' },
      { value: '\n' }
    ]
    const { draw, container: c } = createDraw(main, TextEngineMode.LEGACY)
    container = c
    runRowList(draw)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('harfbuzz + RTL content does not warn', async () => {
    stubMeasureText()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const main: IElement[] = [
      { value: ZERO },
      { value: 'مرحبا', direction: TextDirection.RTL },
      { value: '\n', direction: TextDirection.RTL }
    ]
    const { draw, container: c } = createDraw(main, TextEngineMode.HARFBUZZ)
    container = c
    await (draw as any).layoutHostAdapter.ensureReady()
    runRowList(draw)
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
