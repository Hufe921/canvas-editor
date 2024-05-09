import {
  cloneProperty,
  deepClone,
  deepCloneOmitKeys,
  getUUID,
  isArrayEqual,
  pickObject,
  splitText
} from '.'
import {
  ElementType,
  IEditorOption,
  IElement,
  ListStyle,
  ListType,
  RowFlex,
  TableBorder,
  TdBorder
} from '..'
import { LaTexParticle } from '../core/draw/particle/latex/LaTexParticle'
import { NON_BREAKING_SPACE, ZERO } from '../dataset/constant/Common'
import {
  CONTROL_STYLE_ATTR,
  EDITOR_ELEMENT_CONTEXT_ATTR,
  EDITOR_ELEMENT_ZIP_ATTR,
  INLINE_NODE_NAME,
  TABLE_CONTEXT_ATTR,
  TABLE_TD_ZIP_ATTR,
  TEXTLIKE_ELEMENT_TYPE
} from '../dataset/constant/Element'
import {
  listStyleCSSMapping,
  listTypeElementMapping,
  ulStyleMapping
} from '../dataset/constant/List'
import { START_LINE_BREAK_REG } from '../dataset/constant/Regular'
import {
  titleNodeNameMapping,
  titleOrderNumberMapping,
  titleSizeMapping
} from '../dataset/constant/Title'
import { ControlComponent, ControlType } from '../dataset/enum/Control'
import { UlStyle } from '../dataset/enum/List'
import { DeepRequired } from '../interface/Common'
import { IControlSelect } from '../interface/Control'
import { IRowElement } from '../interface/Row'
import { ITd } from '../interface/table/Td'
import { ITr } from '../interface/table/Tr'

export function unzipElementList(elementList: IElement[]): IElement[] {
  const result: IElement[] = []
  for (let v = 0; v < elementList.length; v++) {
    const valueItem = elementList[v]
    const textList = splitText(valueItem.value)
    for (let d = 0; d < textList.length; d++) {
      result.push({ ...valueItem, value: textList[d] })
    }
  }
  return result
}

interface IFormatElementListOption {
  isHandleFirstElement?: boolean
  editorOptions: DeepRequired<IEditorOption>
}

