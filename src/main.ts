import './style.css'
import Editor, { ElementType, IElement, RowFlex } from './editor'
import { Dialog } from './components/dialog/Dialog'

window.onload = function () {

  const text = `人民医院门诊病历\n主诉：\n发热三天，咳嗽五天。\n现病史：\n患者于三天前无明显诱因，感冒后发现面部水肿，无皮疹，尿量减少，出现乏力，在外治疗无好转，现来我院就诊。\n既往史：\n有糖尿病10年，有高血压2年，有传染性疾病1年。没有报告其他既往疾病。\n流行病史：\n否认14天内接触过确诊患者、疑似患者、无症状感染者及其密切接触者；否认14天内去过以下场所：水产、肉类批发市场，农贸市场，集市，大型超市，夜市；否认14天内与以下场所工作人员密切接触：水产、肉类批发市场，农贸市场，集市，大型超市；否认14天内周围（如家庭、办公室）有2例以上聚集性发病；否认14天内接触过有发热或呼吸道症状的人员；否认14天内自身有发热或呼吸道症状；否认14天内接触过纳入隔离观察的人员及其他可能与新冠肺炎关联的情形；陪同家属{有无选择代码}有以上情况。\n体格检查：\nT：39.5℃，P：80bpm，R：20次/分，BP：120/80mmHg；\n辅助检查：\n2020年6月10日，普放：血细胞比容36.50%（偏低）40～50；单核细胞绝对值0.75*10/L（偏高）参考值：0.1～0.6；\n门诊诊断：\n1.高血压\n2.糖尿病\n3.病毒性感冒\n4.过敏性鼻炎\n5.过敏性鼻息肉\n处置治疗：\n1.超声引导下甲状腺细针穿刺术；\n2.乙型肝炎表面抗体测定；\n3.膜式病变细胞采集术、后颈皮下肤层；\n电子签名：【】\n其他记录：`
  // 模拟行居中
  const centerText = ['人民医院门诊病历']
  const centerIndex: number[] = centerText.map(c => {
    const i = text.indexOf(c)
    return ~i ? Array(c.length).fill(i).map((_, j) => i + j) : []
  }).flat()
  // 模拟加粗字
  const boldText = ['主诉：', '现病史：', '既往史：', '流行病史：', '体格检查：', '辅助检查：', '门诊诊断：', '处置治疗：', '电子签名：', '其他记录：']
  const boldIndex: number[] = boldText.map(b => {
    const i = text.indexOf(b)
    return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
  }).flat()
  // 模拟颜色字
  const colorText = ['传染性疾病']
  const colorIndex: number[] = colorText.map(b => {
    const i = text.indexOf(b)
    return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
  }).flat()
  // 模拟高亮字
  const highlightText = ['血细胞比容']
  const highlightIndex: number[] = highlightText.map(b => {
    const i = text.indexOf(b)
    return ~i ? Array(b.length).fill(i).map((_, j) => i + j) : []
  }).flat()
  // 组合数据
  const data: IElement[] = text.split('').map((value, index) => {
    if (centerIndex.includes(index)) {
      return {
        value,
        size: 32,
        rowFlex: RowFlex.CENTER
      }
    }
    if (boldIndex.includes(index)) {
      return {
        value,
        size: 18,
        bold: true
      }
    }
    if (colorIndex.includes(index)) {
      return {
        value,
        color: '#FF0000',
        size: 16
      }
    }
    if (highlightIndex.includes(index)) {
      return {
        value,
        highlight: '#F2F27F'
      }
    }
    return {
      value,
      size: 16
    }
  })
  data.splice(8, 0, {
    value: '\n',
    type: ElementType.SEPARATOR
  })
  data.splice(138, 0, {
    type: ElementType.HYPERLINK,
    value: '',
    valueList: [{
      value: '新',
      size: 16
    }, {
      value: '冠',
      size: 16
    }, {
      value: '肺',
      size: 16
    }, {
      value: '炎',
      size: 16
    }],
    url: 'https://hufe.club/canvas-editor'
  })
  data.splice(379, 0, {
    value: '∆',
    color: '#FF0000',
    type: ElementType.SUBSCRIPT
  })
  data.splice(467, 0, {
    value: '9',
    type: ElementType.SUPERSCRIPT
  })
  data.splice(593, 0, {
    value: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFkAAAAgCAYAAAB5JtSmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQ0SURBVGhD7dhrUSNBFAVgvKACEVjAAhJQgAIUYAABGEAABvgfAdn6UnWou01PppOZhIXNj1P9vo9zH5PK1Waz2V5wWlxIPgMuJJ8Bi0h+fn7eXl9fb29ubrYPDw/dO/8DHh8fu/vB4kym4Orqaofb29vund8OSSbhemewSrugBMnG3vlvw9vb265yn56edmtz/t/f33+5C8MkixQSZSsl9UzLOHUmcwTYAN/Rpl5eXnY+pnIB0Xd3d7s5m3rvDsrkCGszNiQ7r/tr4v39fSc/uipOqRcqufTHBiO78GGdzG5xcLtIFmVde7L9NsvXRo9s84+Pj+79pUAwn5GcD1wIz5r+fYGeJdnjGiF9hwL7iWAcfX19/evtKVHJXrtN8Rf4A3TVczqhrut5i1mSZQgnIriSWtdzP2N+EvIhi3/GWqHWtWXuy2IYbheiKarJZIZknkxyrryc2Utrgal+9S8iScUXIx/3kcxfe/jotcuDezLFlIbARDrzHpytXdKnQr4xyc74Vu9YV5Ih2Q/tT7mDSEYw5ZU4wu3nJx64k/1z9umlUG0hah/JSbC6Jzi5exDJWoTHERoBxu8uf/pT1j3HDkUIJitjbRfRA/iwVzlgy1RCfSF5ili9xj7BUWKs9wJZ3MpditYu+lsc+/PRx53cVF9Pdg/syE9Hb6cS75PkmhUEUFofmTvLGEXKimHueJP9Y3swWQwGLUiA9xEbHKuvgs4pPe1+1myTAKlw81buJ8kigjAXKauXPLQPhEYgJSEYsgdTUR0BmTVgc6C359wcvKGnBrGO8dO5VlD1ZZ519nrBHvrwKVMCas9hgL0YUI2wV98fC4FqCWizzXyqF44A0ZKLHkilgvPs1zbiTuZIdZ414KvqGCKZYx4zple+MSrrJVncAyL02/TOqncJwVMglx5zI4QDZ5WPvBGEcNP+7TlEcqJIAQFGsIdQjmZt7MlYA5yiI3pOQTCQXUm2TuVmXgmewxDJQDgl6deJJoU5y7p9uwZagmu1mCvbNoOOBfkhOf6lRZjzPb8qRjBMMiUhM9GNMZQq5/oRXBP7Mlj/i12A7EMIaJGqDcl8I79+/N1xTvdINQ2TDAQSvI9Md479vdqCHKSFQKAfEmgBqCTDkjaSgOZXQkg2jy1ti0xApnBQJo/0obQRipeQXbN3CmxKGQch5xgki4Efghl/kFqzPD//2DnXIodIRpaoETaXxcmwGNO7N4I2Oyuc6b+xK/tL9IH3kY/E+r1JdST4yM+7VUiuJbuPZHBeHZcNvXtziMMV9mRuvUOX8Vg9IFjRx9dUYM3s2oJyNx9ahFfSWwyRHKHG3nmL2q/mojyFVAWnEdi2Hg7OBXwUCCKr1QEtoe0+/9jI3xqIiuF2QRD0zqcwpfQnge9TVSI4tWrNe79shj98F0xDC0N4bTUVF5LPgAvJJ8dm+wcP2iJuZNdC5QAAAABJRU5ErkJggg==`,
    width: 89,
    height: 32,
    id: 'signature',
    type: ElementType.IMAGE
  })
  data.push({
    type: ElementType.TABLE,
    value: `\n`,
    colgroup: [{
      width: 180
    }, {
      width: 80
    }, {
      width: 130
    }, {
      width: 130
    }],
    trList: [{
      height: 40,
      tdList: [{
        colspan: 1,
        rowspan: 2,
        value: [
          { value: `1`, size: 16 },
          { value: '.', size: 16 }
        ]
      }, {
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `2`, size: 16 },
          { value: '.', size: 16 }
        ]
      }, {
        colspan: 2,
        rowspan: 1,
        value: [
          { value: `3`, size: 16 },
          { value: '.', size: 16 }
        ]
      }]
    }, {
      height: 40,
      tdList: [{
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `4`, size: 16 },
          { value: '.', size: 16 }
        ]
      }, {
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `5`, size: 16 },
          { value: '.', size: 16 }
        ]
      }, {
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `6`, size: 16 },
          { value: '.', size: 16 }
        ]
      }]
    }, {
      height: 40,
      tdList: [{
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `7`, size: 16 },
          { value: '.', size: 16 }
        ]
      }, {
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `8`, size: 16 },
          { value: '.', size: 16 }
        ]
      }, {
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `9`, size: 16 },
          { value: '.', size: 16 }
        ]
      }, {
        colspan: 1,
        rowspan: 1,
        value: [
          { value: `1`, size: 16 },
          { value: `0`, size: 16 },
          { value: '.', size: 16 }
        ]
      }]
    }]
  })
  data.push(...[{
    value: 'E',
    size: 16
  }, {
    value: 'O',
    size: 16
  }, {
    value: 'F',
    size: 16
  }])
  // 初始化编辑器
  const container = document.querySelector<HTMLDivElement>('.editor')!
  const instance = new Editor(container, <IElement[]>data, {
    margins: [100, 120, 100, 120],
    header: {
      data: '人民医院门诊'
    },
    watermark: {
      data: 'CANVAS-EDITOR',
      size: 120
    }
  })
  console.log('实例: ', instance)

  // 撤销、重做、格式刷、清除格式
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
    instance.command.executePainter()
  }
  document.querySelector<HTMLDivElement>('.menu-item__format')!.onclick = function () {
    console.log('format')
    instance.command.executeFormat()
  }

  // 字体、字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
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
  colorControlDom.onchange = function () {
    instance.command.executeColor(colorControlDom!.value)
  }
  const colorDom = document.querySelector<HTMLDivElement>('.menu-item__color')!
  const colorSpanDom = colorDom.querySelector('span')!
  colorDom.onclick = function () {
    console.log('color')
    colorControlDom.click()
  }
  const highlightControlDom = document.querySelector<HTMLInputElement>('#highlight')!
  highlightControlDom.onchange = function () {
    instance.command.executeHighlight(highlightControlDom.value)
  }
  const highlightDom = document.querySelector<HTMLDivElement>('.menu-item__highlight')!
  const highlightSpanDom = highlightDom.querySelector('span')!
  highlightDom.onclick = function () {
    console.log('highlight')
    highlightControlDom?.click()
  }
  // 行布局
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
  // 表格插入、图片上传、搜索、打印
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
    const file = imageFileDom.files?.[0]!
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
  const searchCollapseDom = document.querySelector<HTMLDivElement>('.menu-item__search__collapse')
  const searchInputDom = document.querySelector<HTMLInputElement>('.menu-item__search__collapse__search input')
  document.querySelector<HTMLDivElement>('.menu-item__search')!.onclick = function () {
    console.log('search')
    searchCollapseDom!.style.display = 'block'
  }
  document.querySelector<HTMLDivElement>('.menu-item__search__collapse span')!.onclick = function () {
    searchCollapseDom!.style.display = 'none'
    searchInputDom!.value = ''
    instance.command.executeSearch(null)
  }
  searchInputDom!.oninput = function () {
    instance.command.executeSearch(searchInputDom?.value || null)
  }
  searchInputDom!.onkeydown = function (evt) {
    if (evt.key === 'Enter') {
      instance.command.executeSearch(searchInputDom?.value || null)
    }
  }
  document.querySelector<HTMLDivElement>('.menu-item__print')!.onclick = function () {
    console.log('print')
    instance.command.executePrint()
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

  // 内部事件监听
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
    if (payload.rowFlex && payload.rowFlex === 'right') {
      rightDom.classList.add('active')
    } else if (payload.rowFlex && payload.rowFlex === 'center') {
      centerDom.classList.add('active')
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

  instance.listener.saved = function (payload) {
    console.log('elementList: ', payload)
  }

}