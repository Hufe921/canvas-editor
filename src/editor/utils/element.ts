import { deepClone, getUUID, splitText } from '.'
import { ElementType, IEditorOption, IElement, RowFlex } from '..'
import { LaTexParticle } from '../core/draw/particle/latex/LaTexParticle'
import { defaultCheckboxOption } from '../dataset/constant/Checkbox'
import { ZERO } from '../dataset/constant/Common'
import { defaultControlOption } from '../dataset/constant/Control'
import { EDITOR_ELEMENT_ZIP_ATTR, TEXTLIKE_ELEMENT_TYPE } from '../dataset/constant/Element'
import { titleSizeMapping } from '../dataset/constant/Title'
import { ControlComponent, ControlType } from '../dataset/enum/Control'
import { ITd } from '../interface/table/Td'

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
  isHandleFirstElement?: boolean;
  editorOptions: Required<IEditorOption>;
}

export function formatElementList(elementList: IElement[], options: IFormatElementListOption) {
  const { isHandleFirstElement, editorOptions } = <IFormatElementListOption>{
    isHandleFirstElement: true,
    ...options
  }
  if (isHandleFirstElement && elementList[0]?.value !== ZERO) {
    elementList.unshift({
      value: ZERO
    })
  }
  let i = 0
  while (i < elementList.length) {
    let el = elementList[i]
    if (el.type === ElementType.TABLE) {
      const tableId = getUUID()
      el.id = tableId
      if (el.trList) {
        for (let t = 0; t < el.trList.length; t++) {
          const tr = el.trList[t]
          const trId = getUUID()
          tr.id = trId
          if (!tr.minHeight || tr.minHeight < editorOptions.defaultTrMinHeight) {
            tr.minHeight = editorOptions.defaultTrMinHeight
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
    } else if (el.type === ElementType.TITLE) {
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
          value.titleId = titleId
          value.level = el.level
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
        ...options
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
    } else if (el.type === ElementType.CONTROL) {
      const { prefix, postfix, value, placeholder, code, type, valueSets } = el.control!
      const controlId = getUUID()
      // 移除父节点
      elementList.splice(i, 1)
      // 前后缀个性化设置
      const thePrePostfixArgs: Pick<IElement, 'color'> = {}
      if (editorOptions && editorOptions.control) {
        thePrePostfixArgs.color = editorOptions.control.bracketColor
      }
      // 前缀
      const prefixStrList = splitText(prefix || defaultControlOption.prefix)
      for (let p = 0; p < prefixStrList.length; p++) {
        const value = prefixStrList[p]
        elementList.splice(i, 0, {
          controlId,
          value,
          type: el.type,
          control: el.control,
          controlComponent: ControlComponent.PREFIX,
          ...thePrePostfixArgs
        })
        i++
      }
      // 值
      if (
        (value && value.length) ||
        type === ControlType.CHECKBOX ||
        (type === ControlType.SELECT && code && (!value || !value.length))
      ) {
        let valueList: IElement[] = value || []
        if (type === ControlType.CHECKBOX) {
          const codeList = code ? code.split(',') : []
          if (Array.isArray(valueSets) && valueSets.length) {
            // 拆分valueList优先使用其属性
            const valueStyleList = valueList.reduce(
              (pre, cur) => pre.concat(cur.value.split('').map(v => ({ ...cur, value: v }))),
              [] as IElement[]
            )
            let valueStyleIndex = 0
            for (let v = 0; v < valueSets.length; v++) {
              const valueSet = valueSets[v]
              // checkbox组件
              elementList.splice(i, 0, {
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
                  ...valueStyleList[valueStyleIndex],
                  controlId,
                  value,
                  type: el.type,
                  letterSpacing: isLastLetter ? defaultCheckboxOption.gap : 0,
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
                valueList = [{
                  value: valueSet.value
                }]
              }
            }
          }
          for (let v = 0; v < valueList.length; v++) {
            const element = valueList[v]
            const valueStrList = splitText(element.value)
            for (let e = 0; e < valueStrList.length; e++) {
              const value = valueStrList[e]
              elementList.splice(i, 0, {
                ...element,
                controlId,
                value,
                type: el.type,
                control: el.control,
                controlComponent: ControlComponent.VALUE
              })
              i++
            }
          }
        }
      } else if (placeholder) {
        // placeholder
        const thePlaceholderArgs: Pick<IElement, 'color'> = {}
        if (editorOptions && editorOptions.control) {
          thePlaceholderArgs.color = editorOptions.control.placeholderColor
        }
        const placeholderStrList = splitText(placeholder)
        for (let p = 0; p < placeholderStrList.length; p++) {
          const value = placeholderStrList[p]
          elementList.splice(i, 0, {
            controlId,
            value,
            type: el.type,
            control: el.control,
            controlComponent: ControlComponent.PLACEHOLDER,
            ...thePlaceholderArgs
          })
          i++
        }
      }
      // 后缀
      const postfixStrList = splitText(postfix || defaultControlOption.postfix)
      for (let p = 0; p < postfixStrList.length; p++) {
        const value = postfixStrList[p]
        elementList.splice(i, 0, {
          controlId,
          value,
          type: el.type,
          control: el.control,
          controlComponent: ControlComponent.POSTFIX,
          ...thePrePostfixArgs
        })
        i++
      }
      i--
    } else if ((!el.type || el.type === ElementType.TEXT) && el.value.length > 1) {
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

export function isSameElementExceptValue(source: IElement, target: IElement): boolean {
  const sourceKeys = Object.keys(source)
  const targetKeys = Object.keys(target)
  if (sourceKeys.length !== targetKeys.length) return false
  for (let s = 0; s < sourceKeys.length; s++) {
    const key = sourceKeys[s] as never
    if (key === 'value') continue
    if (source[key] !== target[key]) {
      return false
    }
  }
  return true
}

export function pickElementAttr(payload: IElement): IElement {
  const element: IElement = {
    value: payload.value === ZERO ? `\n` : payload.value,
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
    // 上下文首字符（占位符）
    if (e === 0 && element.value === ZERO && (!element.type || element.type === ElementType.TEXT)) {
      e++
      continue
    }
    // 表格、超链接、日期、控件特殊处理
    if (element.type === ElementType.TABLE) {
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
            if (td.verticalAlign) {
              zipTd.verticalAlign = td.verticalAlign
            }
            tr.tdList[d] = zipTd
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
    } else if (element.type === ElementType.DATE) {
      const dateId = element.dateId
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
    } else if (element.titleId && element.level) {
      // 标题处理
      const titleId = element.titleId
      const level = element.level
      const titleElement: IElement = {
        type: ElementType.TITLE,
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
        valueList.push(titleE)
        e++
      }
      titleElement.valueList = zipElementList(valueList)
      element = titleElement
    } else if (element.listId && element.listType) {
      // 列表处理
      const listId = element.listId
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
    } else if (element.type === ElementType.CONTROL) {
      // 控件处理
      const controlId = element.controlId
      const control = element.control!
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
          delete controlE.type
          delete controlE.control
          valueList.push(controlE)
        }
        e++
      }
      controlElement.control!.value = zipElementList(valueList)
      element = controlElement
    }
    // 组合元素
    const pickElement = pickElementAttr(element)
    if (!element.type || element.type === ElementType.TEXT) {
      while (e < elementList.length) {
        const nextElement = elementList[e + 1]
        e++
        if (
          nextElement
          && isSameElementExceptValue(pickElement, pickElementAttr(nextElement))
        ) {
          const nextValue = nextElement.value === ZERO ? '\n' : nextElement.value
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
    default:
      return RowFlex.LEFT
  }
}

export function isTextLikeElement(element: IElement): boolean {
  return !element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)
}