import { describe, expect, it, vi } from 'vitest'
import { Ruler } from '@/editor/core/draw/ruler/Ruler'
import type { Draw } from '@/editor/core/draw/Draw'
import type { IRenderContext } from '@/editor/core/render/model/RenderContext'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IElement } from '@/editor/interface/Element'

function renderRuler(direction: TextDirection, value = 'plain') {
  const elements: IElement[] = [{ value, direction }]
  const draw = {
    getOptions: () => ({
      scale: 1,
      defaultDirection: direction,
      ruler: { height: 26 }
    }),
    getContainer: () => document.createElement('div'),
    getWidth: () => 400,
    getPagePixelRatio: () => 1,
    getMargins: () => [20, 20, 20, 20],
    getRange: () => ({
      getRange: () => ({ startIndex: 0, endIndex: 0 }),
      getRangeParagraphElementList: () => elements,
      getDirection: () => direction
    }),
    getElementList: () => elements
  } as unknown as Draw
  const ruler = new Ruler(draw)
  const ctx = {
    scale: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    stroke: vi.fn()
  } as unknown as IRenderContext
  const internal = ruler as any
  internal.canvasX = { style: {}, width: 0, height: 0 }
  internal.ctxX = ctx
  internal._renderX()
  return ctx
}

describe('RTL 水平标尺', () => {
  it('LTR 保持原刻度坐标', () => {
    expect(renderRuler(TextDirection.LTR).fillText).toHaveBeenCalledWith(
      '1',
      38.5,
      17
    )
  })

  it('显式 RTL 镜像刻度但不反转数字文本', () => {
    expect(renderRuler(TextDirection.RTL).fillText).toHaveBeenCalledWith(
      '1',
      361.5,
      17
    )
  })

  it('AUTO 根据当前段落首个强方向字符决定刻度方向', () => {
    expect(renderRuler(TextDirection.AUTO, 'مرحبا').fillText).toHaveBeenCalledWith(
      '1',
      361.5,
      17
    )
  })
})
