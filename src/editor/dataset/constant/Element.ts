import { ElementType } from '../enum/Element'
import { IElement } from '../../interface/Element'
import { ITd } from '../../interface/table/Td'

export const EDITOR_ELEMENT_STYLE_ATTR: Array<keyof IElement> = [
  'bold',
  'color',
  'highlight',
  'font',
  'size',
  'italic',
  'underline',
  'strikeout'
]

export const EDITOR_ELEMENT_COPY_ATTR: Array<keyof IElement> = [
  'type',
  'font',
  'size',
  'bold',
  'color',
  'italic',
  'highlight',
  'underline',
  'strikeout',
  'rowFlex',
  'url',
  'hyperlinkId',
  'dateId',
  'dateFormat',
  'groupIds'
]

export const EDITOR_ELEMENT_ZIP_ATTR: Array<keyof IElement> = [
  'type',
  'font',
  'size',
  'bold',
  'color',
  'italic',
  'highlight',
  'underline',
  'strikeout',
  'rowFlex',
  'rowMargin',
  'dashArray',
  'trList',
  'borderType',
  'width',
  'height',
  'url',
  'colgroup',
  'valueList',
  'control',
  'checkbox',
  'dateFormat',
  'block',
  'level',
  'listType',
  'listStyle',
  'listWrap',
  'groupIds'
]

export const TABLE_TD_ZIP_ATTR: Array<keyof ITd> = [
  'verticalAlign',
  'backgroundColor',
  'borderType'
]

export const TABLE_CONTEXT_ATTR: Array<keyof IElement> = [
  'tdId',
  'trId',
  'tableId'
]

export const TITLE_CONTEXT_ATTR: Array<keyof IElement> = ['level', 'titleId']

export const LIST_CONTEXT_ATTR: Array<keyof IElement> = [
  'listId',
  'listType',
  'listStyle'
]

export const EDITOR_ELEMENT_CONTEXT_ATTR: Array<keyof IElement> = [
  ...TABLE_CONTEXT_ATTR,
  ...TITLE_CONTEXT_ATTR,
  ...LIST_CONTEXT_ATTR
]

export const TEXTLIKE_ELEMENT_TYPE: ElementType[] = [
  ElementType.TEXT,
  ElementType.HYPERLINK,
  ElementType.SUBSCRIPT,
  ElementType.SUPERSCRIPT,
  ElementType.CONTROL,
  ElementType.DATE
]

export const INLINE_ELEMENT_TYPE: ElementType[] = [
  ElementType.BLOCK,
  ElementType.PAGE_BREAK,
  ElementType.SEPARATOR,
  ElementType.TABLE
]

export const INLINE_NODE_NAME: string[] = ['HR', 'TABLE', 'UL', 'OL']

export const VIRTUAL_ELEMENT_TYPE: ElementType[] = [
  ElementType.TITLE,
  ElementType.LIST
]
