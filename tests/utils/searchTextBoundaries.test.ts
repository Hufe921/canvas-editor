import { describe, expect, it } from 'vitest'
import { getSearchTextBoundaries } from '@/editor/utils/searchTextBoundaries'

describe('conservative search boundaries without Intl.Segmenter', () => {
  it('every fallback boundary is also a native grapheme break', () => {
    const samples = [
      'ASCII target text', 'a\r\nb', 'x é y', 'x 👩‍🚀 y',
      'x 🇺🇸 y', 'x क्‍ष y', 'x 가 y', '\u0600a target',
      'a\u0301 target', ' \u0301target', '\u200b👩🏽‍🚀\u200b',
      '\u200bक्‍ष', 'target\u200d👩', 'a\r\u0301b', 'x\u007fy'
    ]
    const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' })
    const expected = samples.map(text => new Set([
      ...Array.from(segmenter.segment(text), segment => segment.index),
      text.length
    ]))
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')
    Object.defineProperty(Intl, 'Segmenter', {
      configurable: true, value: undefined
    })
    try {
      for (const [index, text] of samples.entries()) {
        for (const boundary of getSearchTextBoundaries(text)) {
          expect(expected[index].has(boundary),
            `${JSON.stringify(text)} at ${boundary}`).toBe(true)
        }
      }
      expect(getSearchTextBoundaries('abc')).toEqual(new Set([0, 1, 2, 3]))
      expect(getSearchTextBoundaries('\r\n')).toEqual(new Set([0, 2]))
    } finally {
      if (descriptor) Object.defineProperty(Intl, 'Segmenter', descriptor)
    }
  })
})
