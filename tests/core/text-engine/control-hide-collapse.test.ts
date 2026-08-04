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
import type { IElement } from '@/editor/interface/Element'
import { ElementBridge } from '@/editor/core/text-engine-host/ElementBridge'

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

describe('control.hide collapse (text-engine / #1447)', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined

  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  it('ElementBridge maps hidden control to zero-width object slots', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: ZERO },
      { value: '标签：' },
      {
        value: '{',
        type: ElementType.CONTROL,
        controlComponent: ControlComponent.PREFIX,
        control: {
          hide: true,
          type: ControlType.TEXT,
          value: null,
          placeholder: 'x'
        }
      },
      {
        value: '占位',
        type: ElementType.CONTROL,
        controlComponent: ControlComponent.PLACEHOLDER,
        control: {
          hide: true,
          type: ControlType.TEXT,
          value: null,
          placeholder: 'x'
        }
      },
      {
        value: '}',
        type: ElementType.CONTROL,
        controlComponent: ControlComponent.POSTFIX,
        control: {
          hide: true,
          type: ControlType.TEXT,
          value: null,
          placeholder: 'x'
        }
      }
    ]
    const [para] = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000',
      scale: 1
    })
    expect(para.text).toContain('标签')
    expect(para.text).not.toContain('占位')
    expect(para.text).not.toContain('{')
    const hiddenSpans = para.spans.filter(s => s.style.objectWidth === 0)
    expect(hiddenSpans.length).toBe(3)
  })

  it('collapses row height when entire line is hidden', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      {
        value: '整行隐藏',
        hide: true
      }
    ]
    ;({ draw, container } = createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    ;(draw as any).layoutHostAdapter.invalidate()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const row = draw!.getOriginalRowList().find(r =>
      r.elementList.some(e => e.value === '整行隐藏' || e.hide)
    )
    expect(row).toBeTruthy()
    expect(row!.height).toBe(0)
  })

  it('keeps label visible and drops hidden control ink without blank hole', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO },
      { value: '高血压分级：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'hypertensionLevel',
          type: ControlType.SELECT,
          value: null,
          code: null,
          hide: true,
          placeholder: '分级',
          prefix: '{',
          postfix: '}',
          valueSets: [
            { value: 'Ⅰ级', code: '1' },
            { value: 'Ⅱ级', code: '2' }
          ]
        }
      },
      { value: '。' }
    ]
    ;({ draw, container } = createDraw(main))
    await (draw as any).layoutHostAdapter.ensureReady()
    ;(draw as any).layoutHostAdapter.invalidate()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const row = draw!.getOriginalRowList().find(r =>
      r.engineParagraphText?.includes('高血压分级')
    )
    expect(row).toBeTruthy()
    expect(row!.height).toBeGreaterThan(0)

    const labelChars = row!.elementList.filter(
      e => !e.control && e.value && e.value !== ZERO && e.value !== '。'
    )
    const period = row!.elementList.find(e => e.value === '。')!
    const hidden = row!.elementList.filter(e => e.control?.hide)
    expect(hidden.length).toBeGreaterThan(0)
    expect(hidden.every(e => (e.metrics?.width ?? 0) === 0)).toBe(true)

    // 标签末字与句号视觉相邻：隐藏控件不留下空隙
    const lastLabel = labelChars[labelChars.length - 1]
    const labelRight =
      (lastLabel.visualLeft ?? 0) + (lastLabel.metrics?.width ?? 0)
    expect(Math.abs((period.visualLeft ?? 0) - labelRight)).toBeLessThan(1)

    const paintLine = (draw as any).filterEngineLineForPaint(
      row!.engineLine,
      draw!.getOriginalElementList()
    )
    const painted = paintLine.glyphs
      .map((g: { charStart: number; charEnd: number }) =>
        row!.engineParagraphText!.slice(g.charStart, g.charEnd)
      )
      .join('')
    expect(painted).toContain('高血压分级：')
    expect(painted).toContain('。')
    // 控件占位 `{分级}` 不得出现；标签里的「分级」二字仍可见
    expect(painted).not.toMatch(/\{/)
    expect(painted).not.toMatch(/\}/)
  })
})
