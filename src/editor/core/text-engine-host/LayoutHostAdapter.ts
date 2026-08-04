import { WordBreak } from '../../dataset/enum/Editor'
import { RowFlex } from '../../dataset/enum/Row'
import {
  TextDirection,
  TextEngineMode
} from '../../dataset/enum/TextDirection'
import { IEditorOption } from '../../interface/Editor'
import { IElement } from '../../interface/Element'
import { IRow } from '../../interface/Row'
import { DeepRequired } from '../../interface/Common'
import {
  BrowserTextShaper,
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
import { LayoutResult, TextSpan } from '../text-engine/types'
import { ElementBridge, ParagraphSpan } from './ElementBridge'
import { HitTestAdapter } from './HitTestAdapter'
import { mapLayoutToRows } from './mapToLegacyRow'

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
}): string {
  if (params.isTable && params.tdId) {
    return `td:${params.tdId}`
  }
  if (params.zone === 'header' || params.zone === 'footer') {
    return params.zone
  }
  return DEFAULT_LAYOUT_SCOPE
}

export class LayoutHostAdapter {
  private fontManager = new FontManager()
  private bridge = new ElementBridge()
  private hitTest = new HitTestAdapter()
  private cache = new LayoutCache()
  private glyphRenderer = new GlyphRenderer()
  private engine: TextLayoutEngine | null = null
  private initPromise: Promise<void> | null = null
  private lastLayouts = new Map<string, LayoutResult>()

  constructor(private getOptions: () => DeepRequired<IEditorOption>) {}

  getHitTest(): HitTestAdapter {
    return this.hitTest
  }

  getGlyphRenderer(): GlyphRenderer {
    return this.glyphRenderer
  }

  getLayout(key: string): LayoutResult | undefined {
    return this.lastLayouts.get(key) || this.cache.get(key)
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

  isHarfBuzzMode(): boolean {
    return this.getOptions().textEngine === TextEngineMode.HARFBUZZ
  }

  isReady(): boolean {
    if (!this.isHarfBuzzMode()) return false
    // Browser shaper allows ready without fonts; HB prefers fonts
    return !!this.engine
  }

  async ensureReady(): Promise<void> {
    if (this.engine) return
    if (this.initPromise) return this.initPromise
    this.initPromise = (async () => {
      const options = this.getOptions()
      try {
        await this.fontManager.init(options.fonts || [], options.defaultFont)
      } catch (e) {
        console.warn('[text-engine] FontManager init failed, using fallback', e)
      }
      // HB when OT fonts registered; Browser measureText otherwise
      const shaper = this.fontManager.isReady()
        ? new HarfBuzzTextShaper(this.fontManager)
        : new BrowserTextShaper()
      this.engine = new TextLayoutEngine(new BidiResolver(), shaper)
      this.invalidate()
    })()
    return this.initPromise
  }

  /**
   * Layout a paragraph span list into legacy rows (HarfBuzz path).
   */
  layoutParagraphToRows(
    paragraph: ParagraphSpan,
    elementList: IElement[],
    availableWidth: number,
    startRowIndex: number,
    layoutScope: string = DEFAULT_LAYOUT_SCOPE
  ): IRow[] | null {
    if (!this.engine || !paragraph.spans.length) return null
    const options = this.getOptions()
    const lineHeightFactor = (options.defaultRowMargin || 1) * 1.5
    // 空行回退；实际行高由引擎按行内最大字号 * factor 计算
    const fallbackFontSize =
      Math.max(
        0,
        ...paragraph.spans.map(s => s.style.fontSize || 0)
      ) ||
      options.defaultSize * (options.scale || 1)
    const lineHeight = fallbackFontSize * lineHeightFactor
    const align = resolveAlign(paragraph.rowFlex, paragraph.direction)
    const wordBreak =
      options.wordBreak === WordBreak.BREAK_ALL ? 'break-all' : 'break-word'
    // 须含 bold/italic/color/object 尺寸等，否则改样式或缩放图片/公式会命中旧缓存（行高不更新重叠）
    const cacheKey = [
      paragraph.text,
      paragraph.direction,
      align,
      availableWidth,
      wordBreak,
      lineHeightFactor,
      paragraph.spans
        .map(s => {
          const st = s.style
          return [
            s.logicalIndex,
            st.fontFamily,
            st.fontSize,
            st.bold ? 1 : 0,
            st.italic ? 1 : 0,
            st.color || '',
            st.letterSpacing || 0,
            st.scriptShift || '',
            st.objectWidth ?? '',
            st.objectHeight ?? '',
            s.text.length
          ].join(':')
        })
        .join(',')
    ].join('|')
    let layout = this.cache.get(cacheKey)
    if (!layout) {
      layout = this.engine.layoutParagraph({
        spans: paragraph.spans,
        availableWidth,
        direction: paragraph.direction,
        align,
        lineHeight,
        lineHeightFactor,
        wordBreak
      })
      this.cache.set(cacheKey, layout)
    }
    this.lastLayouts.set(
      layoutLastKey(layoutScope, paragraph.startIndex, paragraph.endIndex),
      layout
    )
    return mapLayoutToRows({
      layout,
      elementList,
      startRowIndex,
      rowFlex: paragraph.rowFlex,
      defaultFont: options.defaultFont,
      defaultSize: options.defaultSize
    })
  }

  scanParagraphs(elementList: IElement[]): ParagraphSpan[] {
    const options = this.getOptions()
    return this.bridge.scanParagraphs(elementList, {
      defaultDirection: options.defaultDirection,
      defaultFont: options.defaultFont,
      defaultSize: options.defaultSize,
      defaultColor: options.defaultColor,
      defaultHyperlinkColor: options.defaultHyperlinkColor,
      defaultLabelColor: options.label.defaultColor,
      fonts: options.fonts,
      scale: options.scale,
      checkboxWidth: options.checkbox.width,
      checkboxGap: options.checkbox.gap,
      radioWidth: options.radio.width,
      radioGap: options.radio.gap
    })
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
    if (!this.engine || !params.text) return null
    const spans = this.buildPlainTextSpans(
      params.text,
      params.fontFamily,
      params.fontSize,
      params.color
    )
    if (!spans.length) return null
    // 水印/页码等画在文本区：按文种 AUTO 探测，不跟 LTR/RTL 模式走
    // （模式切换不得改变画布绘制结果）
    const direction = resolveDirection(
      TextDirection.AUTO,
      params.text,
      TextDirection.LTR
    )
    const lineHeight = params.fontSize * 1.5
    return this.engine.layoutParagraph({
      spans,
      availableWidth: params.availableWidth ?? 1e9,
      direction,
      align: 'left',
      lineHeight,
      lineHeightFactor: 1.5,
      wordBreak: 'break-word'
    })
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
      const family = resolveFontForScript(
        detectScript(ch),
        fonts,
        fontFamily
      )
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

  invalidate() {
    this.cache.invalidate()
    this.lastLayouts.clear()
  }
}

export { resolveAlign }
