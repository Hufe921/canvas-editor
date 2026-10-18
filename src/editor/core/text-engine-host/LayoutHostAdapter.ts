import type { LayoutRow } from '../../interface/LayoutRow'
import type { IEditorFontFace } from '../../interface/TextEngine'
import { isElementLayoutHidden } from '../../utils/element'
import { EditorRuntimeError } from '../EditorLifecycle'
import { IncrementalParagraphComputer } from '../draw/IncrementalParagraphComputer'
import { measureInlineImage } from '../layout/InlineObjectMeasure'
import {
  resolveRowMargin,
  resolveSpacingAfter,
  resolveSpacingBefore
} from '../layout/ParagraphStyleResolver'
import { snapshotRows } from '../layout/rowSnapshot'
import { translateLayout } from '../layout/translateLayout'
import type { FontCoverageInput } from '../text-engine/font/FontCoverageTracker'
import {
  NativeParagraphLayout,
  TextLayoutService
} from '../text-engine/layout/TextLayoutService'
import { collectListMarkers } from './ListMarker'
import { createTextRows } from './createTextRows'
import { scaleShapedLine } from './scaleShapedLine'
import { WordBreak } from '../../dataset/enum/Editor'
import { RowFlex } from '../../dataset/enum/Row'
import { TextDirection } from '../../dataset/enum/TextDirection'
import { IEditorOption } from '../../interface/Editor'
import { IElement } from '../../interface/Element'
import { DeepRequired } from '../../interface/Common'
import {
  BidiResolver,
  FontManager,
  GlyphRenderer,
  HarfBuzzTextShaper,
  LayoutCache,
  TextLayoutEngine,
  resolveDirection
} from '../text-engine'
import {
  detectScript,
  resolveFontForScript
} from '../text-engine/utils/scriptFont'
import { LayoutResult, TextSpan, TextStyleProps } from '../text-engine/types'
import { ElementBridge, ParagraphSpan } from './ElementBridge'
import { HitTestAdapter } from './HitTestAdapter'

function resolveAlign(
  rowFlex: RowFlex | undefined,
  direction: 'ltr' | 'rtl'
): 'left' | 'right' | 'center' | 'justify' | 'alignment' {
  if (rowFlex === RowFlex.START) {
    return direction === 'rtl' ? 'right' : 'left'
  }
  if (rowFlex === RowFlex.END) {
    return direction === 'rtl' ? 'left' : 'right'
  }
  if (rowFlex === RowFlex.CENTER) return 'center'
  if (rowFlex === RowFlex.RIGHT) return 'right'
  if (rowFlex === RowFlex.LEFT) return 'left'
  if (rowFlex === RowFlex.JUSTIFY) return 'justify'
  if (rowFlex === RowFlex.ALIGNMENT) return 'alignment'
  // Default: align to paragraph start (RTL → right)
  return direction === 'rtl' ? 'right' : 'left'
}

/** lastLayouts key: `{scope}|p:{start}-{end}` — isolate main / header / footer / td */
export const DEFAULT_LAYOUT_SCOPE = 'main'

export function layoutLastKey(
  scope: string,
  startIndex: number,
  endIndex: number
): string {
  return `${scope || DEFAULT_LAYOUT_SCOPE}|p:${startIndex}-${endIndex}`
}

/** Resolve layoutScope from editor zone and optional table cell context. */
export function resolveLayoutScope(params: {
  zone?: string
  isTable?: boolean
  tdId?: string | null
  paperDirection?: string
}): string {
  if (params.isTable && params.tdId) {
    return params.paperDirection &&
      (params.zone === 'header' || params.zone === 'footer')
      ? `${params.zone}:${params.paperDirection}/td:${params.tdId}`
      : `td:${params.tdId}`
  }
  if (params.zone === 'header' || params.zone === 'footer') {
    return params.paperDirection
      ? `${params.zone}:${params.paperDirection}`
      : params.zone
  }
  return DEFAULT_LAYOUT_SCOPE
}

export interface LayoutHideContext {
  isDesignMode: boolean
  isAreaHideDisabled: boolean
  isTraceHidden: (el: IElement) => boolean
}

