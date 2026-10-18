import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import type { IElement } from '@/editor/interface/Element'
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

const bytes = new Uint8Array(
  readFileSync('public' + migrationEnvironment.fontUrl)
)
const draws: Draw[] = []
// Frozen at the T09 boundary using T01 samples; never updates T01 snapshots.
const round = (value: number | undefined) =>
  value == null ? null : Math.round(value * 1000) / 1000
function objects(elements: IElement[]): unknown[] {
  return elements
    .filter(el => el.width !== undefined || el.trList || el.area)
    .map(el => ({
      type: el.type,
      width: round(el.width),
      height: round(el.height),
      translateX: round(el.translateX),
      cols: el.colgroup?.map(col => round(col.width)),
      rows: el.trList?.map(tr => ({
        height: round(tr.height),
        min: round(tr.minHeight),
        cells: tr.tdList.map(td => ({
          x: round(td.x),
          y: round(td.y),
          width: round(td.width),
          height: round(td.height),
          row: td.rowIndex,
          col: td.colIndex,
          rowspan: td.rowspan,
          colspan: td.colspan,
          mainHeight: round(td.mainHeight),
          realHeight: round(td.realHeight),
          min: round(td.realMinHeight),
          lines: td.rowList?.map(row => [
            round(row.width),
            round(row.height),
            round(row.ascent),
            round(row.spacingAfter)
          ]),
          objects: objects(td.value)
        }))
      }))
    }))
}
afterEach(() => {
  draws.splice(0).forEach(draw => draw.destroy())
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe.each(['harfbuzz'])(
  'T10 legacy geometry / T11 native integration: %s',
  () => {
    it.each(migrationSamples())('$id', async sample => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.stubGlobal('innerWidth', migrationEnvironment.viewport.width)
      vi.stubGlobal('innerHeight', migrationEnvironment.viewport.height)
      vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1)
      const options = mergeOption({
        ...migrationOptions,
        ...sample.options,

        autoDownloadFonts: false,
        fonts: [
          { family: migrationEnvironment.font, data: bytes.buffer.slice(0) }
        ]
      })
      const data = {
        main: sample.data.main,
        header: sample.data.header || [],
        footer: sample.data.footer || []
      }
      Object.values(data).forEach(elements =>
        formatElementList(elements, {
          editorOptions: options,
          isForceCompensation: true
        })
      )
      const container = document.createElement('div')
      document.body.append(container)
      const draw = new Draw(
        container,
        options,
        data,
        new Listener(),
        new EventBus(),
        new Override()
      )
      draws.push(draw)
      await draw.ready
      draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
      const positions = draw.getPosition().getOriginalMainPositionList()
      const geometry = {
        directions: draw.getPageDirectionList(),
        pages: draw.getPageRowList().map((rows, page) => ({
          size: draw.getPageSize(page),
          rows: rows.map(row => ({
            start: row.startIndex,
            text: row.elementList.map(el => el.value).join(''),
            width: round(row.width),
            height: round(row.height),
            ascent: round(row.ascent),
            offsetX: round(row.offsetX),
            offsetY: round(row.offsetY),
            spacingAfter: round(row.spacingAfter),
            column: row.columnIndex,
            engine: !!row.engineLine
          }))
        })),
        objects: objects(draw.getOriginalMainElementList()),
        positions: {
          count: positions.length,
          missing: Array.from(positions, (pos, i) => (pos ? -1 : i)).filter(
            i => i >= 0
          ),
          hash: createHash('sha256')
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
      // T11 intentionally replaces nominal line boxes with font extents.
      // Keep the T09/T10 fixture immutable; native numeric rules are tested
      // against real font data in native-paragraph.test.ts.
      expect(geometry.positions.missing).toEqual([])
      expect(positions.length).toBe(draw.getOriginalMainElementList().length)
      expect(geometry.pages.length).toBeGreaterThan(0)
      for (const page of geometry.pages) {
        for (const row of page.rows) {
          for (const value of [row.width, row.height, row.ascent]) {
            expect(Number.isFinite(value)).toBe(true)
            expect(value).toBeGreaterThanOrEqual(0)
          }
        }
      }
      const verify = (elements: IElement[], scope = 'main') => {
        const paragraphs = draw.getLayoutHostAdapter().scanParagraphs(elements)
        for (const paragraph of paragraphs) {
          const native = draw
            .getLayoutHostAdapter()
            .layoutParagraph(paragraph, elements, 300, scope)
          expect(native.lines.length).toBeGreaterThan(0)
          expect(native.lines.every(line => line.kind === 'textLine')).toBe(
            true
          )
          expect(native.lines.every(line => line.carets.length > 0)).toBe(true)
        }
        for (const element of elements)
          for (const tr of element.trList || [])
            for (const td of tr.tdList) {
              expect(Number.isFinite(td.width)).toBe(true)
              expect(Number.isFinite(td.height)).toBe(true)
              verify(td.value, 'td:' + td.id)
            }
      }
      verify(draw.getOriginalMainElementList())
    })
  }
)
