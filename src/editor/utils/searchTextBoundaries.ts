import { ZERO } from '../dataset/constant/Common'

/** Without a segmenter, expose only boundaries known to be grapheme breaks.
 * Do not treat the editor's legacy code-point/emoji splitter as a complete
 * Unicode grapheme segmenter, especially across formatting boundaries. */
export function getSearchTextBoundaries(text: string): Set<number> {
  const boundaries = new Set<number>([0, text.length])
  if (typeof Intl.Segmenter === 'function') {
    for (const segment of new Intl.Segmenter('und', {
      granularity: 'grapheme'
    }).segment(text)) {
      boundaries.add(segment.index)
    }
    return boundaries
  }
  for (let index = 1; index < text.length; index++) {
    const left = text.charCodeAt(index - 1)
    const right = text.charCodeAt(index)
    // CRLF is a single grapheme. Other ASCII controls and the editor's
    // zero-width-space separator force breaks on either side.
    if (left === 13 && right === 10) continue
    if (
      left < 32 || right < 32 || left === 127 || right === 127 ||
      text[index - 1] === ZERO || text[index] === ZERO ||
      left < 128 && right < 128
    ) {
      boundaries.add(index)
    }
  }
  return boundaries
}
