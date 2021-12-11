import { getUUID } from "."
import { ElementType, IElement } from ".."
import { ZERO } from "../dataset/constant/Common"

export function formatElementList(elementList: IElement[]) {
  if (elementList[0]?.value !== ZERO) {
    elementList.unshift({
      value: ZERO
    })
  }
  for (let i = 0; i < elementList.length; i++) {
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
    }
    if (el.value === '\n') {
      el.value = ZERO
    }
    if (el.type === ElementType.IMAGE) {
      el.id = getUUID()
    }
  }
}