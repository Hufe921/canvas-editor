import Editor, { EditorMode } from '../../../src/editor'
import {
  migrationEnvironment,
  migrationOptions,
  migrationSamples
} from './documents'

// Shared by the source harness and both tarball consumers. No public network.
async function run() {
  const params = new URLSearchParams(location.search)
  const sample =
    migrationSamples().find(item => item.id === params.get('sample')) ||
    migrationSamples()[0]

  const woff2 = params.get('format') === 'woff2'
  if (woff2) sample.data = { main: [{ value: 'office café 123' }] }
  const fontUrl =
    (woff2 ? './fonts/NotoSans-Latin-Regular.woff2' : '') ||
    document.querySelector<HTMLDivElement>('#editor')!.dataset.fontUrl ||
    './fonts/NotoNaskhArabic-Regular.ttf'
  const response = await fetch(new URL(fontUrl, document.baseURI))
  if (!response.ok) throw new Error(`Font HTTP ${response.status}`)
  const data = await response.arrayBuffer()
  const face = await new FontFace(migrationEnvironment.font, data).load()
  document.fonts.add(face)
  const editor = new Editor(
    document.querySelector<HTMLDivElement>('#editor')!,
    sample.data,
    {
      ...migrationOptions,
      ...sample.options,
      fonts: [{ family: migrationEnvironment.font, data }]
    }
  )
  await editor.ready
  if (
    woff2 &&
    (editor.getFontCoverageReport().issues.length ||
      editor.register.getFontFaces()[0]?.format !== 'woff2')
  ) {
    throw new Error('Packed WOFF2 decoding or glyph coverage failed')
  }
  // Exercise actual inline workers, including serialization of complex models.
  const [wordCount, saved] = await Promise.all([
    editor.command.getWordCount(),
    editor.command.getValueAsync()
  ])
  if (wordCount <= 0) throw new Error('Word-count worker returned no text')
  const sync = editor.command.getValue().data
  for (const scope of ['header', 'main', 'footer'] as const) {
    if (JSON.stringify(saved.data[scope]) !== JSON.stringify(sync[scope])) {
      throw new Error(`Worker ${scope} differs from synchronous serialization`)
    }
  }
  const images = await editor.command.getImage({
    pixelRatio: 1,
    mode: EditorMode.PRINT
  })
  if (
    !images.length ||
    images.some(image => !image.startsWith('data:image/png'))
  ) {
    throw new Error('Print export did not produce PNG pages')
  }
  document.querySelector('#status')!.textContent = JSON.stringify({
    status: 'passed',
    sample: sample.id,
    engine: 'harfbuzz',
    wordCount,
    pages: images.length,
    fontBytes: data.byteLength,
    format: woff2 ? 'woff2' : 'ttf',
    viewport: [innerWidth, innerHeight],
    dpr: devicePixelRatio
  })
  // Keep the editor visible for review and interaction/print inspection.
  Object.assign(window, { migrationEditor: editor, migrationImages: images })
}

await run().catch(error => {
  document.querySelector('#status')!.textContent = `failed: ${error.message}`
  console.error(error)
})
