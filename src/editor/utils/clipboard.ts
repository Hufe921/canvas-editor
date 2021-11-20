import { ElementType, IElement } from ".."
import { ZERO } from "../dataset/constant/Common"

export function writeText(text: string) {
  if (!text) return
  window.navigator.clipboard.writeText(text.replaceAll(ZERO, `\n`))
}

export function writeTextByElementList(elementList: IElement[]) {
  const text = elementList
    .map(p => !p.type || p.type === ElementType.TEXT ? p.value : '')
    .join('')
  writeText(text)
}