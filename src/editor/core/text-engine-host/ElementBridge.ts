import { ZERO } from '../../dataset/constant/Common'
import { ImageDisplay } from '../../dataset/enum/Common'
import { ControlComponent, ControlType } from '../../dataset/enum/Control'
import { ElementType } from '../../dataset/enum/Element'
import { TextDirection } from '../../dataset/enum/TextDirection'
import { IElement } from '../../interface/Element'
import { IEditorFontFace } from '../../interface/TextEngine'
import { isElementLayoutHidden } from '../../utils/element'
import { getBidiApi } from '../text-engine/bidi/bidiApi'
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
/** LTR isolate: keep control `{value}` / LTR units together inside RTL paragraphs */
const LRI = '\u2066'
const PDI = '\u2069'
/** 零宽/格式字符前后缀（如签名线 U+200C）不包隔离，避免占宽挤开 minWidth 下划线 */
const FORMAT_ONLY_BRACKET = /^[\u200B-\u200D\uFEFF\u2060]*$/

function shouldIsolateControlBracket(value: string): boolean {
  return !!value && !FORMAT_ONLY_BRACKET.test(value)
}

/**
 * 是否存在 RTL 强字符。基于 bidi-js 的字符类型判断，覆盖全部 RTL 书写系统：
 * 阿拉伯、希伯来、叙利亚、他拿、N'Ko、撒玛利亚、曼达等（不限于阿拉伯语）。
 */
function textHasRtlDirection(text: string): boolean {
  const { getBidiCharTypeName } = getBidiApi()
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i)!
    const name = getBidiCharTypeName(String.fromCodePoint(cp))
    // 只要存在任一 R/AL 强字符即判定含 RTL 内容；
    // 不能因首个字符为 L 提前返回（段落可能以 LTR 前缀开头）
    if (name === 'R' || name === 'AL') return true
    i += cp > 0xffff ? 2 : 1
  }
  return false
}

function textHasLtrDirection(text: string): boolean {
  const { getBidiCharTypeName } = getBidiApi()
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i)!
    const name = getBidiCharTypeName(String.fromCodePoint(cp))
    if (name === 'L' || name === 'EN') return true
    i += cp > 0xffff ? 2 : 1
  }
  return false
}

function isLtrIsolateBoundary(text: string): boolean {
  return /^[،؛؟,，、]$/.test(text)
}

function controlContentIsRtl(control: IElement['control']): boolean {
  if (!control) return false
  // 日期值始终按 yyyy-MM-dd HH:mm:ss 的 LTR 字符串排版；RTL 仅影响弹层定位
  if (control.type === ControlType.DATE) return false
  if (
    control.type === ControlType.CHECKBOX ||
    control.type === ControlType.RADIO
  ) {
    return true
  }
  // 优先看实际值：用户输入的数值是 LTR，应保持 LRI；空值时看占位符。
  const value = control.value
  if (Array.isArray(value) && value.some(item => item?.value)) {
    for (const item of value) {
      if (item?.value && textHasRtlDirection(String(item.value))) {
        return true
      }
    }
    return false
  } else if (typeof value === 'string' && value) {
    return textHasRtlDirection(value)
  }
  if (control.placeholder && textHasRtlDirection(control.placeholder)) {
    return true
  }
  return false
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
  /** 与 legacy 一致：隐藏元素零宽占位，供行高折叠 / 光标跳隐 */
  isDesignMode?: boolean
  isAreaHideDisabled?: boolean
  isTraceHidden?: (el: IElement) => boolean
}

function isInlineWidget(el: IElement): boolean {
  return (
    el.type === ElementType.CHECKBOX ||
    el.type === ElementType.RADIO ||
    el.controlComponent === ControlComponent.CHECKBOX ||
    el.controlComponent === ControlComponent.RADIO
  )
}

