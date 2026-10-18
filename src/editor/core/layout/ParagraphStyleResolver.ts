import { ZERO } from '../../dataset/constant/Common'
import type { IElement } from '../../interface/Element'

export function resolveRowMargin(
  element: Pick<IElement, 'size' | 'rowMargin'>,
  defaults: {
    defaultSize: number
    defaultBasicRowMarginHeight: number
    defaultRowMargin: number
    scale: number
  }
) {
  const size = element.size || defaults.defaultSize
  const ratio = size < 12 ? size / 12 : size > 30 ? 1 + (size - 30) / 30 : 1
  return (
    defaults.defaultBasicRowMarginHeight *
    ratio *
    (element.rowMargin ?? defaults.defaultRowMargin) *
    defaults.scale
  )
}

export function resolveListOffset(
  element: Pick<IElement, 'listId' | 'listLevel'>,
  markerWidth: number,
  indentWidth: number,
  scale: number
) {
  return element.listId
    ? markerWidth +
        (element.listLevel ? indentWidth * element.listLevel * scale : 0)
    : 0
}

export function resolveSpacingBefore(
  element: IElement,
  following: IElement | undefined,
  scale: number
) {
  return element.value === ZERO && !element.listWrap
    ? (element.spacingBefore || following?.spacingBefore || 0) * scale
    : 0
}

export function resolveSpacingAfter(
  element: IElement | undefined,
  scale: number
) {
  return (element?.spacingAfter || 0) * scale
}
