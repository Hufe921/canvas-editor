import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { HarfBuzzTextShaper } from '@/editor/core/text-engine/shape/HarfBuzzTextShaper'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll } from 'vitest'

const fonts = new FontManager()
beforeAll(async () => {
  await fonts.init([
    {
      family: 'sans-serif',
      data: new Uint8Array(
        readFileSync('tests/fixtures/fonts/NotoSans-Latin-Regular.woff2')
      ).buffer
    },
    {
      family: 'Arabic',
      data: new Uint8Array(
        readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
      ).buffer
    },
    {
      family: 'CJK',
      data: new Uint8Array(
        readFileSync('tests/fixtures/fonts/NotoSansSC-Regular.woff2')
      ).buffer
    }
  ])
})
afterAll(() => fonts.destroy())
export function createTestTextShaper() {
  return new HarfBuzzTextShaper(fonts)
}
