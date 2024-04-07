import { ListStyle, ListType, UlStyle } from '../enum/List'

export const ulStyleMapping: Record<UlStyle, string> = {
  [UlStyle.DISC]: '•',
  [UlStyle.CIRCLE]: '◦',
  [UlStyle.SQUARE]: '▫︎',
  [UlStyle.CHECKBOX]: '☑️'
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
  [ListStyle.CHECKBOX]: 'checkbox'
}
