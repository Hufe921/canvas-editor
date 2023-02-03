import { data, options } from './mock'
import './style.css'
import prism from 'prismjs'
import Editor, { BlockType, Command, ControlType, EditorMode, ElementType, IBlock, IElement, KeyMap, PageMode } from './editor'
import { Dialog } from './components/dialog/Dialog'
import { formatPrismToken } from './utils/prism'
import { Signature } from './components/signature/Signature'
import { Translate } from './components/translate/translate'

let instance: Editor
let translate: Translate
const defaultLang = 'ch'

window.onload = function () {
  translate = new Translate(defaultLang, instance)
  init()
  translate.updateTranslateContextMenus(instance)
}

async function init() {
  // 1. 初始化编辑器
  const container = document.querySelector<HTMLDivElement>('.editor')!
  instance = new Editor(container, <IElement[]>data, options)
  console.log('实例: ', instance)
  // cypress使用
  Reflect.set(window, 'editor', instance)

  // 2. | 撤销 | 重做 | 格式刷 | 清除格式 |
  const undoDom = document.querySelector<HTMLDivElement>('.menu-item__undo')!
  undoDom.onclick = function () {
    console.log('undo')
    instance.command.executeUndo()
  }

  const redoDom = document.querySelector<HTMLDivElement>('.menu-item__redo')!
  redoDom.onclick = function () {
    console.log('redo')
    instance.command.executeRedo()
  }

  const painterDom = document.querySelector<HTMLDivElement>('.menu-item__painter')!
  painterDom.onclick = function () {
    console.log('painter')
    instance.command.executePainter({
      isDblclick: false
    })
  }
  painterDom.ondblclick = function () {
    console.log('painter')
    instance.command.executePainter({
      isDblclick: true
    })
  }

  document.querySelector<HTMLDivElement>('.menu-item__format')!.onclick = function () {
    console.log('format')
    instance.command.executeFormat()
  }

  // 3. | 字体 | 字体变大 | 字体变小 | 加粗 | 斜体 | 下划线 | 删除线 | 上标 | 下标 | 字体颜色 | 背景色 |
  const fontDom = document.querySelector<HTMLDivElement>('.menu-item__font')!
  const fontSelectDom = fontDom.querySelector<HTMLDivElement>('.select')!
  const fontOptionDom = fontDom.querySelector<HTMLDivElement>('.options')!
  fontDom.onclick = function () {
    console.log('font')
    const bodyRect = document.body.getBoundingClientRect()
    fontOptionDom.classList.toggle('visible')
    const fontDomRect = fontDom.getBoundingClientRect()
    if (fontDomRect.left + fontDomRect.width > bodyRect.width) {
      fontOptionDom.style.right = (fontDomRect.right - fontDomRect.width) + 'px'
      fontOptionDom.style.left = 'unset'
    } else {
      fontOptionDom.style.right = 'unset'
      fontOptionDom.style.left = (fontDomRect.x) + 'px'
    }
  }
  fontOptionDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    instance.command.executeFont(li.dataset.family!)
  }

  document.querySelector<HTMLDivElement>('.menu-item__size-add')!.onclick = function () {
    console.log('size-add')
    instance.command.executeSizeAdd()
  }

  document.querySelector<HTMLDivElement>('.menu-item__size-minus')!.onclick = function () {
    console.log('size-minus')
    instance.command.executeSizeMinus()
  }

  const boldDom = document.querySelector<HTMLDivElement>('.menu-item__bold')!
  boldDom.onclick = function () {
    console.log('bold')
    instance.command.executeBold()
  }

  const italicDom = document.querySelector<HTMLDivElement>('.menu-item__italic')!
  italicDom.onclick = function () {
    console.log('italic')
    instance.command.executeItalic()
  }

  const underlineDom = document.querySelector<HTMLDivElement>('.menu-item__underline')!
  underlineDom.onclick = function () {
    console.log('underline')
    instance.command.executeUnderline()
  }

  const strikeoutDom = document.querySelector<HTMLDivElement>('.menu-item__strikeout')!
  strikeoutDom.onclick = function () {
    console.log('strikeout')
    instance.command.executeStrikeout()
  }

  const superscriptDom = document.querySelector<HTMLDivElement>('.menu-item__superscript')!
  superscriptDom.onclick = function () {
    console.log('superscript')
    instance.command.executeSuperscript()
  }

  const subscriptDom = document.querySelector<HTMLDivElement>('.menu-item__subscript')!
  subscriptDom.onclick = function () {
    console.log('subscript')
    instance.command.executeSubscript()
  }

  const colorControlDom = document.querySelector<HTMLInputElement>('#color')!
  colorControlDom.oninput = function () {
    instance.command.executeColor(colorControlDom.value)
  }
  const colorDom = document.querySelector<HTMLDivElement>('.menu-item__color')!
  const colorSpanDom = colorDom.querySelector('span')!
  colorDom.onclick = function () {
    console.log('color')
    colorControlDom.click()
  }

  const highlightControlDom = document.querySelector<HTMLInputElement>('#highlight')!
  highlightControlDom.oninput = function () {
    instance.command.executeHighlight(highlightControlDom.value)
  }
  const highlightDom = document.querySelector<HTMLDivElement>('.menu-item__highlight')!
  const highlightSpanDom = highlightDom.querySelector('span')!
  highlightDom.onclick = function () {
    console.log('highlight')
    highlightControlDom?.click()
  }

  const leftDom = document.querySelector<HTMLDivElement>('.menu-item__left')!
  leftDom.onclick = function () {
    console.log('left')
    instance.command.executeLeft()
  }

  const centerDom = document.querySelector<HTMLDivElement>('.menu-item__center')!
  centerDom.onclick = function () {
    console.log('center')
    instance.command.executeCenter()
  }

  const rightDom = document.querySelector<HTMLDivElement>('.menu-item__right')!
  rightDom.onclick = function () {
    console.log('right')
    instance.command.executeRight()
  }

  const alignmentDom = document.querySelector<HTMLDivElement>('.menu-item__alignment')!
  alignmentDom.onclick = function () {
    console.log('alignment')
    instance.command.executeAlignment()
  }

  const rowMarginDom = document.querySelector<HTMLDivElement>('.menu-item__row-margin')!
  const rowOptionDom = rowMarginDom.querySelector<HTMLDivElement>('.options')!
  rowMarginDom.onclick = function () {
    console.log('row-margin')
    rowOptionDom.classList.toggle('visible')
    const bodyRect = document.body.getBoundingClientRect()
    const rowMarginDomRect = rowMarginDom.getBoundingClientRect()
    if (rowMarginDomRect.left + rowMarginDomRect.width > bodyRect.width) {
      rowOptionDom.style.right = (rowMarginDomRect.right - rowMarginDomRect.width) + 'px'
      rowOptionDom.style.left = 'unset'
    } else {
      rowOptionDom.style.right = 'unset'
      rowOptionDom.style.left = (rowMarginDomRect.x) + 'px'
    }
  }
  rowOptionDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    instance.command.executeRowMargin(Number(li.dataset.rowmargin!))
  }

  // 4. | 表格 | 图片 | 超链接 | 分割线 | 水印 | 代码块 | 分隔符 | 控件 | 复选框 | LaTeX | 日期选择器
  const tableDom = document.querySelector<HTMLDivElement>('.menu-item__table')!
  const tablePanelContainer = document.querySelector<HTMLDivElement>('.menu-item__table__collapse')!
  const tableClose = document.querySelector<HTMLDivElement>('.table-close')!
  const tableTitle = document.querySelector<HTMLDivElement>('.table-select')!
  const tablePanel = document.querySelector<HTMLDivElement>('.table-panel')!
  // 绘制行列
  const tableCellList: HTMLDivElement[][] = []
  for (let i = 0; i < 10; i++) {
    const tr = document.createElement('tr')
    tr.classList.add('table-row')
    const trCellList: HTMLDivElement[] = []
    for (let j = 0; j < 10; j++) {
      const td = document.createElement('td')
      td.classList.add('table-cel')
      tr.append(td)
      trCellList.push(td)
    }
    tablePanel.append(tr)
    tableCellList.push(trCellList)
  }
  let colIndex = 0
  let rowIndex = 0
  // 移除所有格选择
  function removeAllTableCellSelect() {
    tableCellList.forEach(tr => {
      tr.forEach(td => td.classList.remove('active'))
    })
  }
  // 设置标题内容
  function setTableTitle(payload: string) {
    tableTitle.innerText = payload
  }
  // 恢复初始状态
  function recoveryTable() {
    // 还原选择样式、标题、选择行列
    removeAllTableCellSelect()
    setTableTitle('插入')
    colIndex = 0
    rowIndex = 0
    // 隐藏panel
    tablePanelContainer.style.display = 'none'
  }
  tableDom.onclick = function () {
    console.log('table')
    tablePanelContainer!.style.display = 'block'
  }
  tablePanel.onmousemove = function (evt) {
    const celSize = 16
    const rowMarginTop = 10
    const celMarginRight = 6
    const { offsetX, offsetY } = evt
    // 移除所有选择
    removeAllTableCellSelect()
    colIndex = Math.ceil(offsetX / (celSize + celMarginRight)) || 1
    rowIndex = Math.ceil(offsetY / (celSize + rowMarginTop)) || 1
    // 改变选择样式
    tableCellList.forEach((tr, trIndex) => {
      tr.forEach((td, tdIndex) => {
        if (tdIndex < colIndex && trIndex < rowIndex) {
          td.classList.add('active')
        }
      })
    })
    // 改变表格标题
    setTableTitle(`${rowIndex}×${colIndex}`)
  }
  tableClose.onclick = function () {
    recoveryTable()
  }
  tablePanel.onclick = function () {
    // 应用选择
    instance.command.executeInsertTable(rowIndex, colIndex)
    recoveryTable()
  }

  const imageDom = document.querySelector<HTMLDivElement>('.menu-item__image')!
  const imageFileDom = document.querySelector<HTMLInputElement>('#image')!
  imageDom.onclick = function () {
    imageFileDom.click()
  }
  imageFileDom.onchange = function () {
    const file = imageFileDom.files![0]!
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)
    fileReader.onload = function () {
      // 计算宽高
      const image = new Image()
      const value = fileReader.result as string
      image.src = value
      image.onload = function () {
        instance.command.executeImage({
          value,
          width: image.width,
          height: image.height,
        })
        imageFileDom.value = ''
      }
    }
  }

  const hyperlinkDom = document.querySelector<HTMLDivElement>('.menu-item__hyperlink')!
  hyperlinkDom.onclick = function () {
    console.log('hyperlink')
    const { inputs, buttonCancel, buttonConfirm } = translate.options.translateDialogHyperlink
    const titleDialog = translate.options.translateDialogHyperlink.title
    const [input1, input2] = inputs
    new Dialog({
      title: titleDialog,
      labelCancel: buttonCancel,
      labelConfirm: buttonConfirm,
      data: [{
        type: 'text',
        label: input1 ? input1.label : '文本',
        name: 'name',
        required: true,
        placeholder: input1 ? input1.placeholder : '请输入文本'
      }, {
        type: 'text',
        label: input2 ? input2.label : '链接',
        name: 'url',
        required: true,
        placeholder: input2 ? input2.placeholder : '请输入链接'
      }],
      onConfirm: (payload) => {
        const name = payload.find(p => p.name === 'name')?.value
        if (!name) return
        const url = payload.find(p => p.name === 'url')?.value
        if (!url) return
        instance.command.executeHyperlink({
          type: ElementType.HYPERLINK,
          value: '',
          url,
          valueList: name.split('').map(n => ({
            value: n,
            size: 16
          }))
        })
      }
    })
  }

  const separatorDom = document.querySelector<HTMLDivElement>('.menu-item__separator')!
  const separatorOptionDom = separatorDom.querySelector<HTMLDivElement>('.options')!
  separatorDom.onclick = function () {
    console.log('separator')
    separatorOptionDom.classList.toggle('visible')
    const bodyRect = document.body.getBoundingClientRect()
    const separatorDomRect = separatorDom.getBoundingClientRect()
    if (separatorDomRect.left + separatorDomRect.width > bodyRect.width) {
      separatorOptionDom.style.right = (separatorDomRect.right - separatorDomRect.width) + 'px'
      separatorOptionDom.style.left = 'unset'
    } else {
      separatorOptionDom.style.right = 'unset'
      separatorOptionDom.style.left = (separatorDomRect.x) + 'px'
    }
  }
  separatorOptionDom.onmousedown = function (evt) {
    let payload: number[] = []
    const li = evt.target as HTMLLIElement
    const separatorDash = li.dataset.separator?.split(',').map(Number)
    if (separatorDash) {
      const isSingleLine = separatorDash.every(d => d === 0)
      if (!isSingleLine) {
        payload = separatorDash
      }
    }
    instance.command.executeSeparator(payload)
  }

  const pageBreakDom = document.querySelector<HTMLDivElement>('.menu-item__page-break')!
  pageBreakDom.onclick = function () {
    console.log('pageBreak')
    instance.command.executePageBreak()
  }

  const watermarkDom = document.querySelector<HTMLDivElement>('.menu-item__watermark')!
  const watermarkOptionDom = watermarkDom.querySelector<HTMLDivElement>('.options')!
  watermarkDom.onclick = function () {
    console.log('watermark')
    watermarkOptionDom.classList.toggle('visible')
    const bodyRect = document.body.getBoundingClientRect()
    const watermarkDomRect = watermarkDom.getBoundingClientRect()
    if (watermarkDomRect.left + watermarkDomRect.width > bodyRect.width) {
      watermarkOptionDom.style.right = (watermarkDomRect.right - watermarkDomRect.width) + 'px'
      watermarkOptionDom.style.left = 'unset'
    } else {
      watermarkOptionDom.style.right = 'unset'
      watermarkOptionDom.style.left = (watermarkDomRect.x) + 'px'
    }
  }
  watermarkOptionDom.onmousedown = function (evt) {
    const li = evt.target as HTMLLIElement
    const menu = li.dataset.menu!
    watermarkOptionDom.classList.toggle('visible')
    if (menu === 'add') {
      const { inputs, buttonCancel, buttonConfirm } = translate.options.translateWatermarkOption
      const { title = '水印' } = translate.options.translateWatermarkOption
      const [input1, input2, input3] = inputs

      new Dialog({
        title: title,
        labelCancel: buttonCancel,
        labelConfirm: buttonConfirm,
        data: [{
          type: 'text',
          label: input1 ? input1.label : '内容',
          name: 'data',
          required: true,
          placeholder: input1 ? input1.placeholder : '请输入内容'
        }, {
          type: 'color',
          label: input2 ? input2.label : '颜色',
          name: 'color',
          required: true,
          value: '#AEB5C0'
        }, {
          type: 'number',
          label: input3 ? input3.label : '字体大小',
          name: 'size',
          required: true,
          value: '120'
        }],
        onConfirm: (payload) => {
          const nullableIndex = payload.findIndex(p => !p.value)
          if (~nullableIndex) return
          const watermark = payload.reduce((pre, cur) => {
            pre[cur.name] = cur.value
            return pre
          }, <any>{})
          instance.command.executeAddWatermark({
            data: watermark.data,
            color: watermark.color,
            size: Number(watermark.size)
          })
        }
      })
    } else {
      instance.command.executeDeleteWatermark()
    }
  }

  const codeblockDom = document.querySelector<HTMLDivElement>('.menu-item__codeblock')!
  codeblockDom.onclick = function () {
    console.log('codeblock')
    const { inputs, buttonCancel, buttonConfirm } = translate.options.translateCodeblock
    const { title = '代码块' } = translate.options.translateCodeblock
    const [input1] = inputs
    new Dialog({
      title: title,
      labelCancel: buttonCancel,
      labelConfirm: buttonConfirm,
      data: [{
        type: 'textarea',
        name: 'codeblock',
        placeholder: input1 ? input1.placeholder : '请输入代码',
        width: 500,
        height: 300
      }],
      onConfirm: (payload) => {
        const codeblock = payload.find(p => p.name === 'codeblock')?.value
        if (!codeblock) return
        const tokenList = prism.tokenize(codeblock, prism.languages.javascript)
        const formatTokenList = formatPrismToken(tokenList)
        const elementList: IElement[] = []
        for (let i = 0; i < formatTokenList.length; i++) {
          const formatToken = formatTokenList[i]
          const tokenStringList = formatToken.content.split('')
          for (let j = 0; j < tokenStringList.length; j++) {
            const value = tokenStringList[j]
            const element: IElement = {
              value
            }
            if (formatToken.color) {
              element.color = formatToken.color
            }
            if (formatToken.bold) {
              element.bold = true
            }
            if (formatToken.italic) {
              element.italic = true
            }
            elementList.push(element)
          }
        }
        elementList.unshift({
          value: '\n'
        })
        instance.command.executeInsertElementList(elementList)
      }
    })
  }

  const controlDom = document.querySelector<HTMLDivElement>('.menu-item__control')!
  const controlOptionDom = controlDom.querySelector<HTMLDivElement>('.options')!
  controlDom.onclick = function () {
    console.log('control')
    controlOptionDom.classList.toggle('visible')
    const bodyRect = document.body.getBoundingClientRect()
    const controlDomRect = controlDom.getBoundingClientRect()
    if (controlDomRect.left + controlDomRect.width > bodyRect.width) {
      controlOptionDom.style.right = (controlDomRect.right - controlDomRect.width) + 'px'
      controlOptionDom.style.left = 'unset'
    } else {
      controlOptionDom.style.right = 'unset'
      controlOptionDom.style.left = (controlDomRect.x) + 'px'
    }
  }
  controlOptionDom.onmousedown = function (evt) {
    controlOptionDom.classList.toggle('visible')
    const li = evt.target as HTMLLIElement
    const type = <ControlType>li.dataset.control
    switch (type) {
      case ControlType.TEXT: {
        const { inputs, buttonCancel, buttonConfirm } = translate.options.translateControlOptionText
        const { title = '文本控件' } = translate.options.translateControlOptionText
        const [input1, input2] = inputs
        new Dialog({
          title: title,
          labelCancel: buttonCancel,
          labelConfirm: buttonConfirm,
          data: [{
            type: 'text',
            label: input1 ? input1.label : '占位符',
            name: 'placeholder',
            required: true,
            placeholder: input1 ? input1.placeholder : '请输入占位符'
          }, {
            type: 'text',
            label: input2 ? input2.label : '默认值',
            name: 'value',
            placeholder: input2 ? input2.placeholder : '请输入默认值'
          }],
          onConfirm: (payload) => {
            const placeholder = payload.find(p => p.name === 'placeholder')?.value
            if (!placeholder) return
            const value = payload.find(p => p.name === 'value')?.value || ''
            instance.command.executeInsertElementList([{
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                value: value
                  ? [{
                    value
                  }]
                  : null,
                placeholder
              }
            }])
          }
        })
        break
      }
      case ControlType.SELECT: {
        const { inputs, buttonCancel, buttonConfirm } = translate.options.translateControlOptionSelect
        const { title = '列举控件' } = translate.options.translateControlOptionSelect
        const [input1, input2, input3] = inputs
        new Dialog({
          title: title,
          labelCancel: buttonCancel,
          labelConfirm: buttonConfirm,
          data: [{
            type: 'text',
            label: input1 ? input1.label : '占位符',
            name: 'placeholder',
            required: true,
            placeholder: input1 ? input1.placeholder : '请输入占位符'
          }, {
            type: 'text',
            label: input2 ? input2.label : '默认值',
            name: 'code',
            placeholder: input2 ? input2.placeholder : '请输入默认值'
          }, {
            type: 'textarea',
            label: input3 ? input3.label : '值集',
            name: 'valueSets',
            required: true,
            height: 100,
            placeholder: input3 ? input3.placeholder : `请输入值集JSON，例：\n[{\n"value":"有",\n"code":"98175"\n}]`
          }],
          onConfirm: (payload) => {
            const placeholder = payload.find(p => p.name === 'placeholder')?.value
            if (!placeholder) return
            const valueSets = payload.find(p => p.name === 'valueSets')?.value
            if (!valueSets) return
            const code = payload.find(p => p.name === 'code')?.value
            instance.command.executeInsertElementList([{
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                code,
                value: null,
                placeholder,
                valueSets: JSON.parse(valueSets)
              }
            }])
          }
        })
        break
      }
      case ControlType.CHECKBOX: {
        const { inputs, buttonCancel, buttonConfirm } = translate.options.translateControlOptionCheckbox
        const { title = '复选框控件' } = translate.options.translateControlOptionCheckbox
        const [input1, input2] = inputs
        new Dialog({
          title: title,
          labelCancel: buttonCancel,
          labelConfirm: buttonConfirm,
          data: [{
            type: 'text',
            label: input1 ? input1.label : '默认值',
            name: 'code',
            placeholder: input1 ? input1.placeholder : '请输入默认值，多个值以英文逗号分割'
          }, {
            type: 'textarea',
            label: input2 ? input2.label : '值集',
            name: 'valueSets',
            required: true,
            height: 100,
            placeholder: input2 ? input2.placeholder : `请输入值集JSON，例：\n[{\n"value":"有",\n"code":"98175"\n}]`
          }],
          onConfirm: (payload) => {
            const valueSets = payload.find(p => p.name === 'valueSets')?.value
            if (!valueSets) return
            const code = payload.find(p => p.name === 'code')?.value
            instance.command.executeInsertElementList([{
              type: ElementType.CONTROL,
              value: '',
              control: {
                type,
                code,
                value: null,
                valueSets: JSON.parse(valueSets)
              }
            }])
          }
        })
        break
      }
      default:
        break
    }
  }

  const checkboxDom = document.querySelector<HTMLDivElement>('.menu-item__checkbox')!
  checkboxDom.onclick = function () {
    console.log('checkbox')
    instance.command.executeInsertElementList([{
      type: ElementType.CHECKBOX,
      value: ''
    }])
  }

  const latexDom = document.querySelector<HTMLDivElement>('.menu-item__latex')!
  latexDom.onclick = function () {
    console.log('LaTeX')
    const { inputs, buttonCancel, buttonConfirm } = translate.options.translateLatex
    const { title = 'LaTeX' } = translate.options.translateLatex
    const [input1] = inputs
    new Dialog({
      title: title,
      labelCancel: buttonCancel,
      labelConfirm: buttonConfirm,
      data: [{
        type: 'textarea',
        height: 100,
        name: 'value',
        placeholder: input1 ? input1.placeholder : '请输入LaTeX文本'
      }],
      onConfirm: (payload) => {
        const value = payload.find(p => p.name === 'value')?.value
        if (!value) return
        instance.command.executeInsertElementList([{
          type: ElementType.LATEX,
          value
        }])
      }
    })
  }

  const dateDom = document.querySelector<HTMLDivElement>('.menu-item__date')!
  const dateDomOptionDom = dateDom.querySelector<HTMLDivElement>('.options')!
  dateDom.onclick = function () {
    console.log('date')
    dateDomOptionDom.classList.toggle('visible')
    // 定位调整
    const bodyRect = document.body.getBoundingClientRect()
    const dateDomRect = dateDom.getBoundingClientRect()
    if (dateDomRect.left + dateDomRect.width > bodyRect.width) {
      dateDomOptionDom.style.right = (dateDomRect.x - dateDomRect.width) + 'px'
      dateDomOptionDom.style.left = 'unset'
    } else {
      dateDomOptionDom.style.right = 'unset'
      dateDomOptionDom.style.left = (dateDomRect.x) + 'px'
    }
    // 当前日期
    const date = new Date()
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const second = date.getSeconds().toString().padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const dateTimeString = `${dateString} ${hour}:${minute}:${second}`
    dateDomOptionDom.querySelector<HTMLLIElement>('li:first-child')!.innerText = dateString
    dateDomOptionDom.querySelector<HTMLLIElement>('li:last-child')!.innerText = dateTimeString
  }
  dateDomOptionDom.onmousedown = function (evt) {
    const li = evt.target as HTMLLIElement
    const dateFormat = li.dataset.format!
    dateDomOptionDom.classList.toggle('visible')
    instance.command.executeInsertElementList([{
      type: ElementType.DATE,
      value: '',
      dateFormat,
      valueList: [{
        value: li.innerText.trim(),
      }]
    }])
  }

  const blockDom = document.querySelector<HTMLDivElement>('.menu-item__block')!
  blockDom.onclick = function () {
    console.log('block')
    const { inputs, buttonCancel, buttonConfirm } = translate.options.translateBlock
    const { title = '内容块' } = translate.options.translateBlock
    const [input1, input2, input3, input4] = inputs
    const [option1, option2] = input1.options
    new Dialog({
      title: title,
      labelCancel: buttonCancel,
      labelConfirm: buttonConfirm,
      data: [{
        type: 'select',
        label: input1 ? input1.label : '类型',
        name: 'type',
        value: 'iframe',
        required: true,
        options: [{
          label: option1 ? option1.label : '网址',
          value: 'iframe'
        }, {
          label: option2 ? option2.label : '视频',
          value: 'video'
        }]
      }, {
        type: 'number',
        label: input2 ? input2.label : '宽度',
        name: 'width',
        placeholder: input2 ? input2.placeholder : '请输入宽度（默认页面内宽度）'
      }, {
        type: 'number',
        label: input3 ? input3.label : '高度',
        name: 'height',
        required: true,
        placeholder: input3 ? input3.placeholder : '请输入高度'
      }, {
        type: 'textarea',
        label: input4 ? input4.label : '地址',
        height: 100,
        name: 'value',
        required: true,
        placeholder: input4 ? input4.placeholder : '请输入地址'
      }],
      onConfirm: (payload) => {
        const type = payload.find(p => p.name === 'type')?.value
        if (!type) return
        const value = payload.find(p => p.name === 'value')?.value
        if (!value) return
        const width = payload.find(p => p.name === 'width')?.value
        const height = payload.find(p => p.name === 'height')?.value
        if (!height) return
        const block: IBlock = {
          type: <BlockType>type
        }
        if (block.type === BlockType.IFRAME) {
          block.iframeBlock = {
            src: value
          }
        } else if (block.type === BlockType.VIDEO) {
          block.videoBlock = {
            src: value
          }
        }
        const blockElement: IElement = {
          type: ElementType.BLOCK,
          value: '',
          height: Number(height),
          block
        }
        if (width) {
          blockElement.width = Number(width)
        }
        instance.command.executeInsertElementList([blockElement])
      }
    })
  }

  // 5. | 搜索&替换 | 打印 |
  const searchCollapseDom = document.querySelector<HTMLDivElement>('.menu-item__search__collapse')!
  const searchInputDom = document.querySelector<HTMLInputElement>('.menu-item__search__collapse__search input')!
  const replaceInputDom = document.querySelector<HTMLInputElement>('.menu-item__search__collapse__replace input')!
  const searchDom = document.querySelector<HTMLDivElement>('.menu-item__search')!
  const searchResultDom = searchCollapseDom.querySelector<HTMLLabelElement>('.search-result')!
  function setSearchResult() {
    const result = instance.command.getSearchNavigateInfo()
    if (result) {
      const { index, count } = result
      searchResultDom.innerText = `${index}/${count}`
    } else {
      searchResultDom.innerText = ''
    }
  }
  searchDom.onclick = function () {
    console.log('search')
    searchCollapseDom.style.display = 'block'
    const bodyRect = document.body.getBoundingClientRect()
    const searchRect = searchDom.getBoundingClientRect()
    if (searchRect.left + searchRect.width > bodyRect.width) {
      searchCollapseDom.style.right = '5px'
      searchCollapseDom.style.left = 'unset'
    } else {
      searchCollapseDom.style.right = 'unset'
      searchCollapseDom.style.left = searchRect.x + 'px'
    }
    searchInputDom.focus()
  }
  searchCollapseDom.querySelector<HTMLSpanElement>('span')!.onclick = function () {
    searchCollapseDom.style.display = 'none'
    searchInputDom.value = ''
    replaceInputDom.value = ''
    instance.command.executeSearch(null)
    setSearchResult()
  }
  searchInputDom.oninput = function () {
    instance.command.executeSearch(searchInputDom.value || null)
    setSearchResult()
  }
  searchInputDom.onkeydown = function (evt) {
    if (evt.key === 'Enter') {
      instance.command.executeSearch(searchInputDom.value || null)
      setSearchResult()
    }
  }
  searchCollapseDom.querySelector<HTMLButtonElement>('button')!.onclick = function () {
    const searchValue = searchInputDom.value
    const replaceValue = replaceInputDom.value
    if (searchValue && replaceValue && searchValue !== replaceValue) {
      instance.command.executeReplace(replaceValue)
    }
  }
  searchCollapseDom.querySelector<HTMLDivElement>('.arrow-left')!.onclick = function () {
    instance.command.executeSearchNavigatePre()
    setSearchResult()
  }
  searchCollapseDom.querySelector<HTMLDivElement>('.arrow-right')!.onclick = function () {
    instance.command.executeSearchNavigateNext()
    setSearchResult()
  }

  document.querySelector<HTMLDivElement>('.menu-item__print')!.onclick = function () {
    console.log('print')
    instance.command.executePrint()
  }

  // 6. 页面模式 | 纸张缩放 | 全屏
  const pageModeDom = document.querySelector<HTMLDivElement>('.page-mode')!
  const pageModeOptionsDom = pageModeDom.querySelector<HTMLDivElement>('.options')!
  pageModeDom.onclick = function () {
    pageModeOptionsDom.classList.toggle('visible')
  }
  pageModeOptionsDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    instance.command.executePageMode(<PageMode>li.dataset.pageMode!)
  }

  document.querySelector<HTMLDivElement>('.page-scale-percentage')!.onclick = function () {
    console.log('page-scale-recovery')
    instance.command.executePageScaleRecovery()
  }

  document.querySelector<HTMLDivElement>('.page-scale-minus')!.onclick = function () {
    console.log('page-scale-minus')
    instance.command.executePageScaleMinus()
  }

  document.querySelector<HTMLDivElement>('.page-scale-add')!.onclick = function () {
    console.log('page-scale-add')
    instance.command.executePageScaleAdd()
  }

  // 纸张大小
  const paperSizeDom = document.querySelector<HTMLDivElement>('.paper-size')!
  const paperSizeDomOptionsDom = paperSizeDom.querySelector<HTMLDivElement>('.options')!
  paperSizeDom.onclick = function () {
    paperSizeDomOptionsDom.classList.toggle('visible')
  }
  paperSizeDomOptionsDom.onclick = function (evt) {
    const li = evt.target as HTMLLIElement
    const paperType = li.dataset.paperSize!
    const [width, height] = paperType.split('*').map(Number)
    instance.command.executePaperSize(width, height)
    // 纸张状态回显
    paperSizeDomOptionsDom.querySelectorAll('li')
      .forEach(child => child.classList.remove('active'))
    li.classList.add('active')
  }

  // 页面边距
  const paperMarginDom = document.querySelector<HTMLDivElement>('.paper-margin')!
  paperMarginDom.onclick = function () {
    const [topMargin, rightMargin, bottomMargin, leftMargin] = instance.command.getPaperMargin()
    const { inputs, buttonCancel, buttonConfirm } = translate.options.translateTopMargin
    const { title = '页边距' } = translate.options.translateTopMargin
    const [input1, input2, input3, input4] = inputs
    new Dialog({
      title: title,
      labelCancel: buttonCancel,
      labelConfirm: buttonConfirm,
      data: [{
        type: 'text',
        label: input1 ? input1.label : '上边距',
        name: 'top',
        required: true,
        value: `${topMargin}`,
        placeholder: input1 ? input1.placeholder : '请输入上边距'
      }, {
        type: 'text',
        label: input2 ? input2.label : '下边距',
        name: 'bottom',
        required: true,
        value: `${bottomMargin}`,
        placeholder: input2 ? input2.placeholder : '请输入下边距'
      }, {
        type: 'text',
        label: input3 ? input3.label : '左边距',
        name: 'left',
        required: true,
        value: `${leftMargin}`,
        placeholder: input3 ? input3.placeholder : '请输入左边距'
      }, {
        type: 'text',
        label: input4 ? input4.label : '右边距',
        name: 'right',
        required: true,
        value: `${rightMargin}`,
        placeholder: input4 ? input4.placeholder : '请输入右边距'
      }],
      onConfirm: (payload) => {
        const top = payload.find(p => p.name === 'top')?.value
        if (!top) return
        const bottom = payload.find(p => p.name === 'bottom')?.value
        if (!bottom) return
        const left = payload.find(p => p.name === 'left')?.value
        if (!left) return
        const right = payload.find(p => p.name === 'right')?.value
        if (!right) return
        instance.command.executeSetPaperMargin([
          Number(top),
          Number(right),
          Number(bottom),
          Number(left)
        ])
      }
    })
  }

  // 全屏
  const fullscreenDom = document.querySelector<HTMLDivElement>('.fullscreen')!
  fullscreenDom.onclick = toggleFullscreen
  window.addEventListener('keydown', (evt) => {
    if (evt.key === 'F11') {
      toggleFullscreen()
      evt.preventDefault()
    }
  })
  document.addEventListener('fullscreenchange', () => {
    fullscreenDom.classList.toggle('exist')
  })
  function toggleFullscreen() {
    console.log('fullscreen')
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // 7. 编辑器使用模式
  let modeIndex = 0
  const modeElement = document.querySelector<HTMLDivElement>('.editor-mode')!
  modeElement.onclick = function () {
    // 模式选择循环
    modeIndex === 2 ? modeIndex = 0 : modeIndex++
    // 设置模式
    const { name, mode } = translate.options.modeList[modeIndex]
    modeElement.innerText = name
    instance.command.executeMode(mode)
    // 设置菜单栏权限视觉反馈
    const isReadonly = mode === EditorMode.READONLY
    const enableMenuList = ['search', 'print']
    document.querySelectorAll<HTMLDivElement>('.menu-item>div').forEach(dom => {
      const menu = dom.dataset.menu
      isReadonly && (!menu || !enableMenuList.includes(menu))
        ? dom.classList.add('disable')
        : dom.classList.remove('disable')
    })
  }

  // 8. 内部事件监听
  instance.listener.rangeStyleChange = function (payload) {
    // 控件类型
    payload.type === ElementType.SUBSCRIPT ? subscriptDom.classList.add('active') : subscriptDom.classList.remove('active')
    payload.type === ElementType.SUPERSCRIPT ? superscriptDom.classList.add('active') : superscriptDom.classList.remove('active')
    payload.type === ElementType.SEPARATOR ? separatorDom.classList.add('active') : separatorDom.classList.remove('active')
    separatorOptionDom.querySelectorAll('li').forEach(li => li.classList.remove('active'))
    if (payload.type === ElementType.SEPARATOR) {
      const separator = payload.dashArray.join(',') || '0,0'
      const curSeparatorDom = separatorOptionDom.querySelector<HTMLLIElement>(`[data-separator='${separator}']`)!
      if (curSeparatorDom) {
        curSeparatorDom.classList.add('active')
      }
    }

    // 富文本
    fontOptionDom.querySelectorAll<HTMLLIElement>('li').forEach(li => li.classList.remove('active'))
    const curFontDom = fontOptionDom.querySelector<HTMLLIElement>(`[data-family='${payload.font}']`)
    if (curFontDom) {
      fontSelectDom.innerText = curFontDom.innerText
      fontSelectDom.style.fontFamily = payload.font
      curFontDom.classList.add('active')
    }
    payload.bold ? boldDom.classList.add('active') : boldDom.classList.remove('active')
    payload.italic ? italicDom.classList.add('active') : italicDom.classList.remove('active')
    payload.underline ? underlineDom.classList.add('active') : underlineDom.classList.remove('active')
    payload.strikeout ? strikeoutDom.classList.add('active') : strikeoutDom.classList.remove('active')
    if (payload.color) {
      colorDom.classList.add('active')
      colorControlDom.value = payload.color
      colorSpanDom.style.backgroundColor = payload.color
    } else {
      colorDom.classList.remove('active')
      colorControlDom.value = '#000000'
      colorSpanDom.style.backgroundColor = '#000000'
    }
    if (payload.highlight) {
      highlightDom.classList.add('active')
      highlightControlDom.value = payload.highlight
      highlightSpanDom.style.backgroundColor = payload.highlight
    } else {
      highlightDom.classList.remove('active')
      highlightControlDom.value = '#ffff00'
      highlightSpanDom.style.backgroundColor = '#ffff00'
    }

    // 行布局
    leftDom.classList.remove('active')
    centerDom.classList.remove('active')
    rightDom.classList.remove('active')
    alignmentDom.classList.remove('active')
    if (payload.rowFlex && payload.rowFlex === 'right') {
      rightDom.classList.add('active')
    } else if (payload.rowFlex && payload.rowFlex === 'center') {
      centerDom.classList.add('active')
    } else if (payload.rowFlex && payload.rowFlex === 'alignment') {
      alignmentDom.classList.add('active')
    } else {
      leftDom.classList.add('active')
    }

    // 行间距
    rowOptionDom.querySelectorAll<HTMLLIElement>('li').forEach(li => li.classList.remove('active'))
    const curRowMarginDom = rowOptionDom.querySelector<HTMLLIElement>(`[data-rowmargin='${payload.rowMargin}']`)!
    curRowMarginDom.classList.add('active')

    // 功能
    payload.undo ? undoDom.classList.remove('no-allow') : undoDom.classList.add('no-allow')
    payload.redo ? redoDom.classList.remove('no-allow') : redoDom.classList.add('no-allow')
    payload.painter ? painterDom.classList.add('active') : painterDom.classList.remove('active')
  }

  instance.listener.visiblePageNoListChange = function (payload) {
    const text = payload.map(i => i + 1).join('、')
    document.querySelector<HTMLSpanElement>('.page-no-list')!.innerText = text
  }

  instance.listener.pageSizeChange = function (payload) {
    document.querySelector<HTMLSpanElement>('.page-size')!.innerText = `${payload}`
  }

  instance.listener.intersectionPageNoChange = function (payload) {
    document.querySelector<HTMLSpanElement>('.page-no')!.innerText = `${payload + 1}`
  }

  instance.listener.pageScaleChange = function (payload) {
    document.querySelector<HTMLSpanElement>('.page-scale-percentage')!.innerText = `${Math.floor(payload * 10 * 10)}%`
  }

  instance.listener.controlChange = function (payload) {
    const disableMenusInControlContext = [
      'superscript',
      'subscript',
      'table',
      'image',
      'hyperlink',
      'separator',
      'codeblock',
      'page-break',
      'control',
      'checkbox'
    ]
    // 菜单操作权限
    disableMenusInControlContext.forEach(menu => {
      const menuDom = document.querySelector<HTMLDivElement>(`.menu-item__${menu}`)!
      payload ? menuDom.classList.add('disable') : menuDom.classList.remove('disable')
    })
  }

  instance.listener.pageModeChange = function (payload) {
    const activeMode = pageModeOptionsDom.querySelector<HTMLLIElement>(`[data-page-mode='${payload}']`)!
    pageModeOptionsDom.querySelectorAll('li').forEach(li => li.classList.remove('active'))
    activeMode.classList.add('active')
  }

  instance.listener.contentChange = async function () {
    const wordCount = await instance.command.getWordCount()
    document.querySelector<HTMLSpanElement>('.word-count')!.innerText = `${wordCount || 0}`
  }

  instance.listener.saved = function (payload) {
    console.log('elementList: ', payload)
  }

  // 9. 右键菜单注册
  instance.register.contextMenuList([
    {
      id: 'signature',
      name: translate.options.translateContextMenuSignature.title,
      icon: 'signature',
      when: (payload) => {
        return !payload.isReadonly && payload.editorTextFocus
      },
      callback: (command: Command) => {
        new Signature({
          labels: translate.options.dialogLabelsSignature,
          onConfirm(payload) {
            if (!payload) return
            const { value, width, height } = payload
            if (!value || !width || !height) return
            command.executeInsertElementList([{
              value,
              width,
              height,
              type: ElementType.IMAGE
            }])
          }
        })
      }
    }
  ])

  // 10. 快捷键注册
  instance.register.shortcutList([
    {
      key: KeyMap.P,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePrint()
      }
    },
    {
      key: KeyMap.F,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        const text = command.getRangeText()
        searchDom.click()
        if (text) {
          searchInputDom.value = text
          instance.command.executeSearch(text)
          setSearchResult()
        }
      }
    },
    {
      key: KeyMap.MINUS,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePageScaleMinus()
      }
    },
    {
      key: KeyMap.EQUAL,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePageScaleAdd()
      }
    },
    {
      key: KeyMap.ZERO,
      ctrl: true,
      isGlobal: true,
      callback: (command: Command) => {
        command.executePageScaleRecovery()
      }
    }
  ])


  const languageDom = document.querySelector<HTMLDivElement>('.menu-item__language')!
  const languageDomOptionDom = languageDom.querySelector<HTMLDivElement>('.options')!
  languageDom.onclick = function () {
    console.log('language')
    languageDomOptionDom.classList.toggle('visible')
    // 定位调整
    const bodyRect = document.body.getBoundingClientRect()
    const languageDomRect = languageDom.getBoundingClientRect()
    const languageDomOptionRect = languageDomOptionDom.getBoundingClientRect()
    if (languageDomRect.x + languageDomOptionRect.width > bodyRect.width) {
      languageDomOptionDom.style.right = '0px'
      languageDomOptionDom.style.left = 'unset'
    } else {
      languageDomOptionDom.style.right = 'unset'
      languageDomOptionDom.style.left = (languageDomRect.x) + 'px'
    }
  }
  languageDomOptionDom.onmousedown = function (evt) {
    const li = evt.target as HTMLLIElement
    languageDomOptionDom.classList.toggle('visible')
    const selectedLang = li.getAttribute('data-control')
    if (selectedLang) {
      translate.setTranslation(selectedLang, instance)
    }
  }
}
