import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  migrationEnvironment,
  migrationOptions,
  migrationSamples
} from '../../fixtures/migration/documents'

const font = readFileSync('public' + migrationEnvironment.fontUrl)
const fontData = font.buffer.slice(
  font.byteOffset,
  font.byteOffset + font.byteLength
)
const draws: Draw[] = []
afterEach(() => {
  draws.forEach(draw => draw.destroy())
  draws.length = 0
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// Rounded semantic geometry excludes random IDs and volatile glyph caches.
const round = (value: number) => Math.round(value * 1000) / 1000

describe.each(['harfbuzz'])('migration baseline: %s', () => {
  it.each(migrationSamples())('$id', async sample => {
    vi.stubGlobal('innerWidth', migrationEnvironment.viewport.width)
    vi.stubGlobal('innerHeight', migrationEnvironment.viewport.height)
    expect(createHash('sha256').update(font).digest('hex')).toBe(
      '67b5a525a661b607971fbd3f96a81b89d3a768e74534fca84f18ac97e6fab72f'
    )
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1)
    const options = mergeOption({
      ...migrationOptions,
      ...sample.options,

      autoDownloadFonts: false,
      fonts: [{ family: migrationEnvironment.font, data: fontData }]
    })
    const data = {
      header: sample.data.header || [],
      main: sample.data.main,
      footer: sample.data.footer || []
    }
    for (const elements of Object.values(data)) {
      formatElementList(elements, {
        editorOptions: options,
        isForceCompensation: true
      })
    }
    const container = document.createElement('div')
    document.body.appendChild(container)
    const draw = new Draw(
      container,
      options,
      data,
      new Listener(),
      new EventBus(),
      new Override()
    )
    draws.push(draw)
    await draw.getLayoutHostAdapter().ensureReady()
    draw.render({
      isLazy: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    const positions = draw.getPosition().getOriginalMainPositionList()
    expect(positions.length).toBeGreaterThan(0)
    for (const pos of positions.filter(Boolean)) {
      expect(pos.lineHeight).toBeGreaterThanOrEqual(0)
      expect(pos.coordinate.leftTop.every(Number.isFinite)).toBe(true)
    }
    const geometry = {
      directions: draw.getPageDirectionList(),
      pages: draw.getPageRowList().map((rows, pageNo) => ({
        size: draw.getPageSize(pageNo),
        rows: rows.map(row => ({
          start: row.startIndex,
          text: row.elementList.map(el => el.value).join(''),
          width: round(row.width),
          height: round(row.height),
          ascent: round(row.ascent),
          spacingAfter: round(row.spacingAfter || 0),
          engine: !!row.engineLine
        }))
      })),
      positions: {
        count: positions.length,
        missing: Array.from(positions, (pos, index) =>
          pos ? -1 : index
        ).filter(index => index >= 0),
        // Pin every coordinate without a huge unreadable per-character dump.
        sha256: createHash('sha256')
          .update(
            JSON.stringify(
              Array.from(positions, pos =>
                pos
                  ? {
                      index: pos.index,
                      page: pos.pageNo,
                      row: pos.rowNo,
                      bounds: [
                        pos.coordinate.leftTop,
                        pos.coordinate.rightBottom
                      ].map(point => point.map(round))
                    }
                  : null
              )
            )
          )
          .digest('hex')
      }
    }
    // T01 snapshots remain frozen historical evidence; only native invariants
    // are executable after removing the legacy implementation in T20.
    expect(geometry.positions.missing).toEqual([])
    expect(geometry.pages.length).toBeGreaterThan(0)
    for (const page of geometry.pages)
      for (const row of page.rows)
        for (const value of [row.width, row.height, row.ascent])
          expect(Number.isFinite(value)).toBe(true)
    const before = draw.getValue().data
    draw.render({
      isCompute: false,
      isLazy: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    expect(draw.getValue().data).toEqual(before)
  })
})
