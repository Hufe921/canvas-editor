import { describe, expect, it } from 'vitest'
import { measureInlineImage } from '@/editor/core/layout/InlineObjectMeasure'
import { ImageDisplay } from '@/editor/dataset/enum/Common'

describe('independent object measurement', () => {
  it('fits an oversized image, preserves aspect ratio, caption top=0 and input model', () => {
    const source = {
      width: 400,
      height: 200,
      caption: { value: 'caption', size: 12, top: 0 }
    }
    const measured = measureInlineImage(source, {
      availableWidth: 300,
      scale: 2,
      caption: { size: 16, top: 5 }
    })
    expect(measured.adaptedSize).toEqual({ width: 150, height: 75 })
    expect(measured.metrics).toEqual({
      width: 300,
      height: 150,
      boundingBoxDescent: 150,
      boundingBoxAscent: 24
    })
    expect(source.width).toBe(400)
    expect(measured.adaptedSize!.height / measured.adaptedSize!.width).toBe(0.5)
  })

  it.each([
    ImageDisplay.SURROUND,
    ImageDisplay.FLOAT_TOP,
    ImageDisplay.FLOAT_BOTTOM
  ])('leaves floating image %s outside line metrics', display => {
    expect(
      measureInlineImage(
        { width: 400, height: 200, display, caption: { value: 'caption' } },
        { availableWidth: 10, scale: 2, caption: { size: 16, top: 5 } }
      )
    ).toEqual({
      metrics: {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      },
      adaptedSize: undefined
    })
  })

  it('keeps images within the container unchanged', () => {
    const result = measureInlineImage(
      { width: 40, height: 20 },
      { availableWidth: 200, scale: 2, caption: { size: 16, top: 5 } }
    )
    expect(result.adaptedSize).toBeUndefined()
    expect(result.metrics.width).toBe(80)
  })
})
