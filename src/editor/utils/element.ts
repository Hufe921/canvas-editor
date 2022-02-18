import { deepClone, getUUID } from "."
import { ElementType, IElement } from ".."
import { ZERO } from "../dataset/constant/Common"
import { EDITOR_ELEMENT_ZIP_ATTR } from "../dataset/constant/Element"

export function formatElementList(elementList: IElement[], isHandleFirstElement = true) {
  if (isHandleFirstElement && elementList[0]?.value !== ZERO) {
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

export function zipElementList(payload: IElement[]): IElement[] {
  const elementList = deepClone(payload)
  const zipElementListData: IElement[] = []
  let e = 0
  while (e < elementList.length) {
    let element = elementList[e]
    // 筛选所需项
    if (e === 0 && element.value === ZERO) {
      e++
      continue
    }
    // 表格处理
    if (element.type === ElementType.TABLE) {
      if (element.trList) {
        for (let t = 0; t < element.trList.length; t++) {
          const tr = element.trList[t]
          delete tr.id
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            tr.tdList[d] = {
              colspan: td.colspan,
              rowspan: td.rowspan,
              value: zipElementList(td.value)
            }
          }
        }
      }
    } else if (element.type === ElementType.HYPERLINK) {
      // 超链接处理
      const hyperlinkId = element.hyperlinkId
      const hyperlinkElement: IElement = {
        type: ElementType.HYPERLINK,
        value: '',
        url: element.url
      }
      const valueList: IElement[] = []
      while (e < elementList.length) {
        const hyperlinkE = elementList[e]
        if (hyperlinkId !== hyperlinkE.hyperlinkId) {
          e--
          break
        }
        delete hyperlinkE.type
        delete hyperlinkE.url
        valueList.push(hyperlinkE)
        e++
      }
      hyperlinkElement.valueList = zipElementList(valueList)
      element = hyperlinkElement
    }
    // 压缩保留字段
    const newElement: IElement = {
      value: element.value === ZERO ? `\n` : element.value,
    }
    EDITOR_ELEMENT_ZIP_ATTR.forEach(attr => {
      const value = element[attr] as never
      if (value !== undefined) {
        newElement[attr] = value
      }
    })
    zipElementListData.push(newElement)
    e++
  }
  return zipElementListData
}
