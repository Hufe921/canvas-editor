import { readFileSync } from 'node:fs'
import type { IEditorFontFace } from '@/editor/interface/TextEngine'

/** Fixed local bytes: stable integration tests never depend on Bunny/network. */
const fixtures = [
  ['Noto Sans', 'tests/fixtures/fonts/NotoSans-Latin-Regular.woff2'],
  ['Noto Sans SC', 'tests/fixtures/fonts/NotoSansSC-Regular.woff2'],
  ['Noto Naskh Arabic', 'public/fonts/NotoNaskhArabic-Regular.ttf'],
  ['Noto Sans Devanagari', 'public/fonts/NotoSansDevanagari-Regular.ttf'],
  ['Noto Sans Thai', 'public/fonts/NotoSansThai-Regular.ttf']
].map(([family, file]) => ({
  family,
  data: new Uint8Array(readFileSync(file)).buffer
}))

export function testFonts(): IEditorFontFace[] {
  return fixtures.map(face => ({ ...face, data: face.data.slice(0) }))
}
