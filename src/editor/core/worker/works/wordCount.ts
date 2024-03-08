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

const ZERO = '\u200B'
const WRAP = '\n'

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
    } else if (element.controlId) {
      const controlId = element.controlId
      const valueList: IElement[] = []
      while (e < elementList.length) {
        const controlE = elementList[e]
        if (controlId !== controlE.controlId) {
          e--
          break
        }
        if (controlE.controlComponent === ControlComponent.VALUE) {
          delete controlE.controlId
          valueList.push(controlE)
        }
        e++
      }
      text += pickText(valueList)
    } else if (!element.type || element.type === ElementType.TEXT) {
      text += element.value
    }
    e++
  }
  return text
}

function groupText(text: string): string[] {
  const characterList: string[] = []
  // 英文或数字整体分隔为一个字数
  const numberReg = /[0-9]/
  const letterReg = /[A-Za-z]/
  const blankReg = /\s/
  // for of 循环字符
  let isPreLetter = false
  let isPreNumber = false
  let compositionText = ''
  // 处理组合文本
  function pushCompositionText() {
    if (compositionText) {
      characterList.push(compositionText)
      compositionText = ''
    }
  }
  for (const t of text) {
    if (letterReg.test(t)) {
      if (!isPreLetter) {
        pushCompositionText()
      }
      compositionText += t
      isPreLetter = true
      isPreNumber = false
    } else if (numberReg.test(t)) {
      if (!isPreNumber) {
        pushCompositionText()
      }
      compositionText += t
      isPreLetter = false
      isPreNumber = true
    } else {
      pushCompositionText()
      isPreLetter = false
      isPreNumber = false
      if (!blankReg.test(t)) {
        characterList.push(t)
      }
    }
  }
  pushCompositionText()
  return characterList
}

onmessage = evt => {
  const elementList = <IElement[]>evt.data
  // 提取文本
  const originText = pickText(elementList)
  // 过滤文本
  const filterText = originText
    .replace(new RegExp(`^${ZERO}`), '')
    .replace(new RegExp(ZERO, 'g'), WRAP)
  // 文本分组
  const textGroup = groupText(filterText)
  postMessage(textGroup.length)
}
