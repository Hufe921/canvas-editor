import { describe, expect, it, vi } from 'vitest'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import {
  isTableMirrored,
  isUiRtl,
  resolveNewContentDirection,
  resolveUiDirection
} from '../../../src/editor/utils/direction'
import { createTestEditor } from '../../factories/editor'
import { EDITOR_PREFIX } from '../../../src/editor/dataset/constant/Editor'

describe('LTR/RTL mode helpers', () => {
  it('resolveUiDirection defaults to ltr', () => {
    expect(resolveUiDirection({})).toBe(TextDirection.LTR)
    expect(resolveUiDirection({ direction: TextDirection.RTL })).toBe(
      TextDirection.RTL
    )
    expect(isUiRtl({ direction: TextDirection.RTL })).toBe(true)
  })

  it('resolveNewContentDirection follows mode for new lines/blocks', () => {
    expect(resolveNewContentDirection({ direction: TextDirection.RTL })).toBe(
      TextDirection.RTL
    )
    expect(resolveNewContentDirection({})).toBe(TextDirection.LTR)
  })

  it('isTableMirrored only follows element.direction (not UI mode)', () => {
    expect(
      isTableMirrored(
        { direction: TextDirection.LTR },
        { direction: TextDirection.RTL }
      )
    ).toBe(false)
    expect(
      isTableMirrored(
        { direction: TextDirection.RTL },
        { direction: TextDirection.LTR }
      )
    ).toBe(true)
    // 未声明表格不因 RTL 模式而镜像
    expect(isTableMirrored({}, { direction: TextDirection.RTL })).toBe(false)
    expect(isTableMirrored({}, { direction: TextDirection.LTR })).toBe(false)
  })
})

describe('executeUiDirection', () => {
  it('syncs shell UI without invalidating layout or forceUpdate', async () => {
    const { CommandAdapt } = await import(
      '../../../src/editor/core/command/CommandAdapt'
    )
    const { LayoutHostAdapter } = await import(
      '../../../src/editor/core/text-engine-host/LayoutHostAdapter'
    )
    const forceSpy = vi.spyOn(CommandAdapt.prototype, 'forceUpdate')
    const invalidateSpy = vi.spyOn(LayoutHostAdapter.prototype, 'invalidate')
    const { editor, destroy } = createTestEditor({
      data: {
        header: [],
        main: [{ value: ZERO }, { value: 'hello' }],
        footer: []
      }
    })
    try {
      forceSpy.mockClear()
      invalidateSpy.mockClear()

      editor.command.executeUiDirection(TextDirection.RTL)

      const container = editor.command.getContainer()
      expect(editor.command.getOptions().direction).toBe(TextDirection.RTL)
      // 画布容器不得设 dir=rtl，否则绝对定位光标碰撞错位
      expect(container.getAttribute('dir')).toBeNull()
      expect(container.classList.contains(`${EDITOR_PREFIX}-ui-rtl`)).toBe(
        true
      )
      expect(invalidateSpy).not.toHaveBeenCalled()
      expect(forceSpy).not.toHaveBeenCalled()

      editor.command.executeUiDirection(TextDirection.LTR)
      expect(editor.command.getOptions().direction).toBe(TextDirection.LTR)
      expect(container.getAttribute('dir')).toBeNull()
      expect(invalidateSpy).not.toHaveBeenCalled()
      expect(forceSpy).not.toHaveBeenCalled()
    } finally {
      forceSpy.mockRestore()
      invalidateSpy.mockRestore()
      destroy()
    }
  })

  it('hit-test index unchanged after toggling UI RTL mode', async () => {
    const { Draw } = await import('../../../src/editor/core/draw/Draw')
    const { EventBus } = await import(
      '../../../src/editor/core/event/eventbus/EventBus'
    )
    const { Listener } = await import(
      '../../../src/editor/core/listener/Listener'
    )
    const { Override } = await import(
      '../../../src/editor/core/override/Override'
    )
    const { mergeOption } = await import('../../../src/editor/utils/option')
    const { formatElementList } = await import(
      '../../../src/editor/utils/element'
    )
    const { TextEngineMode } = await import('../../../src/editor')

    const proto = CanvasRenderingContext2D.prototype
    vi.spyOn(proto, 'measureText').mockImplementation(function (text: string) {
      let width = 0
      for (const ch of text) {
        width += (ch.codePointAt(0) || 0) > 0xff ? 16 : 8
      }
      return {
        width,
        actualBoundingBoxAscent: 12.8,
        actualBoundingBoxDescent: 3.2,
        fontBoundingBoxAscent: 12.8,
        fontBoundingBoxDescent: 3.2
      } as TextMetrics
    })

    const main = [{ value: ZERO }, { value: '主诉发热咳嗽' }]
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
    try {
      await (draw as any).layoutHostAdapter.ensureReady()
      draw.render({ isSubmitHistory: false, isSetCursor: false })
      const posList = draw.getPosition().getOriginalPositionList()
      const target = posList[3]
      expect(target).toBeTruthy()
      const x =
        (target.coordinate.leftTop[0] + target.coordinate.rightTop[0]) / 2
      const y =
        (target.coordinate.leftTop[1] + target.coordinate.leftBottom[1]) / 2
      const before = draw.getPosition().getPositionByXY({ x, y, pageNo: 0 })

      draw.getOptions().direction = TextDirection.RTL
      draw.syncUiDirection()
      const after = draw.getPosition().getPositionByXY({ x, y, pageNo: 0 })
      expect(after.index).toBe(before.index)
      expect(container.getAttribute('dir')).toBeNull()
    } finally {
      draw.destroy()
      container.remove()
      vi.restoreAllMocks()
    }
  })
})

describe('content direction vs UI direction', () => {
  it('ElementBridge ignores uiDirection when resolving existing paragraphs', () => {
    const bridge = new ElementBridge()
    // 中文未声明 direction；即使传入 uiDirection=rtl 仍应按强字符为 ltr
    const paragraphs = bridge.scanParagraphs(
      [{ value: ZERO }, { value: '主诉发热' }],
      {
        defaultDirection: TextDirection.AUTO,
        uiDirection: TextDirection.RTL,
        defaultFont: 'sans-serif',
        defaultSize: 16,
        defaultColor: '#000'
      }
    )
    expect(paragraphs[0].direction).toBe('ltr')
  })

  it('explicit Arabic RTL element stays rtl regardless of UI ltr', () => {
    const bridge = new ElementBridge()
    const paragraphs = bridge.scanParagraphs(
      [
        { value: ZERO },
        {
          value: 'مرحبا',
          direction: TextDirection.RTL
        }
      ],
      {
        defaultDirection: TextDirection.AUTO,
        uiDirection: TextDirection.LTR,
        defaultFont: 'sans-serif',
        defaultSize: 16,
        defaultColor: '#000'
      }
    )
    expect(paragraphs[0].direction).toBe('rtl')
  })
})
