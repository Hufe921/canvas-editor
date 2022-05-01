import { IElement } from '..'
import { HORIZON_TAB, WRAP, ZERO } from '../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../dataset/constant/Element'
import { ElementType } from '../dataset/enum/Element'

export function writeText(text: string) {
  if (!text) return
  window.navigator.clipboard.writeText(text.replaceAll(ZERO, `\n`))
}

export function writeTextByElementList(elementList: IElement[]) {
  let text = ``
  function pickTextFromElement(payload: IElement[]) {
    for (let e = 0; e < payload.length; e++) {
      const element = payload[e]
      if (element.type === ElementType.TABLE) {
        if (e !== 0) {
          text += WRAP
        }
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            // 排除td首个元素
            pickTextFromElement(td.value.slice(1, td.value.length))
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
  writeText(text.replace(new RegExp(`^${ZERO}`), ''))
}

export function getElementListByClipboardHTML(htmlText: string): IElement[] {
  const elementList: IElement[] = []
  function findTextNode(dom: Element | Node) {
    if (dom.nodeType === 3) {
      const style = window.getComputedStyle(dom.parentNode as Element)
      const value = dom.textContent
      if (value) {
        elementList.push({
          value,
          color: style.color,
          bold: Number(style.fontWeight) > 500,
          italic: style.fontStyle.includes('italic'),
          size: Math.floor(Number(style.fontSize.replace('px', '')))
        })
      }
    } else if (dom.nodeType === 1) {
      const childNodes = dom.childNodes
      for (let n = 0; n < childNodes.length; n++) {
        const node = childNodes[n]
        findTextNode(node)
        // block
        if (node.nodeType === 1 && n !== childNodes.length - 1) {
          const display = window.getComputedStyle(node as Element).display
          if (display === 'block') {
            elementList.push({
              value: `\n`
            })
          }
        }
      }
    }
  }
  // 追加dom
  const clipboardDom = document.createElement('div')
  clipboardDom.innerHTML = htmlText
  document.body.appendChild(clipboardDom)
  const deleteNodes: ChildNode[] = []
  clipboardDom.childNodes.forEach(child => {
    if (child.nodeType !== 1) {
      deleteNodes.push(child)
    }
  })
  deleteNodes.forEach(node => node.remove())
  // 搜索文本节点
  findTextNode(clipboardDom)
  // 移除dom
  clipboardDom.remove()
  return elementList
}