/** 浮层 / 独占行图：仍作段分隔；默认与 INLINE 显示为行内 object */
function isParagraphBreakImage(el: IElement): boolean {
  if (el.type !== ElementType.IMAGE && el.type !== ElementType.LATEX) {
    return false
  }
  const d = el.imgDisplay
  return (
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
      radioGap = 5,
      isDesignMode,
      isAreaHideDisabled,
      isTraceHidden
    } = options
    const hideCtx = { isDesignMode, isAreaHideDisabled, isTraceHidden }
    // 先探测段方向（不含隔离符），LTR 不包 LRI/PDI，避免跨行控件 fillText 半截隔离错乱。
    // 跳过段首 ZERO：标题后的 RTL 换行不应盖住后随 LTR 正文（如生命体征 T:/P:）。
    let declared = defaultDirection
    for (let i = startIndex; i <= endIndex; i++) {
      const el = elementList[i]
      if (!el || el.value === ZERO) continue
      if (el.direction) {
        declared = el.direction
        break
      }
    }
    let probeText = ''
    for (let i = startIndex; i <= endIndex; i++) {
      const el = elementList[i]
      if (el.value === ZERO || !el.value) continue
      // 隐藏元素不参与方向探测（与不占可见墨迹一致）
      if (isElementLayoutHidden(el, hideCtx)) continue
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
    // LTR 段若含 RTL 脚本文字，同样需要隔离控件括号，
    // 否则 BiDi 会把 {value} 重排成 }value{ 导致渲染错乱
    const hasRtlContent =
      direction === 'ltr' && textHasRtlDirection(probeText)
    const isolateBrackets = direction === 'rtl' || hasRtlContent
    const spans: TextSpan[] = []
    let text = ''
    let ltrIsolateOpen = false
    for (let i = startIndex; i <= endIndex; i++) {
      const el = elementList[i]
      if (el.value === ZERO) continue
      // 零宽 object 占位：保留逻辑下标 / Position 连续性，advance=0（对齐 #1447）
      if (isElementLayoutHidden(el, hideCtx)) {
        if (!el.value && !isInlineObject(el)) continue
        const fontSize = (el.size || defaultSize) * scale
        spans.push({
          logicalIndex: i,
          logicalIndices: [i],
          text: OBJECT_REPLACEMENT,
          style: {
            fontFamily: defaultFont,
            fontSize,
            color: el.color || defaultColor,
            objectWidth: 0,
            objectHeight: 0
          }
        })
        text += OBJECT_REPLACEMENT
        continue
      }
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
      // RTL 段：LTR 单位（cm/kg/BMI:）按字符拆分为独立的 LRI…PDI 岛，
      // 避免 `kg، BMI` 等被 bidi 合并成一个 LTR 单位后穿入相邻控件。
      // 阿拉伯内容控件保持不隔离（checkbox/radio 盒按 RTL 落右侧），
      // 随段自然 RTL 排布；LTR 内容控件仍包 LRI 保括号顺序。
      const skipIsolateForRtlContent =
        direction === 'rtl' && controlContentIsRtl(el.control)
      const isolatePrefix =
        isolateBrackets &&
        !skipIsolateForRtlContent &&
        el.controlComponent === ControlComponent.PREFIX &&
        shouldIsolateControlBracket(el.value)
          ? LRI
          : ''
      const isolatePostfix =
        isolateBrackets &&
        !skipIsolateForRtlContent &&
        el.controlComponent === ControlComponent.POSTFIX &&
        shouldIsolateControlBracket(el.value)
          ? PDI
          : ''
      let ltrPrefix = ''
      if (direction === 'rtl') {
        const isControlElement = !!el.controlComponent || !!el.controlId
        if (isControlElement) {
          // 控件自带方向：先关闭前方未闭合的 LTR 岛
          if (ltrIsolateOpen) {
            ltrPrefix = PDI
            ltrIsolateOpen = false
          }
        } else {
          const hasRtl = textHasRtlDirection(el.value)
          const hasLtr = textHasLtrDirection(el.value)
          if (ltrIsolateOpen && (hasRtl || isLtrIsolateBoundary(el.value))) {
            ltrPrefix = PDI
            ltrIsolateOpen = false
          }
          if (!ltrIsolateOpen && hasLtr) {
            ltrPrefix += LRI
            ltrIsolateOpen = true
          }
        }
      }
      const chunk =
        ltrPrefix + isolatePrefix + el.value + isolatePostfix
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
    if (ltrIsolateOpen && spans.length) {
      const last = spans[spans.length - 1]
      last.text += PDI
      last.logicalIndices = (last.logicalIndices || []).concat(endIndex)
      text += PDI
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
