import { IElement } from ".."
import { HORIZON_TAB, WRAP, ZERO } from "../dataset/constant/Common"
import { TEXTLIKE_ELEMENT_TYPE } from "../dataset/constant/Element"
import { ElementType } from "../dataset/enum/Element"

export function writeText(text: string) {
  if (!text) return
  window.navigator.clipboard.writeText(text.replaceAll(ZERO, `\n`))
}

export function writeTextByElementList(elementList: IElement[]) {
  let text: string = ``
  function pickTextFromElement(payload: IElement[]) {
    for (let e = 0; e < payload.length; e++) {
      const element = payload[e]
      if (element.type === ElementType.TABLE) {
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            // 排除td首个元素
            pickTextFromElement(td.value.slice(1, td.value.length - 1))
            if (d !== tr.tdList.length - 1) {
              // td之间加水平制表符
              text += HORIZON_TAB
            }
          }
          // tr后加换行符
          text += WRAP
        }
      } else if (!element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)) {
        text += element.value
      }
    }
  }
  pickTextFromElement(elementList)
  if (!text) return
  writeText(text)
}