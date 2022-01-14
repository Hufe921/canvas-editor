import { IElement } from ".."
import { ZERO } from "../dataset/constant/Common"
import { TEXTLIKE_ELEMENT_TYPE } from "../dataset/constant/Element"

export function writeText(text: string) {
  if (!text) return
  window.navigator.clipboard.writeText(text.replaceAll(ZERO, `\n`))
}

export function writeTextByElementList(elementList: IElement[]) {
  const text = elementList
    .map(p => !p.type || TEXTLIKE_ELEMENT_TYPE.includes(p.type) ? p.value : '')
    .join('')
  writeText(text)
}