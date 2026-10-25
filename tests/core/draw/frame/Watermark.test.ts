import { describe, expect, it, vi } from 'vitest'
import { Watermark } from '@/editor/core/draw/frame/Watermark'
import { TextMeasurer } from '@/editor/core/layout/TextMeasurer'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { mergeOption } from '@/editor/utils/option'

describe('Watermark', () => {
  it('DisplayList 渲染时使用明确的字体样式测量', () => {
    const options = mergeOption()
    options.watermark.data = 'watermark'
    const measurer = new TextMeasurer(
      document.createElement('canvas').getContext('2d')!
    )
    const measureText = vi.spyOn(measurer, 'measureText')
    const draw = {
      getOptions: () => options,
      getPageSize: () => ({ width: 800, height: 600 }),
      getPageCount: () => 1,
      getTextMeasurer: () => measurer
    }
    const watermark = new Watermark(draw as any)

    watermark.renderText(new DisplayList(), 0)

    expect(measureText).toHaveBeenCalledWith(
      'watermark',
      `${options.watermark.size * options.scale}px ${options.watermark.font}`
    )
  })

  it('重复文字水印提供稳定资源身份避免重复序列化', () => {
    const options = mergeOption()
    options.watermark.data = 'watermark'
    options.watermark.repeat = true
    const draw = {
      getOptions: () => options,
      getPageSize: () => ({ width: 800, height: 600 }),
      getPageCount: () => 1,
      getPagePixelRatio: () => 1,
      getTextMeasurer: () => new TextMeasurer()
    }
    const watermark = new Watermark(draw as any)
    const displayList = new DisplayList()

    watermark.renderText(displayList, 0)

    const patternOperation = displayList.getOperations().find(
      operation =>
        operation.type === 'set' &&
        operation.property === 'fillStyle' &&
        typeof operation.value === 'object' &&
        operation.value !== null &&
        'type' in operation.value &&
        operation.value.type === 'pattern'
    )
    expect(patternOperation).toBeDefined()
    const pattern = (patternOperation as any).value
    expect(pattern.resource.key).toBe('watermark-text')
    expect(pattern.resource.revision).toContain('watermark')
  })
})
