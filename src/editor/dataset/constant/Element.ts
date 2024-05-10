import { ElementType } from '../enum/Element'
import { IElement } from '../../interface/Element'
import { ITd } from '../../interface/table/Td'
import { IControlStyle } from '../../interface/Control'

export const EDITOR_ELEMENT_STYLE_ATTR: Array<keyof IElement> = [
  'bold',
  'color',
  'highlight',
  'font',
  'size',
  'italic',
  'underline',
  'strikeout',
  'textDecoration'
]

export const EDITOR_ROW_ATTR: Array<keyof IElement> = ['rowFlex', 'rowMargin']

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
  'groupIds',
  'rowFlex',
  'rowMargin',
  'textDecoration'
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
  'radio',
  'dateFormat',
  'block',
  'level',
  'title',
  'listType',
  'listStyle',
  'listWrap',
  'groupIds',
  'conceptId',
  'imgDisplay',
  'imgFloatPosition',
  'textDecoration',
  'extension'
]

export const TABLE_TD_ZIP_ATTR: Array<keyof ITd> = [
  'verticalAlign',
  'backgroundColor',
  'borderTypes',
  'slashTypes'
]

export const TABLE_CONTEXT_ATTR: Array<keyof IElement> = [
  'tdId',
  'trId',
  'tableId'
]

export const TITLE_CONTEXT_ATTR: Array<keyof IElement> = [
  'level',
  'titleId',
  'title'
]

export const LIST_CONTEXT_ATTR: Array<keyof IElement> = [
  'listId',
  'listType',
  'listStyle'
]

export const CONTROL_CONTEXT_ATTR: Array<keyof IElement> = [
  'control',
  'controlId',
  'controlComponent'
]

export const CONTROL_STYLE_ATTR: Array<keyof IControlStyle> = [
  'font',
  'size',
  'bold',
  'highlight',
  'italic',
  'strikeout'
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

export const IMAGE_ELEMENT_TYPE: ElementType[] = [
  ElementType.IMAGE,
  ElementType.LATEX
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