export class LayoutHostAdapter {
  private sourceIds = new WeakMap<object, string>()
  private sourceSequence = 0

  private sourceId(node: object): string {
    let id = this.sourceIds.get(node)
    if (!id) {
      id = `font-source-${++this.sourceSequence}`
      this.sourceIds.set(node, id)
    }
    return id
  }

  matchesSource(element: IElement, nodeId: string) {
    return this.sourceIds.get(element) === nodeId
  }

  private fontManager = new FontManager(() => this.invalidate())
  private bridge = new ElementBridge()
  private hitTest = new HitTestAdapter()
  private cache = new LayoutCache()
  private glyphRenderer = new GlyphRenderer(this.fontManager)
  private engine: TextLayoutEngine | null = null
  private nativeCache = new IncrementalParagraphComputer()
  private service: TextLayoutService | null = null
  private initPromise: Promise<void> | null = null
  private lastLayouts = new Map<string, LayoutResult>()
  private revision = 0
  private destroyed = false

  constructor(
    private getOptions: () => DeepRequired<IEditorOption>,
    private getHideContext?: () => LayoutHideContext
  ) {}

  private sourcePositions(
    paragraph: ParagraphSpan,
    elements: IElement[],
    scope: string
  ): import('../../interface/FontCoverage').FontCoverageLocation[] {
    const offsets = new Map<number, number>()
    return paragraph.spans.flatMap(span =>
      Array.from({ length: span.text.length }, (_, i) => {
        const index = span.logicalIndices?.[i] ?? span.logicalIndex
        const element = elements[index]
        const offset = offsets.get(index) || 0
        const synthetic =
          /^[\u2066-\u2069]$/.test(span.text[i]) &&
          !element.value.includes(span.text[i])
        if (!synthetic) offsets.set(index, offset + 1)
        return {
          scope,
          nodeId: this.sourceId(element),
          start: index,
          end: index + 1,
          textStart: offset,
          textEnd: offset + (synthetic ? 0 : 1)
        }
      })
    )
  }

  /** Configuration chrome has no selectable document range (start === end). */
  collectPlainTextCoverage(
    params: {
      text: string
      fontFamily: string
      fontSize: number
      color: string
    },
    source: import('../../interface/Layout').LayoutSource
  ): FontCoverageInput[] {
    const spans = this.buildPlainTextSpans(
      params.text,
      params.fontFamily,
      params.fontSize,
      params.color
    )
    const direction = resolveDirection(TextDirection.AUTO, params.text, 'ltr')
    const positions = Array.from(
      { length: params.text.length },
      (_, index) => ({
        ...source,
        textStart: index,
        textEnd: index + 1
      })
    )
    return (this.engine?.getShapingRuns(spans, direction) || []).map(run => ({
      text: run.text,
      style: run.style,
      direction: run.direction,
      positions: positions.slice(run.textStart, run.textEnd)
    }))
  }

