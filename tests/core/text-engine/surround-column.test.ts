import { describe, expect, it, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
  ElementType,
  ImageDisplay,
  TextEngineMode,
  TextDirection
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'

describe('DEFER-025 surround image + text-engine', () => {
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

  async function setup(main: any[], opts: Record<string, unknown> = {}) {
    stubMeasureText()
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

  it('shifts text-engine rows beside a left surround image', async () => {
    const main: any[] = [
      { value: ZERO },
      { value: '段落一' },
      { value: '\n' },
      {
        value: '',
        type: ElementType.IMAGE,
        width: 60,
        height: 120,
        imgDisplay: ImageDisplay.SURROUND,
        imgFloatPosition: { x: 40, y: 80, pageNo: 0 }
      },
      {
        value:
          '这是环绕图旁的正文，应当从图片右侧开始排版并环绕，而不是从页面左边距与图片重叠。这一段文字需要足够长以覆盖图片的高度区域。'
      },
      { value: '\n' }
    ]
    const d = await setup(main)
    const posList = d.getPosition().getOriginalPositionList()
    const img = d.getOriginalElementList().find(
      el => el.type === ElementType.IMAGE
    )!
    // SURROUND 图片按其浮层坐标绘制，正文应从其右缘开始
    const imgLeft = img.imgFloatPosition!.x
    const imgRight = imgLeft + img.width!
    const imgTop = img.imgFloatPosition!.y
    const imgBottom = imgTop + img.height!

    const rows = d.getOriginalRowList()
    const textRows = rows
      .map(row => {
        const el = row.elementList.find(
          e =>
            e.sourceIndex !== undefined &&
            e.value &&
            e.value !== ZERO &&
            e.value !== '\n'
        )
        return el ? { row, pos: posList[el.sourceIndex!] } : null
      })
      .filter((x): x is { row: any; pos: any } => !!x?.pos)
    expect(textRows.length).toBeGreaterThan(1)
    for (const { pos } of textRows) {
      // rows within the image vertical band must start after the image
      if (pos.coordinate.leftTop[1] >= imgTop && pos.coordinate.leftTop[1] < imgBottom) {
        expect(pos.coordinate.leftTop[0]).toBeGreaterThanOrEqual(imgRight - 1)
      }
    }
  })

  it('assigns columnIndex to text-engine rows in a multi-column layout', async () => {
    const main: any[] = [
      { value: ZERO },
      {
        value:
          '第一栏的文字内容需要足够长，以便溢出到第二栏。这里不断填充文字来撑满第一栏的高度，确保换栏逻辑被触发。'.repeat(30)
      },
      { value: '\n' }
    ]
    const d = await setup(main, { column: { count: 2, gap: 20 } })
    const layout = d.getColumnManager().getLayout()
    expect(layout?.count).toBe(2)
    const rows = d.getOriginalRowList()
    const withIndex = rows.filter(r => r.columnIndex !== undefined)
    expect(withIndex.length).toBe(rows.length)
    const indexes = new Set(withIndex.map(r => r.columnIndex))
    expect(indexes.size).toBeGreaterThan(1)
    // second-column rows must be offset on the page
    const posList = d.getPosition().getOriginalPositionList()
    const secondColRow = withIndex.find(r => r.columnIndex === 1)
    expect(secondColRow).toBeTruthy()
    const el = secondColRow!.elementList.find(
      e => e.sourceIndex !== undefined
    )
    const pos = posList[el!.sourceIndex!]
    expect(pos).toBeTruthy()
    expect(pos.coordinate.leftTop[0]).toBeGreaterThanOrEqual(
      layout!.offsets[1] - 1
    )
  })

  it('lays each column at the column width so columns never overlap', async () => {
    const main: any[] = [
      { value: ZERO },
      {
        value:
          '第一栏的文字内容需要足够长，以便溢出到第二栏。这里不断填充文字来撑满第一栏的高度，确保换栏逻辑被触发。'.repeat(40)
      },
      { value: '\n' }
    ]
    const d = await setup(main, { column: { count: 2, gap: 20 } })
    const layout = d.getColumnManager().getLayout()!
    const posList = d.getPosition().getOriginalPositionList()
    const rows = d.getOriginalRowList()
    const c0Start = 40
    const c0End = c0Start + layout.width
    const c1Start = c0Start + layout.offsets[1]
    const c1End = c1Start + layout.width
    for (const row of rows) {
      if (row.columnIndex === undefined) continue
      const el = row.elementList.find(e => e.sourceIndex !== undefined)
      if (!el) continue
      const pos = posList[el.sourceIndex!]
      if (!pos) continue
      const left = pos.coordinate.leftTop[0]
      const right = pos.coordinate.rightTop[0]
      if (row.columnIndex === 0) {
        expect(right).toBeLessThanOrEqual(c0End + 1)
      } else {
        expect(left).toBeGreaterThanOrEqual(c1Start - 1)
        expect(right).toBeLessThanOrEqual(c1End + 1)
      }
    }
  })
})
