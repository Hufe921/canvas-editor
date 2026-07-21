import { IElement } from '../../../interface/Element'

enum ElementType {
  TEXT = 'text',
  TABLE = 'table',
  HYPERLINK = 'hyperlink',
  CONTROL = 'control',
  LATEX = 'latex'
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
    } else if (element.type === ElementType.LATEX) {
      text += element.value
    } else if (element.controlId) {
      if (!element.control?.hide) {
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
      }
    } else if (
      (!element.type || element.type === ElementType.TEXT) &&
      !element.area?.hide
    ) {
      text += element.value
    }
    e++
  }
  return text
}

function groupText(text: string): string[] {
  const result: string[] = []
  let buffer = ''

  const pushBuffer = () => {
    if (buffer) {
      result.push(buffer)
      buffer = ''
    }
  }
  // 空白字符
  const isBlank = (code: number): boolean => {
    return (
      // ASCII whitespace
      code <= 32 ||
      // NBSP
      code === 160 ||
      // Unicode spaces
      (code >= 8192 && code <= 8202) ||
      // Narrow NBSP
      code === 8239 ||
      // Ideographic space (全角空格)
      code === 12288 ||
      // Zero-width chars
      (code >= 8203 && code <= 8207) ||
      // Direction marks
      (code >= 8234 && code <= 8238) ||
      // Word joiner
      code === 8288 ||
      // BOM
      code === 65279
    )
  }

  // 半角英文字母和数字
  const isHalfLetterOrNumber = (code: number) =>
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) // a-z

  // 半角标点符号（包括连接符、小数点、斜杠等）
  const isHalfPunctuation = (code: number) =>
    (code >= 33 && code <= 47) ||
    (code >= 58 && code <= 64) ||
    (code >= 91 && code <= 96) ||
    (code >= 123 && code <= 126)

  // 可作为单词边界的标点（花括号等）
  const isWordBoundary = (code: number) => code === 123 || code === 125

  for (const char of text) {
    const code = char.charCodeAt(0)

    // 跳过空白字符
    if (isBlank(code)) {
      pushBuffer()
      continue
    }

    // 半角英文字母和数字 || 花括号：用于处理 {E_k} 这种形式 || 半角标点符号 => 可能是一个单词的开始或延续
    if (
      isHalfLetterOrNumber(code) ||
      isWordBoundary(code) ||
      isHalfPunctuation(code)
    ) {
      buffer += char
      continue
    }

    // 其他字符（中文、全角标点、全角特殊符号、拉丁文、特殊符号等）：按独立字符处理
    pushBuffer()
    result.push(char)
  }

  pushBuffer()
  return result
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
