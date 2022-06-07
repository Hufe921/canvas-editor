import { IElement } from '../../../interface/Element'

enum ElementType {
  TEXT = 'text',
  TABLE = 'table',
  HYPERLINK = 'hyperlink',
  CONTROL = 'control'
}

enum ControlComponent {
  VALUE = 'value'
}

function pickText(elementList: IElement[]): string {
  let text = ''
  let e = 0
  while (e < elementList.length) {
    const element = elementList[e]
    // 表格、超链接递归处理
    if (element.type === ElementType.TABLE) {
      if (element.trList) {
        for (let t = 0; t < element.trList.length; t++) {
          const tr = element.trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            text += pickText(td.value)
          }
        }
      }
    } else if (element.type === ElementType.HYPERLINK) {
      const hyperlinkId = element.hyperlinkId
      const valueList: IElement[] = []
      while (e < elementList.length) {
        const hyperlinkE = elementList[e]
        if (hyperlinkId !== hyperlinkE.hyperlinkId) {
          e--
          break
        }
        delete hyperlinkE.type
        valueList.push(hyperlinkE)
        e++
      }
      text += pickText(valueList)
    } else if (element.type === ElementType.CONTROL) {
      const controlId = element.controlId
      const valueList: IElement[] = []
      while (e < elementList.length) {
        const controlE = elementList[e]
        if (controlId !== controlE.controlId) {
          e--
          break
        }
        if (controlE.controlComponent === ControlComponent.VALUE) {
          delete controlE.type
          valueList.push(controlE)
        }
        e++
      }
      text += pickText(valueList)
    }
    // 文本追加
    if (!element.type || element.type === ElementType.TEXT) {
      text += element.value
    }
    e++
  }
  return text
}

function groupText(text: string): string[] {
  const textList: string[] = []
  for (const t of text) {
    textList.push(t)
  }
  return textList
}

onmessage = (evt) => {
  const elementList = <IElement[]>evt.data

  // 提取所有文本
  const originText = pickText(elementList)

  // 过滤文本
  const ZERO = '\u200B'
  const WRAP = '\n'
  const filterText = originText
    .replace(new RegExp(`^${ZERO}`), '')
    .replace(new RegExp(ZERO, 'g'), WRAP)

  // 英文或数字以逗号/换行符分隔为一个字数
  const textGroup = groupText(filterText)

  postMessage(textGroup.length)
}
