import { deepClone, getUUID } from '.'
import { ElementType, IEditorOption, IElement } from '..'
import { defaultCheckboxOption } from '../dataset/constant/Checkbox'
import { ZERO } from '../dataset/constant/Common'
import { defaultControlOption } from '../dataset/constant/Control'
import { EDITOR_ELEMENT_ZIP_ATTR } from '../dataset/constant/Element'
import { ControlComponent, ControlType } from '../dataset/enum/Control'

interface IFormatElementListOption {
  isHandleFirstElement?: boolean;
  editorOptions?: Required<IEditorOption>;
}

export function formatElementList(elementList: IElement[], options: IFormatElementListOption = {}) {
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
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const tdId = getUUID()
            td.id = tdId
            formatElementList(td.value, options)
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
        // 元素展开
        if (valueList[0].value.length > 1) {
          const deleteValue = valueList.splice(0, 1)[0]
          const deleteTextList = deleteValue.value.split('')
          for (let d = 0; d < deleteTextList.length; d++) {
            valueList.splice(d, 0, { ...deleteValue, value: deleteTextList[d] })
          }
        }
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
      const prefixStrList = (prefix || defaultControlOption.prefix).split('')
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
              const valueStrList = valueSet.value.split('')
              for (let e = 0; e < valueStrList.length; e++) {
                const value = valueStrList[e]
                const isLastLetter = e === valueStrList.length - 1
                elementList.splice(i, 0, {
                  controlId,
                  value,
                  type: el.type,
                  letterSpacing: isLastLetter ? defaultCheckboxOption.gap : 0,
                  control: el.control,
                  controlComponent: ControlComponent.VALUE
                })
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
            const valueStrList = element.value.split('')
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
        const placeholderStrList = placeholder.split('')
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
      const postfixStrList = (postfix || defaultControlOption.postfix).split('')
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
      const valueList = el.value.split('')
      for (let v = 0; v < valueList.length; v++) {
        elementList.splice(i + v, 0, { ...el, value: valueList[v] })
      }
      el = elementList[i]
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
    // 筛选所需项
    if (e === 0 && element.value === ZERO) {
      e++
      continue
    }
    // 表格、超链接递归处理
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
          const nextValue = nextElement.value === ZERO ? `\n` : nextElement.value
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
