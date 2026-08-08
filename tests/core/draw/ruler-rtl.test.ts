import { describe, expect, it, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { TextDirection, TextEngineMode } from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'

describe('RTL ruler mirroring', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  function setup(direction: TextDirection.LTR | TextDirection.RTL) {
    const main: any[] = [{ value: ZERO }, { value: '正文' }, { value: '\n' }]
    const options = mergeOption({
      textEngine: TextEngineMode.HARFBUZZ,
      defaultDirection: TextDirection.AUTO,
      direction,
      ruler: { disabled: false, height: 26 },
      width: 600,
      height: 400,
      margins: [40, 50, 40, 60] as [number, number, number, number]
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
    return draw
  }

  function marginShadows(fillSpy: ReturnType<typeof vi.spyOn>) {
    // 前三个 fillRect：背景白 + 左右边距阴影（前两个是背景和左阴影）
    const rects = fillSpy.mock.calls
      .slice(0, 3)
      .map((c: unknown[]) =>
        [c[0], c[1], c[2], c[3]].map(v => Math.round(v as number))
      )
    return rects
  }

  it('mirrors the horizontal ruler for RTL mode', async () => {
    const d = setup(TextDirection.RTL)
    await d.getLayoutHostAdapter().ensureReady()
    const fillSpy = vi
      .spyOn(CanvasRenderingContext2D.prototype, 'fillRect')
      .mockImplementation(() => {})
    d.getRuler().render()

    const [, leftShadow, rightShadow] = marginShadows(fillSpy)
    // RTL：左页边距(margins[3]=60)阴影在右侧 [540, 60]
    expect(leftShadow[0]).toBe(540)
    expect(leftShadow[2]).toBe(60)
    // 右页边距(margins[1]=50)阴影在左侧 [0, 50]
    expect(rightShadow[0]).toBe(0)
    expect(rightShadow[2]).toBe(50)
  })

  it('keeps the horizontal ruler in LTR orientation', async () => {
    const d = setup(TextDirection.LTR)
    await d.getLayoutHostAdapter().ensureReady()
    const fillSpy = vi
      .spyOn(CanvasRenderingContext2D.prototype, 'fillRect')
      .mockImplementation(() => {})
    d.getRuler().render()

    const [, leftShadow, rightShadow] = marginShadows(fillSpy)
    // LTR：左页边距在左侧 [0, 60]，右页边距在右侧 [550, 50]
    expect(leftShadow[0]).toBe(0)
    expect(leftShadow[2]).toBe(60)
    expect(rightShadow[0]).toBe(550)
    expect(rightShadow[2]).toBe(50)
  })

  it('re-renders the ruler mirrored after toggling to RTL mode', async () => {
    const d = setup(TextDirection.LTR)
    await d.getLayoutHostAdapter().ensureReady()
    // 先渲染一次（LTR），标尺 DOM 建立
    const fillSpy = vi
      .spyOn(CanvasRenderingContext2D.prototype, 'fillRect')
      .mockImplementation(() => {})
    d.getRuler().render()
    fillSpy.mockClear()

    // 切换 UI 方向为 RTL → syncUiDirection 应触发标尺重绘
    d.getOptions().direction = TextDirection.RTL
    d.syncUiDirection()

    const [, leftShadow, rightShadow] = marginShadows(fillSpy)
    // 切换后应为 RTL 镜像：左页边距阴影在右侧 [540, 60]，右页边距在左侧 [0, 50]
    expect(leftShadow[0]).toBe(540)
    expect(leftShadow[2]).toBe(60)
    expect(rightShadow[0]).toBe(0)
    expect(rightShadow[2]).toBe(50)
  })
})
