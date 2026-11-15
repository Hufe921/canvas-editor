import { ListStyle, ListType, UlStyle } from '../enum/List'
import { IListOption } from '../../interface/Element'

export const defaultListOption: Readonly<Required<IListOption>> = {
  inheritStyle: false
}

export const ulStyleMapping: Record<UlStyle, string> = {
  [UlStyle.DISC]: '•',
  [UlStyle.CIRCLE]: '◦',
  [UlStyle.SQUARE]: '▫︎',
  [UlStyle.CHECKBOX]: '☑️',
  [UlStyle.DIAMOND]: '\u25C6',        // ◆ (实心菱形)
  [UlStyle.ARROW]: '➤',
  [UlStyle.DIAMOND_FLORAL]: '\u2756', // ❖ (菱形梅花瓣)
  [UlStyle.HALF_ARROW]: '\u27A2',     // ➢ (黑白阴影三角箭头)
  [UlStyle.CHECKMARK]: '\u2713',      // ✓ (标准对勾)
  [UlStyle.DIAMOND_HOLLOW]: '\u2727', // ◇ (空心菱形)
}

export const listTypeElementMapping: Record<ListType, string> = {
  [ListType.OL]: 'ol',
  [ListType.UL]: 'ul'
}

export const listStyleCSSMapping: Record<ListStyle, string> = {
  [ListStyle.DISC]: 'disc',
  [ListStyle.CIRCLE]: 'circle',
  [ListStyle.SQUARE]: 'square',
  [ListStyle.DECIMAL]: 'decimal',
  [ListStyle.CHECKBOX]: 'checkbox',
  [ListStyle.DECIMAL_PARENTHESES]: 'decimal-parentheses',
  [ListStyle.DECIMAL_RIGHT_PAREN]: 'decimal-right-paren',
  [ListStyle.UPPER_ALPHA]: 'upper-alpha',
  [ListStyle.LOWER_ALPHA]: 'lower-alpha',
  [ListStyle.CIRCLED_DECIMAL]: 'circled-decimal',
  [ListStyle.CHINESE]: 'chinese',
  [ListStyle.CHINESE_PARENTHESES]: 'chinese-parentheses',
  [ListStyle.DIAMOND]: 'diamond',
  [ListStyle.DIAMOND_FLORAL]: 'diamond-floral',
  [ListStyle.HALF_ARROW]: 'half-arrow',
  [ListStyle.CHECKMARK]: 'checkmark',
  [ListStyle.DIAMOND_HOLLOW]: 'diamond-hollow',
  [ListStyle.ARROW]: 'arrow',
}
