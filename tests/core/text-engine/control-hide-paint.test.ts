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
  TextDirection,
  TextEngineMode
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import { SelectControl } from '@/editor/core/draw/control/select/SelectControl'
import type { IElement } from '@/editor/interface/Element'

function stubMeasureText() {
  const proto = CanvasRenderingContext2D.prototype
  vi.spyOn(proto, 'measureText').mockImplementation(function (text: string) {
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
  })
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
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    options,
    {
      header: [{ value: '\n' }],
      main,
      footer: [{ value: '\n' }]
    },
    new Listener(),
    new EventBus(),
    new Override()
  )
  return { draw, container }
}

describe('control placeholder paint (text-engine)', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined

  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  it('obesityTip placeholder stays in paint glyphs', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      { value: '肥胖干预建议：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'obesityTip',
          type: ControlType.TEXT,
          value: null,
          placeholder: '干预建议',
          prefix: '{',
          postfix: '}'
        }
      }
    ]
    ;({ draw, container } = createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    ;(draw as any).layoutHostAdapter.invalidate()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const row = draw!.getOriginalRowList().find(r =>
      r.engineParagraphText?.includes('肥胖')
    )
    expect(row?.engineParagraphText).toContain('{干预建议}')
    const paintLine = (draw as any).filterEngineLineForPaint(
      row!.engineLine,
      draw!.getOriginalElementList()
    )
    const painted = paintLine.glyphs
      .map((g: { charStart: number; charEnd: number }) =>
        row!.engineParagraphText!.slice(g.charStart, g.charEnd)
      )
      .join('')
    expect(painted).toContain('{')
    expect(painted).toContain('干预')
    expect(painted).toContain('}')
  })

  it('hypertensionLevel paints {分级} and {Ⅱ级} after setSelect', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      { value: '有无高血压：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'hypertension',
          type: ControlType.SELECT,
          value: null,
          code: null,
          placeholder: '有无',
          prefix: '{',
          postfix: '}',
          valueSets: [
            { value: '有', code: '1' },
            { value: '无', code: '0' }
          ]
        }
      },
      { value: '，高血压分级：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'hypertensionLevel',
          type: ControlType.SELECT,
          value: null,
          code: null,
          placeholder: '分级',
          prefix: '{',
          postfix: '}',
          valueSets: [
            { value: 'Ⅰ级', code: '1' },
            { value: 'Ⅱ级', code: '2' }
          ]
        }
      }
    ]
    ;({ draw, container } = createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    ;(draw as any).layoutHostAdapter.invalidate()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const slicePaint = (row: {
      engineLine?: { glyphs: Array<{ charStart: number; charEnd: number }> }
      engineParagraphText?: string
    }) => {
      expect(row.engineLine).toBeTruthy()
      return (draw as any)
        .filterEngineLineForPaint(
          row.engineLine!,
          draw!.getOriginalElementList()
        )
        .glyphs.map((g: { charStart: number; charEnd: number }) =>
          row.engineParagraphText!.slice(g.charStart, g.charEnd)
        )
        .join('')
    }

    const beforeRow = draw!.getOriginalRowList().find(r =>
      r.engineParagraphText?.includes('有无高血压')
    )!
    expect(slicePaint(beforeRow)).toMatch(/\{分级\}/)

    const els0 = draw!.getOriginalElementList()
    const prefixLv = els0.findIndex(
      e =>
        e.control?.conceptId === 'hypertensionLevel' &&
        e.controlComponent === ControlComponent.PREFIX
    )
    draw!.getRange().setRange(prefixLv, prefixLv)
    draw!.getControl().initControl()
    ;(draw!.getControl().getActiveControl() as SelectControl).setSelect('2')
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const afterRow = draw!.getOriginalRowList().find(r =>
      r.elementList.some(e => e.control?.conceptId === 'hypertensionLevel')
    )!
    const painted = slicePaint(afterRow)
    expect(painted).toMatch(/\{Ⅱ级\}/)
    expect(painted).not.toMatch(/\{分级\}/)
  })
})
