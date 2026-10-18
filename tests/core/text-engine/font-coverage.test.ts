import {
  FontCoverageTracker,
  type FontCoverageInput
} from '@/editor/core/text-engine/font/FontCoverageTracker'
import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { GlyphRenderer } from '@/editor/core/text-engine/render/GlyphRenderer'
import { HarfBuzzTextShaper } from '@/editor/core/text-engine/shape/HarfBuzzTextShaper'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
const data = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.length
)
const managers: FontManager[] = []
async function manager() {
  const value = new FontManager()
  managers.push(value)
  await value.init([])
  return value
}
function input(text: string, scope = 'main'): FontCoverageInput {
  return {
    text,
    direction: 'ltr',
    style: { fontFamily: 'Primary', fontSize: 18 },
    positions: Array.from({ length: text.length }, (_, i) => ({
      scope,
      nodeId: 'node-1',
      start: 1,
      end: 2,
      textStart: i,
      textEnd: i + 1
    }))
  }
}
afterEach(() => {
  managers.splice(0).forEach(value => value.destroy())
  vi.restoreAllMocks()
})

describe('current font coverage snapshots', () => {
  it('counts scalars, occurrences and locations without splitting surrogate pairs', async () => {
    const value = await manager()
    const tracker = new FontCoverageTracker()
    tracker.update(tracker.begin(), [input('𠀀𠀀汉')], value)
    expect(tracker.getReport().issues).toEqual([
      expect.objectContaining({
        script: 'hani',
        reason: 'missingFace',
        uniqueCount: 2,
        occurrenceCount: 3,
        missingCharacters: ['汉', '𠀀'],
        codePoints: ['U+20000', 'U+6C49'],
        locations: [
          {
            scope: 'main',
            nodeId: 'node-1',
            start: 1,
            end: 2,
            textStart: 0,
            textEnd: 5
          }
        ]
      })
    ])
  })

  it('counts repeated missing letters within a joining word', async () => {
    const value = await manager()
    const tracker = new FontCoverageTracker()
    tracker.update(tracker.begin(), [input('ممم')], value)
    expect(tracker.getReport().issues[0]).toMatchObject({
      missingCharacters: ['م'],
      uniqueCount: 1,
      occurrenceCount: 3
    })
  })

  it('keeps sequences intact and caps samples at sixteen graphemes', async () => {
    const value = await manager()
    const tracker = new FontCoverageTracker()
    tracker.update(
      tracker.begin(),
      [input('👨‍👩'), input('𠀀𠀁𠀂𠀃𠀄𠀅𠀆𠀇𠀈𠀉𠀊𠀋𠀌𠀍𠀎𠀏𠀐')],
      value
    )
    const issues = tracker.getReport().issues
    expect(issues.find(issue => issue.script === 'zsye')?.samples).toEqual([
      '👨‍👩'
    ])
    expect(issues.find(issue => issue.script === 'hani')?.samples).toHaveLength(
      16
    )
  })

  it('removes resolved and deleted issues and emits no event for repeated scans', async () => {
    const value = await manager()
    const changed = vi.fn()
    const tracker = new FontCoverageTracker(changed)
    const inputs = [input('مرحبا')]
    tracker.update(tracker.begin(), inputs, value)
    const before = tracker.getReport()
    tracker.update(tracker.begin(), inputs, value)
    expect(changed).toHaveBeenCalledTimes(1)
    expect(tracker.getReport()).toEqual(before)
    await value.registerFace({ family: 'Primary', data })
    tracker.update(tracker.begin(), inputs, value)
    expect(tracker.getReport()).toMatchObject({
      documentRevision: before.documentRevision,
      fontRevision: 1,
      issues: []
    })
    tracker.update(tracker.begin(), [input('汉')], value)
    tracker.update(tracker.begin(), [], value)
    expect(tracker.getReport().issues).toEqual([])
  })

  it('rejects stale generations and updates after destroy', async () => {
    const value = await manager()
    const tracker = new FontCoverageTracker()
    const stale = tracker.begin()
    tracker.update(tracker.begin(), [], value)
    expect(tracker.update(stale, [input('汉')], value)).toBe(false)
    expect(tracker.getReport().issues).toEqual([])
    tracker.destroy()
    expect(tracker.update(tracker.begin(), [input('汉')], value)).toBe(false)
  })

  it('returns detached snapshots and isolates editors', async () => {
    const value = await manager()
    const first = new FontCoverageTracker()
    const second = new FontCoverageTracker()
    first.update(first.begin(), [input('汉', 'td:cell')], value)
    const report = first.getReport()
    report.issues[0].locations[0].scope = 'modified'
    report.issues[0].missingCharacters.length = 0
    expect(first.getReport().issues[0].locations[0].scope).toBe('td:cell')
    expect(first.getReport().issues[0].missingCharacters).toEqual(['汉'])
    expect(second.getReport().issues).toEqual([])
  })

  it('ignores whitespace and isolates; style gaps remain distinct from character gaps', async () => {
    const value = await manager()
    await value.registerFace({ family: 'Primary', data })
    const tracker = new FontCoverageTracker()
    const arabic = input('مرحبا')
    arabic.style.bold = true
    tracker.update(
      tracker.begin(),
      [input(' \n\u2066\u2069\u200d'), arabic],
      value
    )
    expect(tracker.getReport().issues).toEqual([
      expect.objectContaining({
        reason: 'missingStyle',
        requestedWeight: 700,
        missingCharacters: [],
        missingSequences: [],
        uniqueCount: 0
      })
    ])
  })

  it('reports a load failure independently and removes it on successful retry', async () => {
    const value = await manager()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await value.registerFace({ family: 'Primary', data: new ArrayBuffer(2) })
    const tracker = new FontCoverageTracker()
    tracker.update(tracker.begin(), [input('مرحبا')], value)
    expect(
      tracker
        .getReport()
        .issues.map(issue => issue.reason)
        .sort()
    ).toEqual(['loadFailed', 'missingFace'])
    await value.registerFace({ family: 'Primary', data })
    tracker.update(tracker.begin(), [input('مرحبا')], value)
    expect(tracker.getReport().issues).toEqual([])
  })
})

