import { BackendType } from '../../dataset/enum/Editor'
import { CanvasBackend } from './canvas/CanvasBackend'
import { SvgBackend } from './svg/SvgBackend'
import type { IRenderBackend } from './RenderBackend'

export function createBackend(
  type: BackendType = BackendType.CANVAS,
  pageContainer: HTMLElement
): IRenderBackend {
  if (type === BackendType.CANVAS) {
    return new CanvasBackend(pageContainer)
  }
  if (type === BackendType.SVG) {
    return new SvgBackend(pageContainer)
  }
  throw new Error(`Unsupported render backend: ${type}`)
}
