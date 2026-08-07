import { describe, expect, it, vi, afterEach } from 'vitest'
import { buildArabicEmrElementList } from '@/../src/mock-ar-emr'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
  ElementType,
  PaperDirection,
  TextEngineMode,
  TextDirection
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'

describe('post-merge RTL verification', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

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

  async function setup(opts: Record<string, unknown> = {}) {
    const main = buildArabicEmrElementList('')
    const options = mergeOption({
      textEngine: TextEngineMode.HARFBUZZ,
      defaultDirection: TextDirection.AUTO,
      fonts: [],
      width: 600,
      height: 500,
      margins: [40, 40, 40, 40] as [number, number, number, number],
      ...opts
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
    await draw.getLayoutHostAdapter().ensureReady()
    draw.render({ isSubmitHistory: false, isSetCursor: false, isLazy: false })
    return draw
  }

  it('BMI row reading order stays right-to-left after merge', async () => {
    stubMeasureText()
    const d = await setup()
    const bmiRow = d
      .getOriginalRowList()
      .find(r => r.elementList.some(el => el.control?.conceptId === 'height'))!
    expect(bmiRow.direction).toBe('rtl')
    // 屏幕从左到右：{تلقائي} BMI: ، kg {الوزن} …
    const visual = bmiRow.engineLine!.glyphs
      .map(g => bmiRow.engineParagraphText!.slice(g.charStart, g.charEnd))
      .join('')
    expect(visual.indexOf('BMI')).toBeGreaterThan(-1)
    expect(visual.indexOf('kg')).toBeGreaterThan(-1)
    // 右读顺序正确：BMI 在 kg 左侧（屏幕序），保证阿语阅读顺序不被合并破坏
    expect(visual.indexOf('BMI')).toBeLessThan(visual.indexOf('kg'))
  })

  it('RTL caret navigation still follows reading order', async () => {
    stubMeasureText()
    const d = await setup()
    const elements = d.getOriginalElementList()
    const bmiPrefix = elements.findIndex(
      el =>
        el.control?.conceptId === 'bmi' &&
        (el as any).controlComponent === 'prefix'
    )
    const canvasEvent = d.getCanvasEvent()
    const range = d.getRange()
    range.setRange(bmiPrefix, bmiPrefix)
    d.render({ curIndex: bmiPrefix, isCompute: false, isSetCursor: true, isSubmitHistory: false })
    canvasEvent.keydown(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    )
    expect(range.getRange().startIndex).toBe(bmiPrefix + 1)
  })

  it('mixed page orientations still position RTL text correctly', async () => {
    stubMeasureText()
    const main: any[] = [
      { value: ZERO },
      { value: 'نص عربي صفحة أولى عمودي', direction: TextDirection.RTL },
      { value: '\n', direction: TextDirection.RTL },
      {
        type: ElementType.PAGE_BREAK,
        value: '\n',
        paperDirection: PaperDirection.HORIZONTAL
      },
      { value: '\n', direction: TextDirection.RTL },
      { value: 'نص عربي صفحة ثانية أفقي', direction: TextDirection.RTL },
      { value: '\n', direction: TextDirection.RTL }
    ]
    const options = mergeOption({
      textEngine: TextEngineMode.HARFBUZZ,
      defaultDirection: TextDirection.AUTO,
      fonts: [],
      width: 600,
      height: 500,
      margins: [40, 40, 40, 40] as [number, number, number, number]
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
    await draw.getLayoutHostAdapter().ensureReady()
    draw.render({ isSubmitHistory: false, isSetCursor: false, isLazy: false })

    // 分页符开启的新节切换为横向，两页方向不同（main 新功能）
    expect(draw.getPageDirection(0)).toBe(PaperDirection.VERTICAL)
    expect(draw.getPageDirection(1)).toBe(PaperDirection.HORIZONTAL)

    const posList = draw.getPosition().getOriginalPositionList()
    for (const el of draw.getOriginalElementList().filter(
      (el: any) => el.direction === TextDirection.RTL && el.value !== ZERO && el.value !== '\n'
    )) {
      const pos = posList[draw.getOriginalElementList().indexOf(el)]
      expect(pos).toBeTruthy()
      expect(pos.coordinate.rightTop[0]).toBeGreaterThan(
        pos.coordinate.leftTop[0]
      )
    }
  })
})
