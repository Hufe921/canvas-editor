import { ZERO } from '../../dataset/constant/Common'
import { ulStyleMapping } from '../../dataset/constant/List'
import { ListStyle, ListType, UlStyle } from '../../dataset/enum/List'
import type { IElement } from '../../interface/Element'

export function listMarkerText(anchor: IElement, index: number): string {
  if (anchor.listStyle === ListStyle.CHECKBOX) return ''
  if (anchor.listType !== ListType.UL) return `${index + 1}.`
  const level = anchor.listLevel || 0
  const rotation = [UlStyle.DISC, UlStyle.CIRCLE, UlStyle.SQUARE]
  const style = level
    ? rotation[level % rotation.length]
    : (anchor.listStyle as unknown as UlStyle) || UlStyle.DISC
  return ulStyleMapping[style] || ulStyleMapping[UlStyle.DISC]
}

/** Counts logical items once; wrapped paragraphs never advance numbering. */
export function collectListMarkers(elements: IElement[]) {
  const counts = new Map<string, number>()
  return elements.flatMap((anchor, sourceIndex) => {
    if (!anchor.listId || anchor.value !== ZERO || anchor.listWrap) return []
    const index = counts.get(anchor.listId) || 0
    counts.set(anchor.listId, index + 1)
    return [{ anchor, sourceIndex, index, text: listMarkerText(anchor, index) }]
  })
}