  collectFontCoverage(
    roots: { scope: string; elements: IElement[] }[],
    auxiliary?: (
      element: IElement
    ) => { text: string; fontFamily: string; fontSize: number; color: string }[]
  ): FontCoverageInput[] {
    const inputs: FontCoverageInput[] = []
    const hide = this.getHideContext?.()
    const visit = (elements: IElement[], scope: string) => {
      for (const marker of collectListMarkers(elements)) {
        if (!marker.text || isElementLayoutHidden(marker.anchor, hide || {}))
          continue
        const native = this.layoutListMarker(
          elements,
          marker.anchor,
          marker.text,
          'ltr'
        )
        const style = native.shaped.lines[0]?.glyphs[0]?.style
        if (style)
          inputs.push({
            text: marker.text,
            style,
            direction: 'ltr',
            positions: Array.from({ length: marker.text.length }, () => ({
              scope,
              nodeId: this.sourceId(marker.anchor),
              start: marker.sourceIndex,
              end: marker.sourceIndex + 1,
              textStart: 0,
              textEnd: 0
            }))
          })
      }
      for (const paragraph of this.scanParagraphs(elements)) {
        const positions = this.sourcePositions(paragraph, elements, scope)
        const runs =
          this.engine?.getShapingRuns(paragraph.spans, paragraph.direction) ||
          []
        for (const run of runs) {
          if (run.style.objectWidth != null) continue
          inputs.push({
            text: run.text,
            style: run.style,
            direction: run.direction,
            positions: positions.slice(run.textStart, run.textEnd)
          })
        }
      }
      for (const [index, element] of elements.entries()) {
        if (
          isElementLayoutHidden(element, {
            isDesignMode: hide?.isDesignMode,
            isAreaHideDisabled: hide?.isAreaHideDisabled,
            isTraceHidden: hide?.isTraceHidden
          })
        )
          continue
        for (const text of auxiliary?.(element) || []) {
          inputs.push(
            ...this.collectPlainTextCoverage(text, {
              scope,
              nodeId: this.sourceId(element),
              start: index,
              end: index + 1
            })
          )
        }
        for (const row of element.trList || []) {
          for (const cell of row.tdList) {
            visit(cell.value, `td:${cell.id || this.sourceId(cell)}`)
          }
        }
      }
    }
    for (const root of roots) visit(root.elements, root.scope)
    return inputs
  }

  getFontManager(): FontManager {
    return this.fontManager
  }

  async registerFonts(faces: IEditorFontFace[]) {
    if (this.destroyed) throw new EditorRuntimeError('EDITOR_DESTROYED')
    await this.ensureReady()
    const results = []
    for (const face of faces)
      results.push(await this.fontManager.registerFace(face))
    return results
  }

  getHitTest(): HitTestAdapter {
    return this.hitTest
  }

  getGlyphRenderer(): GlyphRenderer {
    return this.glyphRenderer
  }

  getLayout(key: string): LayoutResult | undefined {
    return this.lastLayouts.get(key) || this.cache.get(key)
  }

  getRevision(): number {
    return this.revision
  }

  replaceParagraphLayouts(
    scope: string,
    layouts: { startIndex: number; endIndex: number; layout: LayoutResult }[]
  ) {
    for (const key of this.lastLayouts.keys()) {
      if (key.startsWith(`${scope}|p:`)) this.lastLayouts.delete(key)
    }
    for (const { startIndex, endIndex, layout } of layouts) {
      this.lastLayouts.set(layoutLastKey(scope, startIndex, endIndex), layout)
    }
  }

  releaseScope(scope: string) {
    for (const key of this.lastLayouts.keys())
      if (key.startsWith(`${scope}|`) || key.startsWith(`${scope}/`))
        this.lastLayouts.delete(key)
    this.nativeCache.releaseScope(scope)
  }

  findLayoutByElementIndex(
    index: number,
    layoutScope: string = DEFAULT_LAYOUT_SCOPE
  ): { layout: LayoutResult; paraStart: number; paraEnd: number } | undefined {
    const scope = layoutScope || DEFAULT_LAYOUT_SCOPE
    const prefix = `${scope}|p:`
    for (const [key, layout] of this.lastLayouts) {
      if (!key.startsWith(prefix)) continue
      const paraMatch = /\|p:(\d+)-(\d+)$/.exec(key)
      if (!paraMatch) continue
      const paraStart = Number(paraMatch[1])
      const paraEnd = Number(paraMatch[2])
      if (index >= paraStart && index <= paraEnd) {
        return { layout, paraStart, paraEnd }
      }
    }
    return undefined
  }

  visualNeighbor(
    logicalIndex: number,
    delta: 1 | -1,
    layoutScope: string = DEFAULT_LAYOUT_SCOPE
  ): number | null {
    const found = this.findLayoutByElementIndex(logicalIndex, layoutScope)
    if (!found) return null
    return this.hitTest.visualNeighbor(
      found.layout,
      logicalIndex,
      delta,
      found.paraStart
    )
  }

  isReady(): boolean {
    return !!this.engine
  }

