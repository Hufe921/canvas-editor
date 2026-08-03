import { ZERO } from '../../dataset/constant/Common'
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
  defaultFont: string
  defaultSize: number
  defaultColor: string
  fonts?: IEditorFontFace[]
  /** Match Draw measureText (size * scale) vs scaled innerWidth */
  scale?: number
}

function isTextLike(el: IElement): boolean {
  return (
    !el.type ||
    el.type === ElementType.TEXT ||
    el.type === ElementType.SUBSCRIPT ||
    el.type === ElementType.SUPERSCRIPT ||
    el.type === ElementType.HYPERLINK ||
    el.type === ElementType.LABEL ||
    el.type === ElementType.DATE
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
        el.type === ElementType.IMAGE ||
        el.type === ElementType.BLOCK ||
        el.type === ElementType.LATEX
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
      fonts,
      scale = 1
    } = options
    const spans: TextSpan[] = []
    let text = ''
    for (let i = startIndex; i <= endIndex; i++) {
      const el = elementList[i]
      if (el.value === ZERO) continue
      if (!isTextLike(el)) continue
      const script = detectScript(el.value)
      const fontFamily =
        el.font ||
        resolveFontForScript(script, fonts, defaultFont)
      const style: TextStyleProps = {
        fontFamily,
        fontSize: (el.size || defaultSize) * scale,
        bold: el.bold,
        italic: el.italic,
        color: el.color || defaultColor,
        letterSpacing: el.letterSpacing
      }
      const styleKey = this.styleKey(style)
      const last = spans[spans.length - 1]
      // 元素内每个 UTF-16 单元都映射到该元素下标（ grapheme 可能多码元）
      const charLogicalIndices = new Array(el.value.length).fill(i)
      // 相邻同样式合并；color 不同会拆 span，由 layout.mergeRunsForShaping 再拼回整形
      if (last && this.styleKey(last.style) === styleKey) {
        last.text += el.value
        last.logicalIndices = (last.logicalIndices || []).concat(
          charLogicalIndices
        )
      } else {
        spans.push({
          logicalIndex: i,
          logicalIndices: charLogicalIndices,
          text: el.value,
          style
        })
      }
      text += el.value
    }
    const declared =
      elementList[startIndex]?.direction ||
      elementList[startIndex + 1]?.direction ||
      defaultDirection
    const direction = resolveDirection(declared, text, 'ltr')
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
      style.letterSpacing
    ].join('|')
  }
}
