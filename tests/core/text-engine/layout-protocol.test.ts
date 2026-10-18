import type {
  BlockBox,
  BreakNode,
  DocumentLayout,
  FontCoverageIssue,
  FontCoverageReport,
  InlineObject,
  LayoutNode,
  LayoutSource,
  MissingGlyphBox,
  TableFragment,
  TextLine
} from '@/editor'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import {
  getLayoutBaseline,
  getLayoutFlowHeight,
  getLayoutSourceKey,
  isCurrentLayoutRevision
} from '@/editor/core/text-engine/layout/layoutProtocol'
import type { EventBusMap } from '@/editor/interface/EventBus'
import { describe, expect, expectTypeOf, it } from 'vitest'

const revision = { documentRevision: 3, fontRevision: 2 }
const source: LayoutSource = {
  scope: 'main',
  nodeId: 'paragraph-1',
  start: 0,
  end: 1
}
const caret = {
  position: { elementIndex: 0, offset: 0 },
  affinity: 'downstream' as const,
  x: 20,
  y: 40,
  height: 24,
  bidiLevel: 0
}
const base = {
  id: 'layout-1',
  source,
  revision,
  rect: { x: 20, y: 40, width: 0, height: 24 },
  hidden: false
}
const emptyLine: TextLine = {
  ...base,
  kind: 'textLine',
  paragraphId: source.nodeId,
  direction: 'ltr',
  baseline: 18,
  contentHeight: 24,
  spacingBefore: 8,
  spacingAfter: 16,
  glyphs: [],
  clusters: [],
  inlines: [],
  carets: [caret],
  empty: true
}

