import { IEditorOption, IElement } from '..'
import { EDITOR_CLIPBOARD } from '../dataset/constant/Editor'
import { DeepRequired } from '../interface/Common'
import { createDomFromElementList, zipElementList } from './element'

export interface IClipboardData {
  text: string
  elementList: IElement[]
}

export function setClipboardData(data: IClipboardData) {
  localStorage.setItem(
    EDITOR_CLIPBOARD,
    JSON.stringify({
      text: data.text,
      elementList: data.elementList
    })
  )
}

export function getClipboardData(): IClipboardData | null {
  const clipboardText = localStorage.getItem(EDITOR_CLIPBOARD)
  return clipboardText ? JSON.parse(clipboardText) : null
}

export function removeClipboardData() {
  localStorage.removeItem(EDITOR_CLIPBOARD)
}

export function writeClipboardItem(
  text: string,
  html: string,
  elementList: IElement[]
) {
  if (!text && !html && !elementList.length) return
  const plainText = new Blob([text], { type: 'text/plain' })
  const htmlText = new Blob([html], { type: 'text/html' })
  if (window.ClipboardItem) {
    // @ts-ignore
    const item = new ClipboardItem({
      [plainText.type]: plainText,
      [htmlText.type]: htmlText
    })
    window.navigator.clipboard.write([item])
  } else {
    const fakeElement = document.createElement('div')
    fakeElement.setAttribute('contenteditable', 'true')
    fakeElement.innerHTML = html
    document.body.append(fakeElement)
    // add new range
    const selection = window.getSelection()
    const range = document.createRange()
    // 增加尾行换行字符避免dom复制缺失
    const br = document.createElement('span')
    br.innerText = '\n'
    fakeElement.append(br)
    // 扩选选区并执行复制
    range.selectNodeContents(fakeElement)
    selection?.removeAllRanges()
    selection?.addRange(range)
    document.execCommand('copy')
    fakeElement.remove()
  }
  // 编辑器结构化数据
  setClipboardData({ text, elementList })
}

export function writeElementList(
  elementList: IElement[],
  options: DeepRequired<IEditorOption>
) {
  const clipboardDom = createDomFromElementList(elementList, options)
  // 写入剪贴板
  document.body.append(clipboardDom)
  const text = clipboardDom.innerText
  // 先追加后移除，否则innerText无法解析换行符
  clipboardDom.remove()
  const html = clipboardDom.innerHTML
  if (!text && !html && !elementList.length) return
  writeClipboardItem(text, html, zipElementList(elementList))
}

export function getIsClipboardContainFile(clipboardData: DataTransfer) {
  let isFile = false
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i]
    if (item.kind === 'file') {
      isFile = true
      break
    }
  }
  return isFile
}