export function formatElementList(
  elementList: IElement[],
  options: IFormatElementListOption
) {
  const { isHandleFirstElement, editorOptions } = <IFormatElementListOption>{
    isHandleFirstElement: true,
    ...options
  }
  const startElement = elementList[0]
  // 非首字符零宽节点文本元素则补偿-列表元素内部会补偿此处忽略
  if (
    isHandleFirstElement &&
    startElement?.type !== ElementType.LIST &&
    ((startElement?.type && startElement.type !== ElementType.TEXT) ||
      !START_LINE_BREAK_REG.test(startElement?.value))
  ) {
    elementList.unshift({
      value: ZERO
    })
  }
  let i = 0
  while (i < elementList.length) {
    let el = elementList[i]
    // 优先处理虚拟元素
    if (el.type === ElementType.TITLE) {
      // 移除父节点
      elementList.splice(i, 1)
      // 格式化元素
      const valueList = el.valueList || []
      formatElementList(valueList, {
        ...options,
        isHandleFirstElement: false
      })
      // 追加节点
      if (valueList.length) {
        const titleId = getUUID()
        const titleOptions = editorOptions.title
        for (let v = 0; v < valueList.length; v++) {
          const value = valueList[v]
          value.title = el.title
          if (el.level) {
            value.titleId = titleId
            value.level = el.level
          }
          // 文本型元素设置字体及加粗
          if (isTextLikeElement(value)) {
            if (!value.size) {
              value.size = titleOptions[titleSizeMapping[value.level!]]
            }
            if (value.bold === undefined) {
              value.bold = true
            }
          }
          elementList.splice(i, 0, value)
          i++
        }
      }
      i--
    } else if (el.type === ElementType.LIST) {
      // 移除父节点
      elementList.splice(i, 1)
      // 格式化元素
      const valueList = el.valueList || []
      formatElementList(valueList, {
        ...options,
        isHandleFirstElement: true
      })
      // 追加节点
      if (valueList.length) {
        const listId = getUUID()
        for (let v = 0; v < valueList.length; v++) {
          const value = valueList[v]
          value.listId = listId
          value.listType = el.listType
          value.listStyle = el.listStyle
          elementList.splice(i, 0, value)
          i++
        }
      }
      i--
    } else if (el.type === ElementType.TABLE) {
      const tableId = getUUID()
      el.id = tableId
      if (el.trList) {
        const { defaultTrMinHeight } = editorOptions.table
        for (let t = 0; t < el.trList.length; t++) {
          const tr = el.trList[t]
          const trId = getUUID()
          tr.id = trId
          if (!tr.minHeight || tr.minHeight < defaultTrMinHeight) {
            tr.minHeight = defaultTrMinHeight
          }
          if (tr.height < tr.minHeight) {
            tr.height = tr.minHeight
          }
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const tdId = getUUID()
            td.id = tdId
            formatElementList(td.value, {
              ...options,
              isHandleFirstElement: true
            })
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
      // 移除父节点
      elementList.splice(i, 1)
      // 元素展开
      const valueList = unzipElementList(el.valueList || [])
      // 追加节点
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
    } else if (el.type === ElementType.DATE) {
      // 移除父节点
      elementList.splice(i, 1)
      // 元素展开
      const valueList = unzipElementList(el.valueList || [])
      // 追加节点
      if (valueList.length) {
        const dateId = getUUID()
        for (let v = 0; v < valueList.length; v++) {
          const value = valueList[v]
          value.type = el.type
          value.dateFormat = el.dateFormat
          value.dateId = dateId
          elementList.splice(i, 0, value)
          i++
        }
      }
      i--
    } else if (el.type === ElementType.CONTROL) {
      // 兼容控件内容类型错误
      if (!el.control) {
        i++
        continue
      }
      const { prefix, postfix, value, placeholder, code, type, valueSets } =
        el.control
      const {
        editorOptions: {
          control: controlOption,
          checkbox: checkboxOption,
          radio: radioOption
        }
      } = options
      const controlId = getUUID()
      // 移除父节点
      elementList.splice(i, 1)
      // 控件上下文提取（压缩后的控件上下文无法提取）
      const controlContext = pickObject(el, EDITOR_ELEMENT_CONTEXT_ATTR)
      // 控件设置的默认样式（以前缀为基准）
      const controlDefaultStyle = pickObject(
        <IElement>(<unknown>el.control),
        CONTROL_STYLE_ATTR
      )
      // 前后缀个性化设置
      const thePrePostfixArg: Omit<IElement, 'value'> = {
        ...controlDefaultStyle,
        color: editorOptions.control.bracketColor
      }
      // 前缀
      const prefixStrList = splitText(prefix || controlOption.prefix)
      for (let p = 0; p < prefixStrList.length; p++) {
        const value = prefixStrList[p]
        elementList.splice(i, 0, {
          ...controlContext,
          ...thePrePostfixArg,
          controlId,
          value,
          type: el.type,
          control: el.control,
          controlComponent: ControlComponent.PREFIX
        })
        i++
      }
      // 值
      if (
        (value && value.length) ||
        type === ControlType.CHECKBOX ||
        type === ControlType.RADIO ||
        (type === ControlType.SELECT && code && (!value || !value.length))
      ) {
        let valueList: IElement[] = value || []
        if (type === ControlType.CHECKBOX) {
          const codeList = code ? code.split(',') : []
          if (Array.isArray(valueSets) && valueSets.length) {
            // 拆分valueList优先使用其属性
            const valueStyleList = valueList.reduce(
              (pre, cur) =>
                pre.concat(
                  cur.value.split('').map(v => ({ ...cur, value: v }))
                ),
              [] as IElement[]
            )
            let valueStyleIndex = 0
            for (let v = 0; v < valueSets.length; v++) {
              const valueSet = valueSets[v]
              // checkbox组件
              elementList.splice(i, 0, {
                ...controlContext,
                controlId,
                value: '',
                type: el.type,
                control: el.control,
                controlComponent: ControlComponent.CHECKBOX,
                checkbox: {
                  code: valueSet.code,
                  value: codeList.includes(valueSet.code)
                }
              })
              i++
              // 文本
              const valueStrList = splitText(valueSet.value)
              for (let e = 0; e < valueStrList.length; e++) {
                const value = valueStrList[e]
                const isLastLetter = e === valueStrList.length - 1
                elementList.splice(i, 0, {
                  ...controlContext,
                  ...controlDefaultStyle,
                  ...valueStyleList[valueStyleIndex],
                  controlId,
                  value: value === '\n' ? ZERO : value,
                  letterSpacing: isLastLetter ? checkboxOption.gap : 0,
                  control: el.control,
                  controlComponent: ControlComponent.VALUE
                })
                valueStyleIndex++
                i++
              }
            }
          }
        } else if (type === ControlType.RADIO) {
          if (Array.isArray(valueSets) && valueSets.length) {
            // 拆分valueList优先使用其属性
            const valueStyleList = valueList.reduce(
              (pre, cur) =>
                pre.concat(
                  cur.value.split('').map(v => ({ ...cur, value: v }))
                ),
              [] as IElement[]
            )
            let valueStyleIndex = 0
            for (let v = 0; v < valueSets.length; v++) {
              const valueSet = valueSets[v]
              // radio组件
              elementList.splice(i, 0, {
                ...controlContext,
                controlId,
                value: '',
                type: el.type,
                control: el.control,
                controlComponent: ControlComponent.RADIO,
                radio: {
                  code: valueSet.code,
                  value: code === valueSet.code
                }
              })
              i++
              // 文本
              const valueStrList = splitText(valueSet.value)
              for (let e = 0; e < valueStrList.length; e++) {
                const value = valueStrList[e]
                const isLastLetter = e === valueStrList.length - 1
                elementList.splice(i, 0, {
                  ...controlContext,
                  ...controlDefaultStyle,
                  ...valueStyleList[valueStyleIndex],
                  controlId,
                  value: value === '\n' ? ZERO : value,
                  letterSpacing: isLastLetter ? radioOption.gap : 0,
                  control: el.control,
                  controlComponent: ControlComponent.VALUE
                })
                valueStyleIndex++
                i++
              }
            }
          }
        } else {
          if (!value || !value.length) {
            if (Array.isArray(valueSets) && valueSets.length) {
              const valueSet = valueSets.find(v => v.code === code)
              if (valueSet) {
                valueList = [
                  {
                    value: valueSet.value
                  }
                ]
              }
            }
          }
          formatElementList(valueList, {
            ...options,
            isHandleFirstElement: false
          })
          for (let v = 0; v < valueList.length; v++) {
            const element = valueList[v]
            const value = element.value
            elementList.splice(i, 0, {
              ...controlContext,
              ...controlDefaultStyle,
              ...element,
              controlId,
              value: value === '\n' ? ZERO : value,
              type: element.type || ElementType.TEXT,
              control: el.control,
              controlComponent: ControlComponent.VALUE
            })
            i++
          }
        }
      } else if (placeholder) {
        // placeholder
        const thePlaceholderArgs: Omit<IElement, 'value'> = {
          ...controlDefaultStyle,
          color: editorOptions.control.placeholderColor
        }
        const placeholderStrList = splitText(placeholder)
        for (let p = 0; p < placeholderStrList.length; p++) {
          const value = placeholderStrList[p]
          elementList.splice(i, 0, {
            ...controlContext,
            ...thePlaceholderArgs,
            controlId,
            value: value === '\n' ? ZERO : value,
            type: el.type,
            control: el.control,
            controlComponent: ControlComponent.PLACEHOLDER
          })
          i++
        }
      }
      // 后缀
      const postfixStrList = splitText(postfix || controlOption.postfix)
      for (let p = 0; p < postfixStrList.length; p++) {
        const value = postfixStrList[p]
        elementList.splice(i, 0, {
          ...controlContext,
          ...thePrePostfixArg,
          controlId,
          value,
          type: el.type,
          control: el.control,
          controlComponent: ControlComponent.POSTFIX
        })
        i++
      }
      i--
    } else if (
      (!el.type || TEXTLIKE_ELEMENT_TYPE.includes(el.type)) &&
      el.value.length > 1
    ) {
      elementList.splice(i, 1)
      const valueList = splitText(el.value)
      for (let v = 0; v < valueList.length; v++) {
        elementList.splice(i + v, 0, { ...el, value: valueList[v] })
      }
      el = elementList[i]
    }
    if (el.value === '\n') {
      el.value = ZERO
    }
    if (el.type === ElementType.IMAGE || el.type === ElementType.BLOCK) {
      el.id = getUUID()
    }
    if (el.type === ElementType.LATEX) {
      const { svg, width, height } = LaTexParticle.convertLaTextToSVG(el.value)
      el.width = el.width || width
      el.height = el.height || height
      el.laTexSVG = svg
      el.id = getUUID()
    }
    i++
  }
}

export function isSameElementExceptValue(
  source: IElement,
  target: IElement
): boolean {
  const sourceKeys = Object.keys(source)
  const targetKeys = Object.keys(target)
  if (sourceKeys.length !== targetKeys.length) return false
  for (let s = 0; s < sourceKeys.length; s++) {
    const key = sourceKeys[s] as never
    // 值不需要校验
    if (key === 'value') continue
    // groupIds数组需特殊校验数组是否相等
    if (
      key === 'groupIds' &&
      Array.isArray(source[key]) &&
      Array.isArray(target[key]) &&
      isArrayEqual(source[key], target[key])
    ) {
      continue
    }
    if (source[key] !== target[key]) {
      return false
    }
  }
  return true
}

export function pickElementAttr(payload: IElement): IElement {
  const element: IElement = {
    value: payload.value === ZERO ? `\n` : payload.value
  }
  EDITOR_ELEMENT_ZIP_ATTR.forEach(attr => {
    const value = payload[attr] as never
    if (value !== undefined) {
      element[attr] = value
    }
  })
  return element
}

export function zipElementList(payload: IElement[]): IElement[] {
  const elementList = deepClone(payload)
  const zipElementListData: IElement[] = []
  let e = 0
  while (e < elementList.length) {
    let element = elementList[e]
    // 上下文首字符（占位符）-列表首字符要保留避免是复选框
    if (
      e === 0 &&
      element.value === ZERO &&
      !element.listId &&
      (!element.type || element.type === ElementType.TEXT)
    ) {
      e++
      continue
    }
    // 优先处理虚拟元素，后表格、超链接、日期、控件特殊处理
    if (element.titleId && element.level) {
      // 标题处理
      const titleId = element.titleId
      if (titleId) {
        const level = element.level
        const titleElement: IElement = {
          type: ElementType.TITLE,
          title: element.title,
          value: '',
          level
        }
        const valueList: IElement[] = []
        while (e < elementList.length) {
          const titleE = elementList[e]
          if (titleId !== titleE.titleId) {
            e--
            break
          }
          delete titleE.level
          delete titleE.title
          valueList.push(titleE)
          e++
        }
        titleElement.valueList = zipElementList(valueList)
        element = titleElement
      }
    } else if (element.listId && element.listType) {
      // 列表处理
      const listId = element.listId
      if (listId) {
        const listType = element.listType
        const listStyle = element.listStyle
        const listElement: IElement = {
          type: ElementType.LIST,
          value: '',
          listId,
          listType,
          listStyle
        }
        const valueList: IElement[] = []
        while (e < elementList.length) {
          const listE = elementList[e]
          if (listId !== listE.listId) {
            e--
            break
          }
          delete listE.listType
          delete listE.listStyle
          valueList.push(listE)
          e++
        }
        listElement.valueList = zipElementList(valueList)
        element = listElement
      }
    } else if (element.type === ElementType.TABLE) {
      // 分页表格先进行合并
      if (element.pagingId) {
        let tableIndex = e + 1
        let combineCount = 0
        while (tableIndex < elementList.length) {
          const nextElement = elementList[tableIndex]
          if (nextElement.pagingId === element.pagingId) {
            element.height! += nextElement.height!
            element.trList!.push(...nextElement.trList!)
            tableIndex++
            combineCount++
          } else {
            break
          }
        }
        e += combineCount
      }
      if (element.trList) {
        for (let t = 0; t < element.trList.length; t++) {
          const tr = element.trList[t]
          delete tr.id
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const zipTd: ITd = {
              colspan: td.colspan,
              rowspan: td.rowspan,
              value: zipElementList(td.value)
            }
            // 压缩单元格属性
            TABLE_TD_ZIP_ATTR.forEach(attr => {
              const value = td[attr] as never
              if (value !== undefined) {
                zipTd[attr] = value
              }
            })
            tr.tdList[d] = zipTd
          }
        }
      }
    } else if (element.type === ElementType.HYPERLINK) {
      // 超链接处理
      const hyperlinkId = element.hyperlinkId
      if (hyperlinkId) {
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
    } else if (element.type === ElementType.DATE) {
      const dateId = element.dateId
      if (dateId) {
        const dateElement: IElement = {
          type: ElementType.DATE,
          value: '',
          dateFormat: element.dateFormat
        }
        const valueList: IElement[] = []
        while (e < elementList.length) {
          const dateE = elementList[e]
          if (dateId !== dateE.dateId) {
            e--
            break
          }
          delete dateE.type
          delete dateE.dateFormat
          valueList.push(dateE)
          e++
        }
        dateElement.valueList = zipElementList(valueList)
        element = dateElement
      }
    } else if (element.controlId) {
      // 控件处理
      const controlId = element.controlId
      if (controlId) {
        // 以前缀为基准更新控件默认样式
        const controlDefaultStyle = <IControlSelect>(
          (<unknown>pickObject(element, CONTROL_STYLE_ATTR))
        )
        const control = {
          ...element.control!,
          ...controlDefaultStyle
        }
        const controlElement: IElement = {
          type: ElementType.CONTROL,
          value: '',
          control
        }
        const valueList: IElement[] = []
        while (e < elementList.length) {
          const controlE = elementList[e]
          if (controlId !== controlE.controlId) {
            e--
            break
          }
          if (controlE.controlComponent === ControlComponent.VALUE) {
            delete controlE.control
            delete controlE.controlId
            valueList.push(controlE)
          }
          e++
        }
        controlElement.control!.value = zipElementList(valueList)
        element = controlElement
      }
    }
    // 组合元素
    const pickElement = pickElementAttr(element)
    if (
      !element.type ||
      element.type === ElementType.TEXT ||
      element.type === ElementType.SUBSCRIPT ||
      element.type === ElementType.SUPERSCRIPT
    ) {
      while (e < elementList.length) {
        const nextElement = elementList[e + 1]
        e++
        if (
          nextElement &&
          isSameElementExceptValue(pickElement, pickElementAttr(nextElement))
        ) {
          const nextValue =
            nextElement.value === ZERO ? '\n' : nextElement.value
          pickElement.value += nextValue
        } else {
          break
        }
      }
    } else {
      e++
    }
    zipElementListData.push(pickElement)
  }
  return zipElementListData
}

export function getElementRowFlex(node: HTMLElement) {
  const textAlign = window.getComputedStyle(node).textAlign
  switch (textAlign) {
    case 'left':
    case 'start':
      return RowFlex.LEFT
    case 'center':
      return RowFlex.CENTER
    case 'right':
    case 'end':
      return RowFlex.RIGHT
    case 'justify':
      return RowFlex.ALIGNMENT
    case 'justify-all':
      return RowFlex.JUSTIFY
    default:
      return RowFlex.LEFT
  }
}

export function isTextLikeElement(element: IElement): boolean {
  return !element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)
}

export function getAnchorElement(
  elementList: IElement[],
  anchorIndex: number
): IElement | null {
  const anchorElement = elementList[anchorIndex]
  if (!anchorElement) return null
  const anchorNextElement = elementList[anchorIndex + 1]
  // 非列表元素 && 当前元素是换行符 && 下一个元素不是换行符 则以下一个元素作为参考元素
  return !anchorElement.listId &&
    anchorElement.value === ZERO &&
    anchorNextElement &&
    anchorNextElement.value !== ZERO
    ? anchorNextElement
    : anchorElement
}

export interface IFormatElementContextOption {
  isBreakWhenWrap: boolean
}

export function formatElementContext(
  sourceElementList: IElement[],
  formatElementList: IElement[],
  anchorIndex: number,
  options?: IFormatElementContextOption
) {
  const copyElement = getAnchorElement(sourceElementList, anchorIndex)
  if (!copyElement) return
  const { isBreakWhenWrap = false } = options || {}
  // 是否已经换行
  let isBreakWarped = false
  for (let e = 0; e < formatElementList.length; e++) {
    const targetElement = formatElementList[e]
    if (
      isBreakWhenWrap &&
      !copyElement.listId &&
      /^\n/.test(targetElement.value)
    ) {
      isBreakWarped = true
    }
    // 1. 即使换行停止也要处理表格上下文信息
    // 2. 定位元素非列表，无需处理粘贴列表的上下文，仅处理表格上下文信息
    if (
      isBreakWarped ||
      (!copyElement.listId && targetElement.type === ElementType.LIST)
    ) {
      cloneProperty<IElement>(TABLE_CONTEXT_ATTR, copyElement, targetElement)
      targetElement.valueList?.forEach(valueItem => {
        cloneProperty<IElement>(TABLE_CONTEXT_ATTR, copyElement, valueItem)
      })
      continue
    }
    if (targetElement.valueList?.length) {
      formatElementContext(
        sourceElementList,
        targetElement.valueList,
        anchorIndex
      )
    }
    cloneProperty<IElement>(
      EDITOR_ELEMENT_CONTEXT_ATTR,
      copyElement,
      targetElement
    )
  }
}

export function convertElementToDom(
  element: IElement,
  options: DeepRequired<IEditorOption>
): HTMLElement {
  let tagName: keyof HTMLElementTagNameMap = 'span'
  if (element.type === ElementType.SUPERSCRIPT) {
    tagName = 'sup'
  } else if (element.type === ElementType.SUBSCRIPT) {
    tagName = 'sub'
  } else if (
    element.rowFlex === RowFlex.CENTER ||
    element.rowFlex === RowFlex.RIGHT
  ) {
    tagName = 'p'
  }
  const dom = document.createElement(tagName)
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
  if (element.underline) {
    dom.style.textDecoration = 'underline'
  }
  if (element.strikeout) {
    dom.style.textDecoration += ' line-through'
  }
  dom.innerText = element.value.replace(new RegExp(`${ZERO}`, 'g'), '\n')
  return dom
}

export function splitListElement(
  elementList: IElement[]
): Map<number, IElement[]> {
  let curListIndex = 0
  const listElementListMap: Map<number, IElement[]> = new Map()
  for (let e = 0; e < elementList.length; e++) {
    const element = elementList[e]
    // 移除列表首行换行字符-如果是复选框直接忽略
    if (e === 0) {
      if (element.checkbox) continue
      element.value = element.value.replace(START_LINE_BREAK_REG, '')
    }
    if (element.listWrap) {
      const listElementList = listElementListMap.get(curListIndex) || []
      listElementList.push(element)
      listElementListMap.set(curListIndex, listElementList)
    } else {
      const valueList = element.value.split('\n')
      for (let c = 0; c < valueList.length; c++) {
        if (c > 0) {
          curListIndex += 1
        }
        const value = valueList[c]
        const listElementList = listElementListMap.get(curListIndex) || []
        listElementList.push({
          ...element,
          value
        })
        listElementListMap.set(curListIndex, listElementList)
      }
    }
  }
  return listElementListMap
}

export function createDomFromElementList(
  elementList: IElement[],
  options: DeepRequired<IEditorOption>
) {
  function buildDom(payload: IElement[]): HTMLDivElement {
    const clipboardDom = document.createElement('div')
    for (let e = 0; e < payload.length; e++) {
      const element = payload[e]
      // 构造表格
      if (element.type === ElementType.TABLE) {
        const tableDom: HTMLTableElement = document.createElement('table')
        tableDom.setAttribute('cellSpacing', '0')
        tableDom.setAttribute('cellpadding', '0')
        tableDom.setAttribute('border', '0')
        const borderStyle = '1px solid #000000'
        // 表格边框
        if (!element.borderType || element.borderType === TableBorder.ALL) {
          tableDom.style.borderTop = borderStyle
          tableDom.style.borderLeft = borderStyle
        } else if (element.borderType === TableBorder.EXTERNAL) {
          tableDom.style.border = borderStyle
        }
        tableDom.style.width = `${element.width}px`
        // colgroup
        const colgroupDom = document.createElement('colgroup')
        for (let c = 0; c < element.colgroup!.length; c++) {
          const colgroup = element.colgroup![c]
          const colDom = document.createElement('col')
          colDom.setAttribute('width', `${colgroup.width}`)
          colgroupDom.append(colDom)
        }
        tableDom.append(colgroupDom)
        // tr
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const trDom = document.createElement('tr')
          const tr = trList[t]
          trDom.style.height = `${tr.height}px`
          for (let d = 0; d < tr.tdList.length; d++) {
            const tdDom = document.createElement('td')
            if (!element.borderType || element.borderType === TableBorder.ALL) {
              tdDom.style.borderBottom = tdDom.style.borderRight = '1px solid'
            }
            const td = tr.tdList[d]
            tdDom.colSpan = td.colspan
            tdDom.rowSpan = td.rowspan
            tdDom.style.verticalAlign = td.verticalAlign || 'top'
            // 单元格边框
            if (td.borderTypes?.includes(TdBorder.TOP)) {
              tdDom.style.borderTop = borderStyle
            }
            if (td.borderTypes?.includes(TdBorder.RIGHT)) {
              tdDom.style.borderRight = borderStyle
            }
            if (td.borderTypes?.includes(TdBorder.BOTTOM)) {
              tdDom.style.borderBottom = borderStyle
            }
            if (td.borderTypes?.includes(TdBorder.LEFT)) {
              tdDom.style.borderLeft = borderStyle
            }
            const childDom = buildDom(zipElementList(td.value!))
            tdDom.innerHTML = childDom.innerHTML
            if (td.backgroundColor) {
              tdDom.style.backgroundColor = td.backgroundColor
            }
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
        const h = document.createElement(
          `h${titleOrderNumberMapping[element.level!]}`
        )
        const childDom = buildDom(zipElementList(element.valueList!))
        h.innerHTML = childDom.innerHTML
        clipboardDom.append(h)
      } else if (element.type === ElementType.LIST) {
        const list = document.createElement(
          listTypeElementMapping[element.listType!]
        )
        if (element.listStyle) {
          list.style.listStyleType = listStyleCSSMapping[element.listStyle]
        }
        // 按照换行符拆分
        const zipList = zipElementList(element.valueList!)
        const listElementListMap = splitListElement(zipList)
        listElementListMap.forEach(listElementList => {
          const li = document.createElement('li')
          const childDom = buildDom(listElementList)
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
      } else if (element.type === ElementType.RADIO) {
        const radio = document.createElement('input')
        radio.type = 'radio'
        if (element.radio?.value) {
          radio.setAttribute('checked', 'true')
        }
        clipboardDom.append(radio)
      } else if (element.type === ElementType.TAB) {
        const tab = document.createElement('span')
        tab.innerHTML = `${NON_BREAKING_SPACE}${NON_BREAKING_SPACE}`
        clipboardDom.append(tab)
      } else if (element.type === ElementType.CONTROL) {
        const controlElement = document.createElement('span')
        const childDom = buildDom(zipElementList(element.control?.value || []))
        controlElement.innerHTML = childDom.innerHTML
        clipboardDom.append(controlElement)
      } else if (
        !element.type ||
        element.type === ElementType.LATEX ||
        TEXTLIKE_ELEMENT_TYPE.includes(element.type)
      ) {
        let text = ''
        if (element.type === ElementType.DATE) {
          text = element.valueList?.map(v => v.value).join('') || ''
        } else {
          text = element.value
        }
        if (!text) continue
        const dom = convertElementToDom(element, options)
        // 前一个元素是标题，移除首行换行符
        if (payload[e - 1]?.type === ElementType.TITLE) {
          text = text.replace(/^\n/, '')
        }
        // 块元素移除尾部换行符
        if (dom.tagName === 'P') {
          text = text.replace(/\n$/, '')
        }
        dom.innerText = text.replace(new RegExp(`${ZERO}`, 'g'), '\n')
        clipboardDom.append(dom)
      }
    }
    return clipboardDom
  }
  return buildDom(zipElementList(elementList))
}

export function convertTextNodeToElement(
  textNode: Element | Node
): IElement | null {
  if (!textNode || textNode.nodeType !== 3) return null
  const parentNode = <HTMLElement>textNode.parentNode
  const anchorNode =
    parentNode.nodeName === 'FONT'
      ? <HTMLElement>parentNode.parentNode
      : parentNode
  const rowFlex = getElementRowFlex(anchorNode)
  const value = textNode.textContent
  const style = window.getComputedStyle(anchorNode)
  if (!value || anchorNode.nodeName === 'STYLE') return null
  const element: IElement = {
    value,
    color: style.color,
    bold: Number(style.fontWeight) > 500,
    italic: style.fontStyle.includes('italic'),
    size: Math.floor(parseFloat(style.fontSize))
  }
  // 元素类型-默认文本
  if (anchorNode.nodeName === 'SUB' || style.verticalAlign === 'sub') {
    element.type = ElementType.SUBSCRIPT
  } else if (anchorNode.nodeName === 'SUP' || style.verticalAlign === 'super') {
    element.type = ElementType.SUPERSCRIPT
  }
  // 行对齐
  if (rowFlex !== RowFlex.LEFT) {
    element.rowFlex = rowFlex
  }
  // 高亮色
  if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    element.highlight = style.backgroundColor
  }
  // 下划线
  if (style.textDecorationLine.includes('underline')) {
    element.underline = true
  }
  // 删除线
  if (style.textDecorationLine.includes('line-through')) {
    element.strikeout = true
  }
  return element
}

interface IGetElementListByHTMLOption {
  innerWidth: number
}

export function getElementListByHTML(
  htmlText: string,
  options: IGetElementListByHTMLOption
): IElement[] {
  const elementList: IElement[] = []
  function findTextNode(dom: Element | Node) {
    if (dom.nodeType === 3) {
      const element = convertTextNodeToElement(dom)
      if (element) {
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
              valueList: [
                {
                  value
                }
              ],
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
          if (
            node.nextSibling &&
            !INLINE_NODE_NAME.includes(node.nextSibling.nodeName)
          ) {
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
            listElement.listStyle = <ListStyle>(
              (<unknown>listNode.style.listStyleType)
            )
          }
          listNode.querySelectorAll('li').forEach(li => {
            const liValueList = getElementListByHTML(li.innerHTML, options)
            liValueList.forEach(list => {
              if (list.value === '\n') {
                list.listWrap = true
              }
            })
            liValueList.unshift({
              value: '\n'
            })
            listElement.valueList!.push(...liValueList)
          })
          elementList.push(listElement)
        } else if (node.nodeName === 'HR') {
          elementList.push({
            value: '\n',
            type: ElementType.SEPARATOR
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
            const trHeightStr = window
              .getComputedStyle(trElement)
              .height.replace('px', '')
            const tr: ITr = {
              height: Number(trHeightStr),
              tdList: []
            }
            trElement.querySelectorAll('th,td').forEach(tdElement => {
              const tableCell = <HTMLTableCellElement>tdElement
              const valueList = getElementListByHTML(
                tableCell.innerHTML,
                options
              )
              const td: ITd = {
                colspan: tableCell.colSpan,
                rowspan: tableCell.rowSpan,
                value: valueList
              }
              if (tableCell.style.backgroundColor) {
                td.backgroundColor = tableCell.style.backgroundColor
              }
              tr.tdList.push(td)
            })
            if (tr.tdList.length) {
              element.trList!.push(tr)
            }
          })
          if (element.trList!.length) {
            // 列选项数据
            const tdCount = element.trList![0].tdList.reduce(
              (pre, cur) => pre + cur.colspan,
              0
            )
            const width = Math.ceil(options.innerWidth / tdCount)
            for (let i = 0; i < tdCount; i++) {
              element.colgroup!.push({
                width
              })
            }
            elementList.push(element)
          }
        } else if (
          node.nodeName === 'INPUT' &&
          (<HTMLInputElement>node).type === ControlComponent.CHECKBOX
        ) {
          elementList.push({
            type: ElementType.CHECKBOX,
            value: '',
            checkbox: {
              value: (<HTMLInputElement>node).checked
            }
          })
        } else if (
          node.nodeName === 'INPUT' &&
          (<HTMLInputElement>node).type === ControlComponent.RADIO
        ) {
          elementList.push({
            type: ElementType.RADIO,
            value: '',
            radio: {
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

export function getTextFromElementList(elementList: IElement[]) {
  function buildText(payload: IElement[]): string {
    let text = ''
    for (let e = 0; e < payload.length; e++) {
      const element = payload[e]
      // 构造表格
      if (element.type === ElementType.TABLE) {
        text += `\n`
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const tdText = buildText(zipElementList(td.value!))
            const isFirst = d === 0
            const isLast = tr.tdList.length - 1 === d
            text += `${!isFirst ? `  ` : ``}${tdText}${isLast ? `\n` : ``}`
          }
        }
      } else if (element.type === ElementType.TAB) {
        text += `\t`
      } else if (element.type === ElementType.HYPERLINK) {
        text += element.valueList!.map(v => v.value).join('')
      } else if (element.type === ElementType.TITLE) {
        text += `${buildText(zipElementList(element.valueList!))}`
      } else if (element.type === ElementType.LIST) {
        // 按照换行符拆分
        const zipList = zipElementList(element.valueList!)
        const listElementListMap = splitListElement(zipList)
        // 无序列表前缀
        let ulListStyleText = ''
        if (element.listType === ListType.UL) {
          ulListStyleText =
            ulStyleMapping[<UlStyle>(<unknown>element.listStyle)]
        }
        listElementListMap.forEach((listElementList, listIndex) => {
          const isLast = listElementListMap.size - 1 === listIndex
          text += `\n${ulListStyleText || `${listIndex + 1}.`}${buildText(
            listElementList
          )}${isLast ? `\n` : ``}`
        })
      } else if (element.type === ElementType.CHECKBOX) {
        text += element.checkbox?.value ? `☑` : `□`
      } else if (element.type === ElementType.RADIO) {
        text += element.radio?.value ? `☉` : `○`
      } else if (
        !element.type ||
        element.type === ElementType.LATEX ||
        TEXTLIKE_ELEMENT_TYPE.includes(element.type)
      ) {
        let textLike = ''
        if (element.type === ElementType.CONTROL) {
          textLike = element.control!.value?.[0]?.value || ''
        } else if (element.type === ElementType.DATE) {
          textLike = element.valueList?.map(v => v.value).join('') || ''
        } else {
          textLike = element.value
        }
        text += textLike.replace(new RegExp(`${ZERO}`, 'g'), '\n')
      }
    }
    return text
  }
  return buildText(zipElementList(elementList))
}

export function getSlimCloneElementList(elementList: IElement[]) {
  return deepCloneOmitKeys<IElement[], IRowElement>(elementList, [
    'metrics',
    'style'
  ])
}