describe('native layout protocol', () => {
  it('keeps empty-paragraph caret/content height separate from paragraph spacing', () => {
    expect(getLayoutFlowHeight(emptyLine)).toBe(48)
    expect(getLayoutBaseline(emptyLine)).toBe(58)
    expect(emptyLine.rect).toEqual({ x: 20, y: 40, width: 0, height: 24 })
    expect(emptyLine.carets[0].height).toBe(24)
  })

  it('collapses hidden nodes without losing logical source identity', () => {
    const hidden = { ...emptyLine, hidden: true }
    expect(getLayoutFlowHeight(hidden)).toBe(0)
    expect(getLayoutSourceKey(hidden.source)).toBe(getLayoutSourceKey(source))
  })

  it('represents objects and original missing sequences without fake text glyphs', () => {
    const image: InlineObject = {
      ...base,
      kind: 'inlineObject',
      objectType: 'image',
      advance: 32,
      rect: { ...base.rect, width: 32 },
      ascent: 24,
      descent: 0,
      anchor: caret
    }
    const text = '👨‍👩‍👧‍👦'
    const missing: MissingGlyphBox = {
      ...base,
      kind: 'missingGlyph',
      text,
      diagnosticId: 'missing-emoji',
      rect: { ...base.rect, width: 24 },
      advance: 24,
      carets: [
        caret,
        {
          ...caret,
          position: { elementIndex: 0, offset: text.length },
          x: 44
        }
      ]
    }
    const line: TextLine = {
      ...emptyLine,
      empty: false,
      inlines: [image, missing]
    }
    expect(line.inlines.map(node => node.kind)).toEqual([
      'inlineObject',
      'missingGlyph'
    ])
    expect(getLayoutFlowHeight(image)).toBe(24)
    expect(missing.text).toBe(text)
    // Only legal sequence endpoints are represented, never surrogate halves.
    expect(missing.carets.map(stop => stop.position.offset)).toEqual([0, 11])
    expectTypeOf<InlineObject>().not.toMatchTypeOf<TextLine>()
    expectTypeOf<MissingGlyphBox>().not.toMatchTypeOf<TextLine>()
  })

  it('represents split table rows and repeated headers independently', () => {
    const fragment: TableFragment = {
      ...base,
      kind: 'tableFragment',
      tableId: 'table-1',
      pageNo: 1,
      startRow: 2,
      endRow: 4,
      startRowOffset: 30,
      endRowOffset: 50,
      repeatedRows: [0],
      cells: []
    }
    const next: TableFragment = {
      ...fragment,
      id: 'layout-2',
      pageNo: 2,
      startRow: 3,
      endRow: 5,
      startRowOffset: 50,
      endRowOffset: null
    }
    const layout: DocumentLayout = {
      revision,
      scopes: [
        {
          id: 'main',
          kind: 'main',
          rect: base.rect,
          children: [fragment, next]
        }
      ],
      pages: []
    }
    expect(layout.scopes[0].children.map(node => node.kind)).toEqual([
      'tableFragment',
      'tableFragment'
    ])
    expect(fragment.repeatedRows).toEqual([0])
    expect(next.startRowOffset).toBe(fragment.endRowOffset)
    expect(getLayoutFlowHeight(fragment)).toBe(24)
  })

  it('dispatches breaks and blocks by kind, without testing engineLine presence', () => {
    const block: BlockBox = {
      ...base,
      kind: 'block',
      blockType: 'area',
      children: []
    }
    const pageBreak: BreakNode = {
      ...base,
      kind: 'break',
      breakType: 'page',
      rect: { ...base.rect, height: 0 },
      paperDirection: 'horizontal',
      caret
    }
    const node: LayoutNode = pageBreak
    expect(node.kind).toBe('break')
    expect(getLayoutFlowHeight(node)).toBe(0)
    expect(getLayoutFlowHeight(block)).toBe(24)
  })

  it.each([
    [{ documentRevision: 3, fontRevision: 2 }, true],
    [{ documentRevision: 2, fontRevision: 2 }, false],
    [{ documentRevision: 3, fontRevision: 1 }, false],
    [{ documentRevision: 4, fontRevision: 2 }, false]
  ])(
    'rejects stale or future layout/coverage revisions: %j',
    (result, current) => {
      expect(isCurrentLayoutRevision(result, revision)).toBe(current)
    }
  )

  it('isolates cell-local sources and delimiter-containing IDs', () => {
    expect(getLayoutSourceKey(source)).not.toBe(
      getLayoutSourceKey({ ...source, scope: 'td:cell-1' })
    )
    expect(
      getLayoutSourceKey({ ...source, scope: 'a|b', nodeId: 'c' })
    ).not.toBe(getLayoutSourceKey({ ...source, scope: 'a', nodeId: 'b|c' }))
  })

  it('carries scalar diagnostics and download state in a current snapshot', () => {
    const issue: FontCoverageIssue = {
      id: 'missing-han',
      reason: 'missingGlyph',
      script: 'hani',
      categoryLabel: 'fontCoverage.han',
      requestedFamily: 'Example',
      attemptedFaces: ['example-400-fragment-1'],
      missingCharacters: ['𠀀'],
      missingSequences: [],
      codePoints: ['U+20000'],
      samples: ['𠀀'],
      uniqueCount: 1,
      occurrenceCount: 2,
      locations: [{ ...source, textStart: 0, textEnd: 2 }],
      downloadStatus: 'disabled',
      attemptedDownloads: []
    }
    const report: FontCoverageReport = {
      ...revision,
      autoDownloadFonts: false,
      issues: [issue]
    }
    expect(isCurrentLayoutRevision(report, revision)).toBe(true)
    expect(report.issues[0].reason).toBe('missingGlyph')
    expectTypeOf<
      Extract<FontCoverageIssue, { reason: 'loadFailed' }>
    >().toHaveProperty('failure')
  })

  it('uses the snapshot as an EventBus callback payload', () => {
    const bus = new EventBus<EventBusMap>()
    const reports: FontCoverageReport[] = []
    const listener = (report: FontCoverageReport) => reports.push(report)
    const report: FontCoverageReport = {
      ...revision,
      autoDownloadFonts: false,
      issues: []
    }
    bus.on('fontCoverageChange', listener)
    bus.emit('fontCoverageChange', report)
    expect(reports).toEqual([report])
    bus.off('fontCoverageChange', listener)
    bus.emit('fontCoverageChange', report)
    expect(reports).toHaveLength(1)
  })
})
