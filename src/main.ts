import { data, options } from './mock'
import './style.css'
import prism from 'prismjs'
import Editor, { Command, ControlType, EditorMode, ElementType, IElement, KeyMap, PageMode } from './editor'
import { Dialog } from './components/dialog/Dialog'
import { formatPrismToken } from './utils/prism'
import { Signature } from './components/signature/Signature'

window.onload = function () {

  // 1. 初始化编辑器
  const container = document.querySelector<HTMLDivElement>('.editor')!
  const instance = new Editor(container, <IElement[]>data, options)
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
    fontOptionDom.classList.toggle('visible')
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
    new Dialog({
      title: '超链接',
      data: [{
        type: 'text',
        label: '文本',
        name: 'name',
        placeholder: '请输入文本'
      }, {
        type: 'text',
        label: '链接',
        name: 'url',
        placeholder: '请输入链接'
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
  }
  watermarkOptionDom.onmousedown = function (evt) {
    const li = evt.target as HTMLLIElement
    const menu = li.dataset.menu!
    watermarkOptionDom.classList.toggle('visible')
    if (menu === 'add') {
      new Dialog({
        title: '水印',
        data: [{
          type: 'text',
          label: '内容',
          name: 'data',
          placeholder: '请输入内容'
        }, {
          type: 'color',
          label: '颜色',
          name: 'color',
          value: '#AEB5C0'
        }, {
          type: 'number',
          label: '字体大小',
          name: 'size',
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
    new Dialog({
      title: '代码块',
      data: [{
        type: 'textarea',
        name: 'codeblock',
        placeholder: '请输入代码',
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
  }
  controlOptionDom.onmousedown = function (evt) {
    controlOptionDom.classList.toggle('visible')
    const li = evt.target as HTMLLIElement
    const type = <ControlType>li.dataset.control
    switch (type) {
      case ControlType.TEXT:
        new Dialog({
          title: '文本控件',
          data: [{
            type: 'text',
            label: '占位符',
            name: 'placeholder',
            placeholder: '请输入占位符'
          }, {
            type: 'text',
            label: '默认值',
            name: 'value',
            placeholder: '请输入默认值'
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
      case ControlType.SELECT:
        new Dialog({
          title: '列举控件',
          data: [{
            type: 'text',
            label: '占位符',
            name: 'placeholder',
            placeholder: '请输入占位符'
          }, {
            type: 'text',
            label: '默认值',
            name: 'code',
            placeholder: '请输入默认值'
          }, {
            type: 'textarea',
            label: '值集',
            name: 'valueSets',
            height: 100,
            placeholder: `请输入值集JSON，例：\n[{\n"value":"有",\n"code":"98175"\n}]`
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
      case ControlType.CHECKBOX:
        new Dialog({
          title: '复选框控件',
          data: [{
            type: 'text',
            label: '默认值',
            name: 'code',
            placeholder: '请输入默认值，多个值以英文逗号分割'
          }, {
            type: 'textarea',
            label: '值集',
            name: 'valueSets',
            height: 100,
            placeholder: `请输入值集JSON，例：\n[{\n"value":"有",\n"code":"98175"\n}]`
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
    new Dialog({
      title: 'LaTeX',
      data: [{
        type: 'textarea',
        height: 100,
        name: 'value',
        placeholder: '请输入LaTeX文本'
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
    const dateDomOptionRect = dateDomOptionDom.getBoundingClientRect()
    if (dateDomOptionRect.left + dateDomOptionRect.width > bodyRect.width) {
      dateDomOptionDom.style.right = '0px'
      dateDomOptionDom.style.left = 'unset'
    } else {
      dateDomOptionDom.style.right = 'unset'
      dateDomOptionDom.style.left = '0px'
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
    const searchCollapseRect = searchCollapseDom.getBoundingClientRect()
    if (searchRect.left + searchCollapseRect.width > bodyRect.width) {
      searchCollapseDom.style.right = '0px'
      searchCollapseDom.style.left = 'unset'
    } else {
      searchCollapseDom.style.right = 'unset'
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
    new Dialog({
      title: '页边距',
      data: [{
        type: 'text',
        label: '上边距',
        name: 'top',
        value: `${topMargin}`,
        placeholder: '请输入上边距'
      }, {
        type: 'text',
        label: '下边距',
        name: 'bottom',
        value: `${bottomMargin}`,
        placeholder: '请输入下边距'
      }, {
        type: 'text',
        label: '左边距',
        name: 'left',
        value: `${leftMargin}`,
        placeholder: '请输入左边距'
      }, {
        type: 'text',
        label: '右边距',
        name: 'right',
        value: `${rightMargin}`,
        placeholder: '请输入右边距'
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
  const modeList = [{
    mode: EditorMode.EDIT,
    name: '编辑模式'
  }, {
    mode: EditorMode.CLEAN,
    name: '清洁模式'
  }, {
    mode: EditorMode.READONLY,
    name: '只读模式'
  }]
  const modeElement = document.querySelector<HTMLDivElement>('.editor-mode')!
  modeElement.onclick = function () {
    // 模式选择循环
    modeIndex === 2 ? modeIndex = 0 : modeIndex++
    // 设置模式
    const { name, mode } = modeList[modeIndex]
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
    const curFontDom = fontOptionDom.querySelector<HTMLLIElement>(`[data-family=${payload.font}]`)
    if (curFontDom) {
      fontSelectDom.innerText = curFontDom.innerText
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
      name: '签名',
      icon: 'signature',
      when: (payload) => {
        return !payload.isReadonly && payload.editorTextFocus
      },
      callback: (command: Command) => {
        new Signature({
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
      callback: () => {
        searchDom.click()
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
    }
  ])

}