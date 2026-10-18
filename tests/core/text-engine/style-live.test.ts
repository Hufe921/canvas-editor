import { LayoutHostAdapter } from '@/editor/core/text-engine-host/LayoutHostAdapter'
import type { IElement } from '@/editor/interface/Element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const data = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer

describe('native source styles and output isolation', () => {
  it('keeps semantic source references live while snapshots are detached', async () => {
    const options = mergeOption({
      autoDownloadFonts: false,
      defaultFont: 'Arabic',
      fonts: [{ family: 'Arabic', data }]
    })
    const adapter = new LayoutHostAdapter(() => options)
    await adapter.ensureReady()
    try {
      const elements: IElement[] = [
        { value: '\u200B' },
        { value: 'a' },
        { value: 'b', bold: true }
      ]
      const paragraph = adapter.scanParagraphs(elements)[0]
      const rows = adapter.layoutParagraphRows(paragraph, elements, 500, 0)
      const output = adapter.layoutParagraphToRows(paragraph, elements, 500, 0)
      expect(rows[0].elementList[1]).toBe(elements[1])
      expect(output[0].elementList[1]).not.toBe(elements[1])
      elements[1].underline = true
      elements[2].strikeout = true
      expect(rows[0].elementList[1].underline).toBe(true)
      expect(rows[0].elementList[2].strikeout).toBe(true)
      expect(rows[0].elementList[2].bold).toBe(true)
      expect(output[0].elementList[1].underline).toBeUndefined()
      expect(elements[1]).not.toHaveProperty('metrics')
      expect(elements[1]).not.toHaveProperty('visualLeft')
    } finally {
      adapter.destroy()
    }
  })
})
