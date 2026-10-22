import { Draw } from '../../../src/editor/core/draw/Draw'
import { Listener } from '../../../src/editor/core/listener/Listener'
import { EventBus } from '../../../src/editor/core/event/eventbus/EventBus'
import { Override } from '../../../src/editor/core/override/Override'
import { HarfBuzzTextShaper } from '../../../src/editor/core/text-engine/shape/HarfBuzzTextShaper'
import { mergeOption } from '../../../src/editor/utils/option'
import { formatElementList } from '../../../src/editor/utils/element'
import { migrationOptions, migrationSamples } from './documents'

// QA-only introspection: no debug methods or metrics are added to the public API.
const params = new URLSearchParams(location.search)
const historical = params.has('historical')
const text = 'Weekend plans مرحبا بالعالم Hello 123 '
const samples: any[] = migrationSamples()
samples.push(
  {
    id: 'many-paragraphs',
    data: {
      main: Array.from({ length: 100 }, () => [
        { value: text.repeat(2) },
        { value: '\n' }
      ]).flat()
    }
  },
  {
    id: 'single-long-paragraph',
    data: { main: [{ value: text.repeat(200) }] }
  },
  {
    id: 'dense-controls',
    data: {
      main: Array.from({ length: 30 }, (_, i) => [
        {
          type: 'control',
          value: '',
          control: {
            type: 'text',
            conceptId: `plan-${i}`,
            value: [{ value: text }],
            minWidth: 120,
            border: true
          }
        },
        { value: '\n' }
      ]).flat()
    }
  },
  {
    id: 'large-table',
    data: {
      main: [
        {
          type: 'table',
          value: '',
          colgroup: [{ width: 180 }, { width: 180 }],
          trList: Array.from({ length: 20 }, () => ({
            height: 48,
            tdList: [0, 1].map(() => ({
              colspan: 1,
              rowspan: 1,
              value: [{ value: text.repeat(2) }]
            }))
          }))
        }
      ]
    }
  }
)
samples.push({
  id: 'missing-fonts',
  data: { main: [{ value: '未覆盖𠮷👩‍👩‍👧‍👦'.repeat(100) }] }
})
let phase = 'startup'
let metrics: Record<string, Record<string, { ms: number; calls: number }>> = {}
function track(object: any, method: string, label: string) {
  const original = object?.[method]
  if (typeof original !== 'function') return
  let depth = 0
  object[method] = function (...args: any[]) {
    const outer = depth++ === 0
    const start = performance.now()
    try {
      return original.apply(this, args)
    } finally {
      depth--
      if (outer) {
        const bucket = (metrics[phase] ||= {})
        const value = (bucket[label] ||= { ms: 0, calls: 0 })
        value.ms += performance.now() - start
        value.calls++
      }
    }
  }
}
track(Draw.prototype, 'computeRowList', 'flowIncludingShaping')
track(Draw.prototype, '_computePageList', 'pagination')
track(Draw.prototype, '_drawPage', 'paint')
track(Draw.prototype, 'updateFontCoverage', 'coverageIncludingScan')
track(HarfBuzzTextShaper.prototype, 'shape', 'shaping')
const bytes = await fetch(
  '/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf'
).then(r => r.arrayBuffer())
let draw: any
let warnings = 0
let warningPhases: Record<string, number> = {}
const warn = console.warn.bind(console)
console.warn = (...args) => {
  if (String(args[0]).startsWith('[canvas-editor]')) {
    warnings++
    warningPhases[phase] = (warningPhases[phase] || 0) + 1
  } else warn(...args)
}
function cacheStats() {
  const adapter = draw.getLayoutHostAdapter()
  const manager = adapter.getFontManager?.() || adapter.fontManager
  return {
    paragraphs: adapter.nativeCache?.cache?.size ?? null,
    layouts: adapter.lastLayouts?.size ?? null,
    layoutCache: adapter.cache?.cache?.size ?? null,
    fontInstances: manager.fonts?.size ?? null,
    fontFaces: manager.faceCache?.size ?? null,
    coverageEntries: manager.coverage?.size ?? null,
    outlineEntries: manager.outlines?.entries?.size ?? null,
    outlineBytes: manager.outlines?.bytes ?? null,
    warned: draw.fontDiagnostics?.warned?.size ?? null
  }
}
function render(compute = true) {
  draw.render({
    isCompute: compute,
    isLazy: false,
    isSetCursor: false,
    isSubmitHistory: false
  })
}
function edit() {
  function target(elements: any[]): { elements: any[]; index: number } | null {
    const index = elements.findIndex(
      (el: any, i: number) =>
        i > 0 &&
        (!el.type || el.type === 'text' || el.controlComponent === 'value') &&
        el.value !== '\u200B'
    )
    if (index >= 0) return { elements, index }
    for (const el of elements)
      for (const row of el.trList || [])
        for (const cell of row.tdList) {
          const found = target(cell.value)
          if (found) return found
        }
    return null
  }
  const found = target(draw.getOriginalMainElementList())
  if (!found) throw new Error('No editable text sample')
  const { elements, index } = found
  draw.spliceElementList(elements, index, 1, [
    { value: elements[index].value === 'x' ? 'y' : 'x' }
  ])
  render()
}
async function run(id: string, incremental: boolean) {
  const sample = samples.find(s => s.id === id)
  const content = structuredClone(sample.data)
  content.header ||= []
  content.footer ||= []
  const options = mergeOption({
    ...migrationOptions,
    ...sample.options,
    autoDownloadFonts: false,
    lab: { incrementalCompute: incremental },
    ...(historical ? { textEngine: 'harfbuzz' } : {}),
    fonts: [{ family: 'Noto Naskh Arabic', data: bytes }]
  })
  Object.values(content).forEach((elements: any) =>
    formatElementList(elements, {
      editorOptions: options,
      isForceCompensation: true
    })
  )
  metrics = {}
  phase = 'startup'
  warnings = 0
  warningPhases = {}
  const start = performance.now()
  draw = new Draw(
    document.querySelector('#editor')!,
    options,
    content,
    new Listener(),
    new EventBus(),
    new Override()
  )
  await (draw.ready || draw.getLayoutHostAdapter().ensureReady())
  render()
  const startupMs = performance.now() - start
  const position = draw.getPosition()
  track(position, 'computePositionList', 'positions')
  const tracker = draw.fontCoverageTracker
  track(tracker, 'update', 'coverageResolve')
  track(draw.fontDiagnostics, 'update', 'diagnostics')
  // The first warmup fills caches and forces pending page observers to settle.
  phase = 'warmup'
  edit()
  await new Promise(resolve => requestAnimationFrame(resolve))
  const edits = []
  phase = 'edit'
  for (let i = 0; i < 8; i++) {
    const t = performance.now()
    edit()
    edits.push(performance.now() - t)
  }
  phase = 'paintOnly'
  const paints = []
  for (let i = 0; i < 5; i++) {
    const t = performance.now()
    render(false)
    paints.push(performance.now() - t)
  }
  return {
    id,
    incremental,
    startupMs,
    edits,
    paints,
    stages: metrics,
    pages: draw.getPageCount(),
    elements: draw.getOriginalMainElementList().length,
    warnings,
    warningPhases,
    cache: cacheStats()
  }
}
function stress(count: number) {
  phase = 'stress'
  for (let i = 0; i < count; i++) {
    const elements = draw.getOriginalMainElementList()
    const index = 2
    draw.spliceElementList(elements, index, 1, [
      { value: String.fromCodePoint(0x61 + (i % 26)) }
    ])
    render()
  }
  return { cache: cacheStats(), warnings }
}
function destroy() {
  draw.destroy()
  const result = {
    cache: cacheStats(),
    canvases: document.querySelectorAll('#editor canvas').length,
    diagnostics: document.querySelectorAll('.ce-font-diagnostics').length,
    documentFonts: document.fonts.size
  }
  draw = null
  return result
}
Object.assign(window, {
  performanceQA: { ids: samples.map(s => s.id), run, stress, destroy }
})
document.querySelector('#status')!.textContent = 'ready'
