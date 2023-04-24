import { IEditorOption, IElement, ListStyle, ListType, RowFlex } from '..'
import { ZERO } from '../dataset/constant/Common'
import { INLINE_NODE_NAME, TEXTLIKE_ELEMENT_TYPE } from '../dataset/constant/Element'
import { listStyleCSSMapping, listTypeElementMapping } from '../dataset/constant/List'
import { titleNodeNameMapping, titleOrderNumberMapping } from '../dataset/constant/Title'
import { ControlComponent } from '../dataset/enum/Control'
import { ElementType } from '../dataset/enum/Element'
import { DeepRequired } from '../interface/Common'
import { ITd } from '../interface/table/Td'
import { ITr } from '../interface/table/Tr'
import { getElementRowFlex, zipElementList } from './element'

export function writeClipboardItem(text: string, html: string) {
  if (!text || !html) return
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
    range.selectNodeContents(fakeElement)
    selection?.removeAllRanges()
    selection?.addRange(range)
    document.execCommand('copy')
    fakeElement.remove()
  }
}

export function convertElementToDom(element: IElement, options: DeepRequired<IEditorOption>): HTMLElement {
  const isBlock = element.rowFlex === RowFlex.CENTER || element.rowFlex === RowFlex.RIGHT
  const dom = document.createElement(isBlock ? 'p' : 'span')
  dom.style.fontFamily = element.font || options.defaultFont
  if (element.rowFlex) {
    const isAlignment = element.rowFlex === RowFlex.ALIGNMENT
    dom.style.textAlign = isAlignment ? 'justify' : element.rowFlex
  }
  if (element.color) {
    dom.style.color = element.color
  }
  if (element.bold) {
    dom.style.fontWeight = '600'
  }
  if (element.italic) {
    dom.style.fontStyle = 'italic'
  }
  dom.style.fontSize = `${element.size || options.defaultSize}px`
  if (element.highlight) {
    dom.style.backgroundColor = element.highlight
  }
  dom.innerText = element.value.replace(new RegExp(`${ZERO}`, 'g'), '\n')
  return dom
}

export function writeElementList(elementList: IElement[], options: DeepRequired<IEditorOption>) {
  function buildDomFromElementList(payload: IElement[]): HTMLDivElement {
    const clipboardDom = document.createElement('div')
    for (let e = 0; e < payload.length; e++) {
      const element = payload[e]
      // 构造表格
      if (element.type === ElementType.TABLE) {
        const tableDom: HTMLTableElement = document.createElement('table')
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const trDom = document.createElement('tr')
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const tdDom = document.createElement('td')
            tdDom.style.border = '1px solid'
            const td = tr.tdList[d]
            tdDom.colSpan = td.colspan
            tdDom.rowSpan = td.rowspan
            const childDom = buildDomFromElementList(zipElementList(td.value!))
            tdDom.innerHTML = childDom.innerHTML
            trDom.append(tdDom)
          }
          tableDom.append(trDom)
        }
        clipboardDom.append(tableDom)
      } else if (element.type === ElementType.HYPERLINK) {
        const a = document.createElement('a')
        a.innerText = element.valueList!.map(v => v.value).join('')
        if (element.url) {
          a.href = element.url
        }
        clipboardDom.append(a)
      } else if (element.type === ElementType.TITLE) {
        const h = document.createElement(`h${titleOrderNumberMapping[element.level!]}`)
        const childDom = buildDomFromElementList(zipElementList(element.valueList!))
        h.innerHTML = childDom.innerHTML
        clipboardDom.append(h)
      } else if (element.type === ElementType.LIST) {
        const list = document.createElement(listTypeElementMapping[element.listType!])
        if (element.listStyle) {
          list.style.listStyleType = listStyleCSSMapping[element.listStyle]
        }
        // 按照换行符拆分
        let curListIndex = 0
        const listElementListMap: Map<number, IElement[]> = new Map()
        const zipList = zipElementList(element.valueList!)
        for (let z = 0; z < zipList.length; z++) {
          const zipElement = zipList[z]
          const zipValueList = zipElement.value.split('\n')
          for (let c = 0; c < zipValueList.length; c++) {
            if (c > 0) {
              curListIndex += 1
            }
            const value = zipValueList[c]
            const listElementList = listElementListMap.get(curListIndex) || []
            listElementList.push({
              ...zipElement,
              value,
            })
            listElementListMap.set(curListIndex, listElementList)
          }
        }
        listElementListMap.forEach(listElementList => {
          const li = document.createElement('li')
          const childDom = buildDomFromElementList(listElementList)
          li.innerHTML = childDom.innerHTML
          list.append(li)
        })
        clipboardDom.append(list)
      } else if (element.type === ElementType.IMAGE) {
        const img = document.createElement('img')
        if (element.value) {
          img.src = element.value
          img.width = element.width!
          img.height = element.height!
        }
        clipboardDom.append(img)
      } else if (element.type === ElementType.SEPARATOR) {
        const hr = document.createElement('hr')
        clipboardDom.append(hr)
      } else if (element.type === ElementType.CHECKBOX) {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        if (element.checkbox?.value) {
          checkbox.setAttribute('checked', 'true')
        }
        clipboardDom.append(checkbox)
      } else if (
        !element.type
        || element.type === ElementType.LATEX
        || TEXTLIKE_ELEMENT_TYPE.includes(element.type)
      ) {
        let text = ''
        if (element.type === ElementType.CONTROL) {
          text = element.control!.value?.[0]?.value || ''
        } else if (element.type === ElementType.DATE) {
          text = element.valueList?.map(v => v.value).join('') || ''
        } else {
          text = element.value
        }
        if (!text) continue
        // 前一个元素是标题，移除首行换行符
        if (payload[e - 1]?.type === ElementType.TITLE) {
          text = text.replace(/^\n/, '')
        }
        const dom = convertElementToDom(element, options)
        dom.innerText = text.replace(new RegExp(`${ZERO}`, 'g'), '\n')
        clipboardDom.append(dom)
      }
    }
    return clipboardDom
  }
  const clipboardDom = buildDomFromElementList(zipElementList(elementList))
  // 写入剪贴板
  document.body.append(clipboardDom)
  const text = clipboardDom.innerText
  // 先追加后移除，否则innerText无法解析换行符
  clipboardDom.remove()
  const html = clipboardDom.innerHTML
  if (!text || !html) return
  writeClipboardItem(text, html)
}