  async ensureReady(): Promise<void> {
    if (this.destroyed) throw new EditorRuntimeError('EDITOR_DESTROYED')
    if (this.engine) return
    if (this.initPromise) return this.initPromise
    this.initPromise = (async () => {
      const options = this.getOptions()
      await this.fontManager.init(options.fonts || [], options.defaultFont)
      if (this.destroyed) throw new EditorRuntimeError('EDITOR_DESTROYED')
      const shaper = new HarfBuzzTextShaper(this.fontManager)
      this.engine = new TextLayoutEngine(new BidiResolver(), shaper)
      this.service = new TextLayoutService(this.engine, this.fontManager)
      this.invalidate()
    })()
    return this.initPromise
  }

  getTextLayoutService(): TextLayoutService {
    if (!this.service) throw new EditorRuntimeError('EDITOR_NOT_READY')
    return this.service
  }

  private unscaledSpans(spans: TextSpan[], scale: number): TextSpan[] {
    return spans.map(span => ({
      ...span,
      style: {
        ...span.style,
        fontSize: span.style.fontSize / scale,
        padding: span.style.padding?.map(v => v / scale),
        letterSpacing: (span.style.letterSpacing || 0) / scale,
        rowMargin: (span.style.rowMargin || 0) / scale,
        explicitWidth:
          span.style.explicitWidth == null
            ? undefined
            : span.style.explicitWidth / scale,
        objectWidth:
          span.style.objectWidth == null
            ? undefined
            : span.style.objectWidth / scale,
        objectHeight:
          span.style.objectHeight == null
            ? undefined
            : span.style.objectHeight / scale
      }
    }))
  }

  /** Intrinsic measurement without replacing the painted paragraph handles. */
  measureParagraph(paragraph: ParagraphSpan) {
    const options = this.getOptions()
    return this.getTextLayoutService().measureText({
      spans: this.unscaledSpans(paragraph.spans, options.scale || 1),
      availableWidth: Infinity,
      direction: paragraph.direction,
      align: 'left',
      lineHeight: options.defaultSize,
      lineHeightFactor: 1
    })
  }

  layoutListMarker(
    elements: IElement[],
    anchor: IElement,
    text: string,
    direction: 'ltr' | 'rtl'
  ) {
    const options = this.getOptions()
    const styled = options.list.inheritStyle
      ? elements.find(
          el =>
            el.listId === anchor.listId &&
            (el.font || el.size || el.bold || el.italic)
        ) || anchor
      : undefined
    const style: TextStyleProps = {
      fontFamily: styled?.font || options.defaultFont,
      fontSize: styled?.size || options.defaultSize,
      bold: styled?.bold,
      italic: styled?.italic,
      color: styled?.color || options.defaultColor
    }
    return this.getTextLayoutService().layoutParagraph({
      spans: [{ text, style, logicalIndex: 0 }],
      availableWidth: 1e9,
      direction,
      align: 'left',
      lineHeight: style.fontSize,
      lineHeightFactor: 1,
      source: {
        scope: 'listMarker',
        nodeId: this.sourceId(anchor),
        start: 0,
        end: 1
      },
      revision: {
        documentRevision: this.revision,
        fontRevision: this.fontManager.getRevision()
      },
      positions: Array.from({ length: text.length }, () => ({
        start: 0,
        textStart: 0,
        textEnd: 0
      })),
      emptyStyle: style
    })
  }

  /** Caption geometry shares the exact font line box used by its painter. */
  layoutCaption(element: IElement, text: string): LayoutResult {
    const options = this.getOptions()
    const caption = element.imgCaption
    const size = caption?.size || options.imgCaption.size
    const family = caption?.font || options.imgCaption.font
    const spans = this.buildPlainTextSpans(
      text,
      family,
      size,
      caption?.color || options.imgCaption.color
    )
    return this.getTextLayoutService().layoutSingleLine({
      spans,
      availableWidth: Infinity,
      direction: resolveDirection(TextDirection.AUTO, text, 'ltr'),
      align: 'left',
      lineHeight: size,
      lineHeightFactor: 1,
      source: {
        scope: 'caption',
        nodeId: this.sourceId(element),
        start: 0,
        end: 1
      },
      revision: {
        documentRevision: this.revision,
        fontRevision: this.fontManager.getRevision()
      },
      positions: Array.from({ length: text.length }, (_, i) => ({
        start: 0,
        textStart: i,
        textEnd: i + 1
      })),
      emptyStyle: { fontFamily: family, fontSize: size }
    }).shaped
  }

