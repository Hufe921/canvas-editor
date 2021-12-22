import { getUUID } from "."
import { ElementType, IElement } from ".."
import { ZERO } from "../dataset/constant/Common"

export function formatElementList(elementList: IElement[]) {
  if (elementList[0]?.value !== ZERO) {
    elementList.unshift({
      value: ZERO
    })
  }
  let i = 0
  while (i < elementList.length) {
    const el = elementList[i]
    if (el.type === ElementType.TABLE) {
      const tableId = getUUID()
      el.id = tableId
      if (el.trList) {
        for (let t = 0; t < el.trList.length; t++) {
          const tr = el.trList[t]
          const trId = getUUID()
          tr.id = trId
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const tdId = getUUID()
            td.id = tdId
            formatElementList(td.value)
            for (let v = 0; v < td.value.length; v++) {
              const value = td.value[v]
              value.tdId = tdId
              value.trId = trId
              value.tableId = tableId
            }
          }
        }
      }
    } else if (el.type === ElementType.HYPERLINK) {
      const valueList = el.valueList || []
      // 移除父节点
      elementList.splice(i, 1)
      // 追加字节点
      if (valueList.length) {
        const hyperlinkId = getUUID()
        for (let v = 0; v < valueList.length; v++) {
          const value = valueList[v]
          value.type = el.type
          value.url = el.url
          value.hyperlinkId = hyperlinkId
          elementList.splice(i, 0, value)
          i++
        }
      }
      i--
    }
    if (el.value === '\n') {
      el.value = ZERO
    }
    if (el.type === ElementType.IMAGE) {
      el.id = getUUID()
    }
    i++
  }
}