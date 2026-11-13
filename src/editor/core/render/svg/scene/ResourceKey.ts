import type { IRenderPattern } from '../../model/RenderContext'

export function buildPatternResourceKey(pattern: IRenderPattern): string {
  const { image, repetition, resource } = pattern
  const identity = resource
    ? `resource:${resource.key}:${resource.revision ?? ''}`
    : `content:${getImageContentIdentity(image)}`
  const { width, height } = getImageSize(image)
  return `${identity}:${repetition}:${width}x${height}`
}

export function createResourceId(
  kind: string,
  resourceKey: string,
  scope = 'svg'
): string {
  return `${scope}-${kind}-${hash(resourceKey)}`
}

function getImageContentIdentity(image: CanvasImageSource): string {
  const source = image as unknown as {
    currentSrc?: unknown
    src?: unknown
    toDataURL?: () => string
  }
  const src = source.currentSrc || source.src
  if (typeof src === 'string' && src) return src
  if (typeof source.toDataURL === 'function') {
    try {
      return source.toDataURL()
    } catch {
      throw new Error(
        'Pattern image requires an explicit resource identity when its content cannot be read'
      )
    }
  }
  throw new Error(
    'Pattern image requires an explicit resource identity or stable serializable content'
  )
}

export function getImageSize(image: CanvasImageSource): {
  width: number
  height: number
} {
  const source = image as unknown as {
    naturalWidth?: number
    naturalHeight?: number
    videoWidth?: number
    videoHeight?: number
    width?: number
    height?: number
  }
  return {
    width:
      source.naturalWidth || source.videoWidth || Number(source.width) || 0,
    height:
      source.naturalHeight || source.videoHeight || Number(source.height) || 0
  }
}

function hash(value: string): string {
  let result = 2166136261
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(36)
}
