import { ZERO } from '../../../dataset/constant/Common'
import { VIRTUAL_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { IPasteOption } from '../../../interface/Event'
import {
  getClipboardData,
  getIsClipboardContainFile,
  removeClipboardData
} from '../../../utils/clipboard'
import {
  formatElementContext,
  getElementListByHTML
} from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'

export function pasteElement(host: CanvasEvent, elementList: IElement[]) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const rangeManager = draw.getRange()
  const { startIndex } = rangeManager.getRange()
  const originalElementList = draw.getElementList()
  // 全选粘贴无需格式化上下文
  if (~startIndex && !rangeManager.getIsSelectAll()) {
    // 如果是复制到虚拟元素里，则粘贴列表的虚拟元素需扁平化处理，避免产生新的虚拟元素
    const anchorElement = originalElementList[startIndex]
    if (anchorElement?.titleId || anchorElement?.listId) {
      let start = 0
      while (start < elementList.length) {
        const pasteElement = elementList[start]
        if (anchorElement.titleId && /^\n/.test(pasteElement.value)) {
          break
        }
        if (VIRTUAL_ELEMENT_TYPE.includes(pasteElement.type!)) {
          elementList.splice(start, 1)
          if (pasteElement.valueList) {
            for (let v = 0; v < pasteElement.valueList.length; v++) {
              const element = pasteElement.valueList[v]
              if (element.value === ZERO || element.value === '\n') {
                continue
              }
              elementList.splice(start, 0, element)
              start++
            }
          }
          start--
        }
        start++
      }
    }
    formatElementContext(originalElementList, elementList, startIndex, {
      isBreakWhenWrap: true
    })
  }
  draw.insertElementList(elementList)
}

export function pasteHTML(host: CanvasEvent, htmlText: string) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const elementList = getElementListByHTML(htmlText, {
    innerWidth: draw.getOriginalInnerWidth()
  })
  pasteElement(host, elementList)
}

export function pasteImage(host: CanvasEvent, file: File | Blob) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const rangeManager = draw.getRange()
  const { startIndex } = rangeManager.getRange()
  const elementList = draw.getElementList()
  // 创建文件读取器
  const fileReader = new FileReader()
  fileReader.readAsDataURL(file)
  fileReader.onload = () => {
    // 计算宽高
    const image = new Image()
    const value = fileReader.result as string
    image.src = value
    image.onload = () => {
      const imageElement: IElement = {
        value,
        type: ElementType.IMAGE,
        width: image.width,
        height: image.height
      }
      if (~startIndex) {
        formatElementContext(elementList, [imageElement], startIndex)
      }
      draw.insertElementList([imageElement])
    }
  }
}

export function pasteByEvent(host: CanvasEvent, evt: ClipboardEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const clipboardData = evt.clipboardData
  if (!clipboardData) return
  // 自定义粘贴事件
  const { paste } = draw.getOverride()
  if (paste) {
    paste(evt)
    return
  }
  // 优先读取编辑器内部粘贴板数据（粘贴板不包含文件时）
  if (!getIsClipboardContainFile(clipboardData)) {
    const clipboardText = clipboardData.getData('text')
    const editorClipboardData = getClipboardData()
    if (clipboardText === editorClipboardData?.text) {
      pasteElement(host, editorClipboardData.elementList)
      return
    }
  }
  removeClipboardData()
  // 从粘贴板提取数据
  let isHTML = false
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i]
    if (item.type === 'text/html') {
      isHTML = true
      break
    }
  }
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i]
    if (item.kind === 'string') {
      if (item.type === 'text/plain' && !isHTML) {
        item.getAsString(plainText => {
          host.input(plainText)
        })
        break
      }
      if (item.type === 'text/html' && isHTML) {
        item.getAsString(htmlText => {
          pasteHTML(host, htmlText)
        })
        break
      }
    } else if (item.kind === 'file') {
      if (item.type.includes('image')) {
        const file = item.getAsFile()
        if (file) {
          pasteImage(host, file)
        }
      }
    }
  }
}

export async function pasteByApi(host: CanvasEvent, options?: IPasteOption) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  // 自定义粘贴事件
  const { paste } = draw.getOverride()
  if (paste) {
    paste()
    return
  }
  // 优先读取编辑器内部粘贴板数据
  const clipboardText = await navigator.clipboard.readText()
  const editorClipboardData = getClipboardData()
  if (clipboardText === editorClipboardData?.text) {
    pasteElement(host, editorClipboardData.elementList)
    return
  }
  removeClipboardData()
  // 从内存粘贴板获取数据
  if (options?.isPlainText) {
    if (clipboardText) {
      host.input(clipboardText)
    }
  } else {
    const clipboardData = await navigator.clipboard.read()
    let isHTML = false
    for (const item of clipboardData) {
      if (item.types.includes('text/html')) {
        isHTML = true
        break
      }
    }
    for (const item of clipboardData) {
      if (item.types.includes('text/plain') && !isHTML) {
        const textBlob = await item.getType('text/plain')
        const text = await textBlob.text()
        if (text) {
          host.input(text)
        }
      } else if (item.types.includes('text/html') && isHTML) {
        const htmlTextBlob = await item.getType('text/html')
        const htmlText = await htmlTextBlob.text()
        if (htmlText) {
          pasteHTML(host, htmlText)
        }
      } else if (item.types.some(type => type.startsWith('image/'))) {
        const type = item.types.find(type => type.startsWith('image/'))!
        const imageBlob = await item.getType(type)
        pasteImage(host, imageBlob)
      }
    }
  }
}
