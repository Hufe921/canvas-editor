import type { IRow, IRowElement } from '../interface/Row'

/** Opt-in paragraph metrics. Legacy rowMargin documents keep their layout. */
export function applyLineHeight(
  row: IRow,
  scale: number,
  isHidden: (element: IRowElement) => boolean = () => false
): void {
  const setting = row.elementList.find(
    element => element.lineHeight
  )?.lineHeight
  if (!setting) return
  if (!Number.isFinite(setting.value) || setting.value <= 0) {
    throw new Error('Line height must be finite and positive.')
  }
  if (!['multiple', 'exact', 'atLeast'].includes(setting.rule)) {
    throw new Error('Unknown line-height rule.')
  }
  let ascent = 0
  let descent = 0
  for (const element of row.elementList) {
    if (isHidden(element)) continue
    // Image/latex rows use their full box above the text baseline.
    const image = element.type === 'image' || element.type === 'latex'
    ascent = Math.max(
      ascent,
      image ? element.metrics.height : element.metrics.boundingBoxAscent
    )
    descent = Math.max(descent, image ? 0 : element.metrics.boundingBoxDescent)
  }
  const natural = ascent + descent
  const requested =
    setting.rule === 'multiple'
      ? natural * setting.value
      : setting.value * scale
  const height =
    setting.rule === 'atLeast' ? Math.max(natural, requested) : requested
  row.height = height
  row.ascent = ascent + (height - natural) / 2
}