interface IGetElementListByHTMLOption {
  innerWidth: number;
}

export function getElementListByHTML(htmlText: string, options: IGetElementListByHTMLOption): IElement[] {
  const elementList: IElement[] = []
  function findTextNode(dom: Element | Node) {
    if (dom.nodeType === 3) {
      const parentNode = <HTMLElement>dom.parentNode
      const rowFlex = getElementRowFlex(parentNode)
      const value = dom.textContent
      const style = window.getComputedStyle(parentNode)
      if (value && parentNode.nodeName !== 'STYLE') {
        const element: IElement = {
          value,
          color: style.color,
          bold: Number(style.fontWeight) > 500,
          italic: style.fontStyle.includes('italic'),
          size: Math.floor(Number(style.fontSize.replace('px', '')))
        }
        if (rowFlex !== RowFlex.LEFT) {
          element.rowFlex = rowFlex
        }
        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          element.highlight = style.backgroundColor
        }
        elementList.push(element)
      }
    } else if (dom.nodeType === 1) {
      const childNodes = dom.childNodes
      for (let n = 0; n < childNodes.length; n++) {
        const node = childNodes[n]
        // br元素与display:block元素需换行
        if (node.nodeName === 'BR') {
          elementList.push({
            value: '\n'
          })
        } else if (node.nodeName === 'A') {
          const aElement = node as HTMLLinkElement
          const value = aElement.innerText
          if (value) {
            elementList.push({
              type: ElementType.HYPERLINK,
              value: '',
              valueList: [{
                value
              }],
              url: aElement.href
            })
          }
        } else if (/H[1-6]/.test(node.nodeName)) {
          const hElement = node as HTMLTitleElement
          const valueList = getElementListByHTML(hElement.innerHTML, options)
          elementList.push({
            value: '',
            type: ElementType.TITLE,
            level: titleNodeNameMapping[node.nodeName],
            valueList
          })
          if (node.nextSibling && !INLINE_NODE_NAME.includes(node.nextSibling.nodeName)) {
            elementList.push({
              value: '\n'
            })
          }
        } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
          const listNode = node as HTMLOListElement | HTMLUListElement
          const listElement: IElement = {
            value: '',
            type: ElementType.LIST,
            valueList: []
          }
          if (node.nodeName === 'OL') {
            listElement.listType = ListType.OL
          } else {
            listElement.listType = ListType.UL
            listElement.listStyle = <ListStyle><unknown>listNode.style.listStyleType
          }
          listNode.querySelectorAll('li').forEach(li => {
            const liValueList = getElementListByHTML(li.innerHTML, options)
            liValueList.unshift({
              value: '\n'
            })
            listElement.valueList!.push(...liValueList)
          })
          elementList.push(listElement)
        } else if (node.nodeName === 'HR') {
          elementList.push({
            value: '\n',
            type: ElementType.SEPARATOR,
          })
        } else if (node.nodeName === 'IMG') {
          const { src, width, height } = node as HTMLImageElement
          if (src && width && height) {
            elementList.push({
              width,
              height,
              value: src,
              type: ElementType.IMAGE
            })
          }
        } else if (node.nodeName === 'TABLE') {
          const tableElement = node as HTMLTableElement
          const element: IElement = {
            type: ElementType.TABLE,
            value: '\n',
            colgroup: [],
            trList: []
          }
          // 基础数据
          tableElement.querySelectorAll('tr').forEach(trElement => {
            const trHeightStr = window.getComputedStyle(trElement).height.replace('px', '')
            const tr: ITr = {
              height: Number(trHeightStr),
              tdList: []
            }
            trElement.querySelectorAll('th,td').forEach(tdElement => {
              const tableCell = <HTMLTableCellElement>tdElement
              const valueList = getElementListByHTML(tableCell.innerHTML, options)
              const td: ITd = {
                colspan: tableCell.colSpan,
                rowspan: tableCell.rowSpan,
                value: valueList
              }
              tr.tdList.push(td)
            })
            if (tr.tdList.length) {
              element.trList!.push(tr)
            }
          })
          if (element.trList!.length) {
            // 列选项数据
            const tdCount = element.trList![0].tdList.reduce((pre, cur) => pre + cur.colspan, 0)
            const width = Math.ceil(options.innerWidth / tdCount)
            for (let i = 0; i < tdCount; i++) {
              element.colgroup!.push({
                width
              })
            }
            elementList.push(element)
          }
        } else if (node.nodeName === 'INPUT' && (<HTMLInputElement>node).type === ControlComponent.CHECKBOX) {
          elementList.push({
            type: ElementType.CHECKBOX,
            value: '',
            checkbox: {
              value: (<HTMLInputElement>node).checked
            }
          })
        } else {
          findTextNode(node)
          if (node.nodeType === 1 && n !== childNodes.length - 1) {
            const display = window.getComputedStyle(node as Element).display
            if (display === 'block') {
              elementList.push({
                value: '\n'
              })
            }
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
    if (child.nodeType !== 1 && !child.textContent?.trim()) {
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
