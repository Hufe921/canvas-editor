import { ZERO } from '../../dataset/constant/Common'
import { ImageDisplay } from '../../dataset/enum/Common'
import { ControlComponent } from '../../dataset/enum/Control'
import { ElementType } from '../../dataset/enum/Element'
import { TextDirection } from '../../dataset/enum/TextDirection'
import { IElement } from '../../interface/Element'
import { IEditorFontFace } from '../../interface/TextEngine'
import { resolveDirection } from '../text-engine'
import {
  detectScript,
  resolveFontForScript
} from '../text-engine/utils/scriptFont'
import {
  ResolvedDirection,
  TextSpan,
  TextStyleProps
} from '../text-engine/types'

/** Object Replacement Character — inline widget slot in paragraph text */
const OBJECT_REPLACEMENT = '\uFFFC'
/** LTR isolate: keep control `{value}` brace order inside RTL paragraphs */
const LRI = '\u2066'
const PDI = '\u2069'
/** 零宽/格式字符前后缀（如签名线 U+200C）不包隔离，避免占宽挤开 minWidth 下划线 */
const FORMAT_ONLY_BRACKET = /^[\u200B-\u200D\uFEFF\u2060]*$/

function shouldIsolateControlBracket(value: string): boolean {
  return !!value && !FORMAT_ONLY_BRACKET.test(value)
}

export interface ParagraphSpan {
  startIndex: number
  endIndex: number
  direction: ResolvedDirection
  declaredDirection?: TextDirection
  rowFlex?: IElement['rowFlex']
  spans: TextSpan[]
  text: string
}

export interface ScanParagraphOptions {
  defaultDirection: TextDirection
  /**
   * @deprecated LTR/RTL 模式不再参与存量正文解析；保留字段以免外部调用方立刻破坏。
   */
  uiDirection?: TextDirection.LTR | TextDirection.RTL
  defaultFont: string
  defaultSize: number
  defaultColor: string
  defaultHyperlinkColor?: string
  defaultLabelColor?: string
  fonts?: IEditorFontFace[]
  /** Match Draw measureText (size * scale) vs scaled innerWidth */
  scale?: number
  checkboxWidth?: number
  checkboxGap?: number
  radioWidth?: number
  radioGap?: number
}

function isInlineWidget(el: IElement): boolean {
  return (
    el.type === ElementType.CHECKBOX ||
    el.type === ElementType.RADIO ||
    el.controlComponent === ControlComponent.CHECKBOX ||
    el.controlComponent === ControlComponent.RADIO
  )
}

/** 浮层 / 独占行图：仍作段分隔；默认与 BLOCK 显示为行内 object */
function isParagraphBreakImage(el: IElement): boolean {
  if (el.type !== ElementType.IMAGE && el.type !== ElementType.LATEX) {
    return false
  }
  const d = el.imgDisplay
  return (
    d === ImageDisplay.INLINE ||
    d === ImageDisplay.SURROUND ||
    d === ImageDisplay.FLOAT_TOP ||
    d === ImageDisplay.FLOAT_BOTTOM
  )
}

function isInlineImageOrLatex(el: IElement): boolean {
  return (
    (el.type === ElementType.IMAGE || el.type === ElementType.LATEX) &&
    !isParagraphBreakImage(el)
  )
}

function isInlineObject(el: IElement): boolean {
  return isInlineWidget(el) || isInlineImageOrLatex(el)
}

function isTextLike(el: IElement): boolean {
  if (isInlineObject(el)) return false
  return (
    !el.type ||
    el.type === ElementType.TEXT ||
    el.type === ElementType.SUBSCRIPT ||
    el.type === ElementType.SUPERSCRIPT ||
    el.type === ElementType.HYPERLINK ||
    el.type === ElementType.LABEL ||
    el.type === ElementType.DATE ||
    // Control chrome (prefix/value/postfix…) carries visible text
    el.type === ElementType.CONTROL
  )
}

export class ElementBridge {
  scanParagraphs(
    elementList: IElement[],
    options: ScanParagraphOptions
  ): ParagraphSpan[] {
    const paragraphs: ParagraphSpan[] = []
    let start = 0
    for (let i = 0; i <= elementList.length; i++) {
      const el = elementList[i]
      const isBreak =
        i === elementList.length ||
        el.value === ZERO ||
        el.type === ElementType.PAGE_BREAK ||
        el.type === ElementType.SEPARATOR ||
        el.type === ElementType.TABLE ||
        el.type === ElementType.BLOCK ||
        isParagraphBreakImage(el)
      if (!isBreak) continue
      if (i > start) {
        paragraphs.push(this.buildParagraph(elementList, start, i - 1, options))
      }
      if (i < elementList.length && el.value === ZERO) {
        start = i
      } else {
        start = i + 1
      }
    }
    return paragraphs
  }

