import { ImageDisplay } from '../../dataset/enum/Common'
import type { IElementMetrics } from '../../interface/Element'

export function emptyMetrics(): IElementMetrics {
  return { width: 0, height: 0, boundingBoxAscent: 0, boundingBoxDescent: 0 }
}

export function isFloatingImage(display: ImageDisplay | undefined): boolean {
  return (
    display === ImageDisplay.SURROUND ||
    display === ImageDisplay.FLOAT_TOP ||
    display === ImageDisplay.FLOAT_BOTTOM
  )
}

/** Input/output geometry is explicit; only the caller commits adapted model sizes. */
export function measureInlineImage(
  input: {
    width: number
    height: number
    display?: ImageDisplay
    caption?: { value?: string; size?: number; top?: number }
  },
  container: {
    availableWidth: number
    scale: number
    caption: { size: number; top: number }
  }
) {
  const metrics = emptyMetrics()
  if (isFloatingImage(input.display)) return { metrics, adaptedSize: undefined }
  const { scale, caption } = container
  const availableWidth = Math.max(0, container.availableWidth)
  const width = input.width * scale
  const height = input.height * scale
  const adapt = width > availableWidth
  metrics.width = adapt ? availableWidth : width
  metrics.height = adapt ? (height * availableWidth) / width : height
  metrics.boundingBoxDescent = metrics.height
  if (input.caption?.value) {
    metrics.boundingBoxAscent =
      ((input.caption.size || caption.size) +
        (input.caption.top ?? caption.top)) *
      scale
  }
  return {
    metrics,
    adaptedSize: adapt
      ? { width: metrics.width / scale, height: metrics.height / scale }
      : undefined
  }
}