  /** Native entry: no LayoutRow construction and no legacy row mapper. */
  layoutParagraph(
    paragraph: ParagraphSpan,
    elementList: IElement[],
    availableWidth: number,
    layoutScope: string = DEFAULT_LAYOUT_SCOPE,
    defaultAlign?: 'left' | 'right',
    markerGutter?: number,
    constraints?: { widths: number[]; offsets: number[] }
  ): NativeParagraphLayout {
    const options = this.getOptions()
    const scale = options.scale || 1
    const first = elementList[paragraph.startIndex]
    const last = elementList[paragraph.endIndex]
    const next = elementList[paragraph.endIndex + 1]
    const spans = this.unscaledSpans(paragraph.spans, scale)
    for (const span of spans) {
      const style = span.style
      if (
        style.hidden ||
        (style.objectType !== 'image' && style.objectType !== 'latex')
      )
        continue
      const element = elementList[span.logicalIndex]
      const measured = measureInlineImage(
        {
          width: element.width || 0,
          height: element.height || 0,
          display: element.imgDisplay
        },
        {
          availableWidth: availableWidth / scale,
          scale: 1,
          caption: options.imgCaption
        }
      )
      if (measured.adaptedSize) Object.assign(element, measured.adaptedSize)
      style.objectWidth = measured.metrics.width
      style.objectHeight = measured.metrics.height
      style.objectCaptionHeight = element.imgCaption?.value
        ? (element.imgCaption.top ?? options.imgCaption.top) +
          this.layoutCaption(element, element.imgCaption.value).lines[0].height
        : 0
    }
    const emptyStyle = {
      fontFamily: first?.font || options.defaultFont,
      fontSize: first?.size || options.defaultSize,
      bold: first?.bold,
      italic: first?.italic,
      hidden: first
        ? isElementLayoutHidden(first, this.getHideContext?.() || {})
        : false,
      rowMargin: resolveRowMargin(first || {}, { ...options, scale: 1 })
    }
    const input: import('../text-engine/layout/TextLayoutService').NativeParagraphInput =
      {
        spans,
        availableWidth: availableWidth / scale,
        lineWidths: constraints?.widths,
        lineOffsets: constraints?.offsets,
        direction: paragraph.direction,
        align:
          paragraph.rowFlex === undefined && defaultAlign
            ? defaultAlign
            : resolveAlign(paragraph.rowFlex, paragraph.direction),
        lineHeight: emptyStyle.fontSize,
        lineHeightFactor: 1,
        wordBreak:
          options.wordBreak === WordBreak.BREAK_ALL
            ? ('break-all' as const)
            : ('break-word' as const),
        source: {
          scope: layoutScope,
          nodeId: this.sourceId(first || paragraph),
          start: paragraph.startIndex,
          end: paragraph.endIndex + 1
        },
        revision: {
          documentRevision: this.revision,
          fontRevision: this.fontManager.getRevision()
        },
        positions: this.sourcePositions(paragraph, elementList, layoutScope),
        emptyStyle,
        spacingBefore: first
          ? resolveSpacingBefore(
              first,
              elementList[paragraph.startIndex + 1],
              1
            )
          : 0,
        spacingAfter:
          next?.value === '\u200B' && !next.listWrap
            ? resolveSpacingAfter(last, 1)
            : 0
      }
    let result = options.lab?.incrementalCompute
      ? this.nativeCache.compute(input, value =>
          this.getTextLayoutService().layoutParagraph(value)
        )
      : this.getTextLayoutService().layoutParagraph(input)
    const marker = collectListMarkers(elementList).find(
      item => item.sourceIndex === paragraph.startIndex
    )
    if (marker?.text && !result.lines[0].hidden) {
      const markerLayout = this.layoutListMarker(
        elementList,
        marker.anchor,
        marker.text,
        paragraph.direction
      )
      const markerLine = markerLayout.lines[0]
      const markerAvailable = constraints?.widths[0] ?? availableWidth / scale
      const markerOffset = constraints?.offsets[0] || 0
      const offset =
        markerOffset +
        (paragraph.direction === 'rtl'
          ? markerAvailable +
            (markerGutter || markerLine.rect.width + 10) -
            markerLine.rect.width
          : -(markerGutter || markerLine.rect.width + 10))
      const nativeMarker = translateLayout(
        [markerLine],
        offset,
        result.lines[0].rect.y + result.lines[0].baseline - markerLine.baseline
      )[0] as typeof markerLine
      nativeMarker.source = {
        ...result.lines[0].source,
        start: marker.sourceIndex,
        end: marker.sourceIndex + 1
      }
      const remapCaret = (caret: (typeof nativeMarker.carets)[number]) => ({
        ...caret,
        position: { elementIndex: marker.sourceIndex, offset: 0 }
      })
      nativeMarker.carets = nativeMarker.carets.map(remapCaret)
      nativeMarker.clusters = nativeMarker.clusters.map(c => ({
        ...c,
        logicalIndices: [marker.sourceIndex],
        carets: c.carets.map(remapCaret)
      }))
      nativeMarker.inlines = nativeMarker.inlines.map(item => ({
        ...item,
        source: { ...nativeMarker.source },
        ...(item.kind === 'missingGlyph'
          ? { carets: item.carets.map(remapCaret) }
          : { anchor: remapCaret(item.anchor) })
      }))

      result = {
        ...result,
        lines: [
          { ...result.lines[0], marker: nativeMarker },
          ...result.lines.slice(1)
        ]
      }
    }
    this.lastLayouts.set(
      layoutLastKey(layoutScope, paragraph.startIndex, paragraph.endIndex),
      {
        ...result.shaped,
        lines: result.shaped.lines.map(line => scaleShapedLine(line, scale))
      }
    )
    return result
  }