  private buildParagraph(
    elementList: IElement[],
    startIndex: number,
    endIndex: number,
    options: ScanParagraphOptions
  ): ParagraphSpan {
    const {
      defaultDirection,
      defaultFont,
      defaultSize,
      defaultColor,
      defaultHyperlinkColor = '#0000FF',
      defaultLabelColor = '#1976d2',
      fonts,
      scale = 1,
      checkboxWidth = 14,
      checkboxGap = 5,
      radioWidth = 14,
      radioGap = 5
    } = options
    // 先探测段方向（不含隔离符），LTR 不包 LRI/PDI，避免跨行控件 fillText 半截隔离错乱
    const declared =
      elementList[startIndex]?.direction ||
      elementList[startIndex + 1]?.direction ||
      defaultDirection
    let probeText = ''
    for (let i = startIndex; i <= endIndex; i++) {
      const el = elementList[i]
      if (el.value === ZERO || !el.value) continue
      if (isInlineObject(el)) {
        probeText += OBJECT_REPLACEMENT
        continue
      }
      if (isTextLike(el)) probeText += el.value
    }
    const direction = resolveDirection(
      declared ?? TextDirection.AUTO,
      probeText,
      'ltr'
    )
    const isolateBrackets = direction === 'rtl'
    const spans: TextSpan[] = []
    let text = ''
    for (let i = startIndex; i <= endIndex; i++) {
      const el = elementList[i]
      if (el.value === ZERO) continue
      if (isInlineObject(el)) {
        const fontSize = (el.size || defaultSize) * scale
        let objectWidth: number
        let objectHeight: number | undefined
        if (isInlineImageOrLatex(el)) {
          objectWidth = Math.max(0, (el.width || 0) * scale)
          objectHeight = Math.max(0, (el.height || 0) * scale)
        } else {
          const isRadio =
            el.type === ElementType.RADIO ||
            el.controlComponent === ControlComponent.RADIO
          const boxW = isRadio ? radioWidth : checkboxWidth
          const gap = isRadio ? radioGap : checkboxGap
          objectWidth = (boxW + gap * 2) * scale
        }
        spans.push({
          logicalIndex: i,
          logicalIndices: [i],
          text: OBJECT_REPLACEMENT,
          style: {
            fontFamily: defaultFont,
            fontSize,
            color: el.color || defaultColor,
            objectWidth,
            ...(objectHeight != null ? { objectHeight } : {})
          }
        })
        text += OBJECT_REPLACEMENT
        continue
      }
      if (!isTextLike(el)) continue
      if (!el.value) continue
      const script = detectScript(el.value)
      const fontFamily =
        el.font || resolveFontForScript(script, fonts, defaultFont)
      const baseSize = el.size || defaultSize
      const isSuper = el.type === ElementType.SUPERSCRIPT
      const isSub = el.type === ElementType.SUBSCRIPT
      const isLink = el.type === ElementType.HYPERLINK
      const isLabel = el.type === ElementType.LABEL
      // 与 legacy computeRowList 一致：上下标绘制字号 = ceil(size * 0.6)
      if (isSuper || isSub) {
        el.actualSize = Math.ceil(baseSize * 0.6)
      }
      // 与 HyperlinkParticle 一致：默认链接触发色/下划线，保证引擎排版与绘制同源
      if (isLink) {
        if (!el.color) el.color = defaultHyperlinkColor
        if (el.underline === undefined) el.underline = true
      }
      // 与 LabelParticle 一致：label.color → element.color，供 GlyphRenderer
      if (isLabel && !el.color) {
        el.color = el.label?.color || defaultLabelColor
      }
      const paintSize = (isSuper || isSub ? el.actualSize! : baseSize) * scale
      const fallbackColor = isLink
        ? defaultHyperlinkColor
        : isLabel
          ? defaultLabelColor
          : defaultColor
      const style: TextStyleProps = {
        fontFamily,
        fontSize: paintSize,
        bold: el.bold,
        italic: el.italic,
        color: el.color || fallbackColor,
        letterSpacing: el.letterSpacing,
        scriptShift: isSuper ? 'super' : isSub ? 'sub' : undefined
      }
      // 仅 RTL 段：可见括号包 LRI/PDI，避免 `{10}` 被排成 `}10{`；
      // LTR 不加，防止跨行控件半截隔离导致选中后叠字 / 点不进
      const isolatePrefix =
        isolateBrackets &&
        el.controlComponent === ControlComponent.PREFIX &&
        shouldIsolateControlBracket(el.value)
          ? LRI
          : ''
      const isolatePostfix =
        isolateBrackets &&
        el.controlComponent === ControlComponent.POSTFIX &&
        shouldIsolateControlBracket(el.value)
          ? PDI
          : ''
      const chunk = isolatePrefix + el.value + isolatePostfix
      const styleKey = this.styleKey(style)
      const last = spans[spans.length - 1]
      // 元素内每个 UTF-16 单元都映射到该元素下标（含 isolate；grapheme 可能多码元）
      const charLogicalIndices = new Array(chunk.length).fill(i)
      // 相邻同样式合并；color 不同会拆 span，由 layout.mergeRunsForShaping 再拼回整形
      if (last && this.styleKey(last.style) === styleKey) {
        last.text += chunk
        last.logicalIndices = (last.logicalIndices || []).concat(
          charLogicalIndices
        )
      } else {
        spans.push({
          logicalIndex: i,
          logicalIndices: charLogicalIndices,
          text: chunk,
          style
        })
      }
      text += chunk
    }
    return {
      startIndex,
      endIndex,
      direction,
      declaredDirection: declared,
      rowFlex:
        elementList[startIndex]?.rowFlex ||
        elementList[startIndex + 1]?.rowFlex,
      spans,
      text
    }
  }

  toStyleKey(el: IElement): string {
    return [
      el.font,
      el.size,
      el.bold,
      el.italic,
      el.color,
      el.letterSpacing
    ].join('|')
  }

  private styleKey(style: TextStyleProps): string {
    return [
      style.fontFamily,
      style.fontSize,
      style.bold,
      style.italic,
      style.color,
      style.letterSpacing,
      style.scriptShift || '',
      style.objectWidth ?? '',
      style.objectHeight ?? ''
    ].join('|')
  }
}
