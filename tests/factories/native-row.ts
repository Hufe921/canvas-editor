import { LayoutHostAdapter } from '@/editor/core/text-engine-host/LayoutHostAdapter'
import type { LayoutResult } from '@/editor/core/text-engine/types'
import type { IElement } from '@/editor/interface/Element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'

const data = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer

export async function layoutNativeSnapshot(input: {
  elementList: IElement[]
  layout?: LayoutResult
  startRowIndex: number
  defaultFont: string
  defaultSize: number
}) {
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: input.defaultFont,
    defaultSize: input.defaultSize,
    fonts: [{ family: input.defaultFont, data }]
  })
  const adapter = new LayoutHostAdapter(() => options)
  await adapter.ensureReady()
  try {
    return adapter
      .scanParagraphs(input.elementList)
      .filter(
        paragraph =>
          !input.layout || paragraph.text === input.layout.paragraphText
      )
      .flatMap(paragraph =>
        adapter.layoutParagraphToRows(
          paragraph,
          input.elementList,
          10000,
          input.startRowIndex
        )
      )
  } finally {
    adapter.destroy()
  }
}