  /** Native flow records, without per-element metrics or model writes. */
  layoutParagraphRows(
    paragraph: ParagraphSpan,
    elementList: IElement[],
    availableWidth: number,
    startRowIndex: number,
    layoutScope: string = DEFAULT_LAYOUT_SCOPE,
    defaultAlign?: 'left' | 'right',
    onLayout?: (result: NativeParagraphLayout) => void,
    markerGutter?: number
  ): LayoutRow[] {
    const options = this.getOptions()
    const native = this.layoutParagraph(
      paragraph,
      elementList,
      availableWidth,
      layoutScope,
      defaultAlign,
      markerGutter
    )
    onLayout?.(native)
    return createTextRows(
      native.lines,
      elementList,
      startRowIndex,
      options.scale || 1,
      paragraph.rowFlex
    )
  }

  /** Compatibility output only. No runtime layout calls this method. */
  layoutParagraphToRows(
    ...args: Parameters<LayoutHostAdapter['layoutParagraphRows']>
  ) {
    return snapshotRows(
      this.layoutParagraphRows(...args),
      this.getOptions().scale,
      row => this.findLayoutByElementIndex(row.startIndex, args[4])?.layout,
      this.getOptions()
    )
  }

  scanParagraphs(
    elementList: IElement[],
    defaultDirection?: TextDirection,
    startIndex = 0,
    endIndex = elementList.length
  ): ParagraphSpan[] {
    const options = this.getOptions()
    const hide = this.getHideContext?.()
    return this.bridge.scanParagraphs(
      elementList,
      {
        defaultDirection: defaultDirection || options.defaultDirection,
        defaultFont: options.defaultFont,
        defaultSize: options.defaultSize,
        defaultColor: options.defaultColor,
        defaultHyperlinkColor: options.defaultHyperlinkColor,
        defaultLabelColor: options.label.defaultColor,
        defaultLabelPadding: options.label.defaultPadding,
        fonts: options.fonts,
        scale: options.scale,
        checkboxWidth: options.checkbox.width,
        checkboxGap: options.checkbox.gap,
        radioWidth: options.radio.width,
        radioGap: options.radio.gap,
        defaultTabWidth: options.defaultTabWidth,
        defaultRowMargin: options.defaultRowMargin,
        defaultBasicRowMarginHeight: options.defaultBasicRowMarginHeight,
        isDesignMode: hide?.isDesignMode,
        isAreaHideDisabled: hide?.isAreaHideDisabled,
        isTraceHidden: hide?.isTraceHidden
      },
      startIndex,
      endIndex
    )
  }