describe('editable missing glyph geometry', () => {
  it.each([false, true])(
    'draws explicit placeholders without browser text calls (face=%s)',
    async loaded => {
      const value = await manager()
      if (loaded) await value.registerFace({ family: 'Primary', data })
      const measure = vi.spyOn(
        CanvasRenderingContext2D.prototype,
        'measureText'
      )
      const fill = vi.spyOn(CanvasRenderingContext2D.prototype, 'fillText')
      const glyphs = new HarfBuzzTextShaper(value).shape({
        ...input('𠀀'),
        textStart: 5,
        textEnd: 7,
        logicalIndexAt: () => 12
      })
      expect(glyphs).toHaveLength(1)
      const glyph = glyphs[0]
      expect(glyph).toMatchObject({
        charStart: 5,
        charEnd: 7,
        logicalIndexStart: 12,
        logicalIndexEnd: 12,
        missing: {
          kind: 'missingGlyph',
          text: '𠀀',
          metrics: { source: loaded ? 'notdef' : 'box' }
        }
      })
      expect(glyph.ax).toBeGreaterThan(0)
      const ctx = document.createElement('canvas').getContext('2d')!
      new GlyphRenderer().drawLine(
        ctx,
        {
          glyphs,
          width: glyph.ax,
          height: 30,
          ascent: 24,
          descent: 6,
          textStart: 5,
          textEnd: 7,
          logicalStart: 12,
          logicalEnd: 12,
          direction: 'ltr',
          shiftX: 0
        },
        0,
        24,
        'xxxxx𠀀'
      )
      expect(measure).not.toHaveBeenCalled()
      expect(fill).not.toHaveBeenCalled()
    }
  )
})
