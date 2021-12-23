import { IElement } from "../../interface/Element"

export const EDITOR_ELEMENT_STYLE = [
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
  'url',
  'hyperlinkId'
]