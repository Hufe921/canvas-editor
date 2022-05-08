import { ControlComponent, ControlType, DeepRequired, ElementType, IEditorOption, IElement } from '../../editor'

export function formatElementList(elementList: IElement[], options: DeepRequired<IEditorOption>) {
  let i = 0
  while (i < elementList.length) {
    let el = elementList[i]
    if (el.type === ElementType.TABLE) {
      if (el.trList) {
        for (let t = 0; t < el.trList.length; t++) {
          const tr = el.trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            formatElementList(td.value, options)
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
        for (let v = 0; v < valueList.length; v++) {
          const value = valueList[v]
          value.type = el.type
          value.url = el.url
          elementList.splice(i, 0, value)
          i++
        }
      }
      i--
    } else if (el.type === ElementType.CONTROL) {
      const { prefix, postfix, value, placeholder, code, type, valueSets } = el.control!
      const controlOptions = options.control
      // 移除父节点
      elementList.splice(i, 1)
      // 前后缀个性化设置
      const thePrePostfixArgs: Pick<IElement, 'color'> = {}
      thePrePostfixArgs.color = controlOptions.bracketColor
      // 前缀
      const prefixStrList = (prefix || controlOptions.prefix).split('')
      for (let p = 0; p < prefixStrList.length; p++) {
        const value = prefixStrList[p]
        elementList.splice(i, 0, {
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
                  value,
                  type: el.type,
                  letterSpacing: isLastLetter ? options.checkbox.gap : 0,
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
        thePlaceholderArgs.color = controlOptions.placeholderColor
        const placeholderStrList = placeholder.split('')
        for (let p = 0; p < placeholderStrList.length; p++) {
          const value = placeholderStrList[p]
          elementList.splice(i, 0, {
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
      const postfixStrList = (postfix || controlOptions.postfix).split('')
      for (let p = 0; p < postfixStrList.length; p++) {
        const value = postfixStrList[p]
        elementList.splice(i, 0, {
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
    i++
  }
}
