import { ZERO } from "../dataset/constant/Common"

export function writeText(text: string) {
  if (!text) return
  window.navigator.clipboard.writeText(text.replaceAll(ZERO, `\n`))
}