  /**
   * Layout a plain string (watermark / chrome) with BiDi + script fonts.
   * Returns null when the engine is not ready.
   */
  layoutPlainText(params: {
    text: string
    fontFamily: string
    fontSize: number
    color: string
    availableWidth?: number
  }): LayoutResult | null {
    if (!this.isReady()) return null
    const spans = this.buildPlainTextSpans(
      params.text,
      params.fontFamily,
      params.fontSize,
      params.color
    )
    // 水印/页码等画在文本区：按文种 AUTO 探测，不跟 LTR/RTL 模式走
    // （模式切换不得改变画布绘制结果）
    const direction = resolveDirection(
      TextDirection.AUTO,
      params.text,
      TextDirection.LTR
    )
    return this.getTextLayoutService().layoutSingleLine({
      spans,
      availableWidth: Infinity,
      direction,
      align: 'left',
      lineHeight: params.fontSize,
      lineHeightFactor: 1,
      source: { scope: 'auxiliary', nodeId: 'plain', start: 0, end: 0 },
      revision: {
        documentRevision: this.revision,
        fontRevision: this.fontManager.getRevision()
      },
      positions: Array.from({ length: params.text.length }, (_, index) => ({
        start: index,
        textStart: index,
        textEnd: index + 1
      })),
      emptyStyle: { fontFamily: params.fontFamily, fontSize: params.fontSize }
    }).shaped
  }

  /** Split plain text by script → registered face (same as ElementBridge). */
  private buildPlainTextSpans(
    text: string,
    fontFamily: string,
    fontSize: number,
    color: string
  ): TextSpan[] {
    const { fonts } = this.getOptions()
    const spans: TextSpan[] = []
    for (let i = 0; i < text.length; ) {
      const cp = text.codePointAt(i)!
      const len = cp > 0xffff ? 2 : 1
      const ch = text.slice(i, i + len)
      const family = resolveFontForScript(detectScript(ch), fonts, fontFamily)
      const last = spans[spans.length - 1]
      const indices = new Array(len).fill(i)
      if (last && last.style.fontFamily === family) {
        last.text += ch
        last.logicalIndices = (last.logicalIndices || []).concat(indices)
      } else {
        spans.push({
          logicalIndex: i,
          logicalIndices: indices,
          text: ch,
          style: {
            fontFamily: family,
            fontSize,
            color
          }
        })
      }
      i += len
    }
    return spans
  }

  resolveElementDirection(
    elementList: IElement[],
    index: number
  ): 'ltr' | 'rtl' {
    const options = this.getOptions()
    // Walk back to paragraph start (ZERO)
    let start = index
    while (start > 0 && elementList[start].value !== '\u200B') {
      start--
    }
    let end = index
    while (
      end + 1 < elementList.length &&
      elementList[end + 1].value !== '\u200B'
    ) {
      end++
    }
    let text = ''
    for (let i = start; i <= end; i++) {
      if (elementList[i].value !== '\u200B') text += elementList[i].value
    }
    const declared =
      elementList[start]?.direction ||
      elementList[index]?.direction ||
      options.defaultDirection
    // 存量正文：不用 UI direction 作回退
    return resolveDirection(declared ?? TextDirection.AUTO, text, 'ltr')
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.fontManager.destroy()
    this.engine = null
    this.service = null
    this.invalidate()
  }

  clearParagraphCache() {
    this.nativeCache.reset()
  }

  invalidate() {
    this.revision++
    this.cache.invalidate()
    this.nativeCache.reset()
    this.lastLayouts.clear()
  }
}

export { resolveAlign }
