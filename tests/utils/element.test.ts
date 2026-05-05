import { describe, it, expect } from 'vitest'
import {
  formatElementList,
  unzipElementList,
  zipElementList,
  pickElementAttr,
  getAnchorElement,
  isTextLikeElement,
  isTextElement,
  getElementListText,
  getTextFromElementList,
  createDomFromElementList,
  getElementListByHTML,
  isSameElementExceptValue,
  getIsBlockElement,
  getSlimCloneElementList,
  convertTextAlignToRowFlex,
  convertRowFlexToTextAlign,
  convertRowFlexToJustifyContent,
  replaceHTMLElementTag
} from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { RowFlex } from '@/editor/dataset/enum/Row'

describe('formatElementList', () => {
  const mockOptions = {
    defaultSize: 16,
    defaultFont: 'Microsoft YaHei',
    defaultColor: '#000000',
    defaultBasicRowMarginHeight: 8,
    defaultRowMargin: 8,
    defaultTabWidth: 32,
    minSize: 8,
    maxSize: 72,
    width: 794,
    height: 1123,
    scale: 1,
    pageGap: 20,
    underlineColor: '#000000',
    strikeoutColor: '#000000',
    defaultBorderType: 'all',
    rangeColor: '#000000',
    rangeAlpha: 0.3,
    rangeMinWidth: 2,
    searchMatchColor: '#000000',
    searchNavigateMatchColor: '#000000',
    searchMatchAlpha: 0.3,
    highlightAlpha: 0.3,
    highlightMarginHeight: 2,
    resizerColor: '#000000',
    resizerSize: 5,
    marginIndicatorSize: 5,
    marginIndicatorColor: '#000000',
    margins: [100, 120, 100, 120] as [number, number, number, number],
    pageMode: 'pagination',
    renderMode: 'painter',
    defaultHyperlinkColor: '#0000ff',
    paperDirection: 'portrait',
    defaultType: 'text',
    locale: 'zh-CN',
    mode: 'edit',
    defaultTypewriterMode: false,
    placeholderData: [],
    pageNumber: {
      bottom: 40,
      size: 12,
      font: 'Microsoft YaHei',
      color: '#000000',
      rowFlex: 'center',
      format: '{pageNo}/{pageCount}'
    },
    watermark: {
      data: '',
      color: '#000000',
      size: 12,
      font: 'Microsoft YaHei',
      opacity: 0.1,
      repeat: true,
      gap: [200, 200]
    },
    control: {
      prefix: '{',
      suffix: '}',
      placeholderColor: '#000000',
      bracketColor: '#000000',
      valueSize: 12,
      valueFont: 'Microsoft YaHei',
      deletable: true
    },
    checkbox: {
      width: 12,
      height: 12,
      gap: 5,
      lineWidth: 1,
      fillStyle: '#000000',
      strokeStyle: '#000000'
    },
    radio: {
      width: 12,
      height: 12,
      gap: 5,
      lineWidth: 1,
      fillStyle: '#000000',
      strokeStyle: '#000000'
    },
    cursor: {
      width: 1,
      color: '#000000'
    },
    title: {
      defaultFirstSize: 26,
      defaultSecondSize: 24,
      defaultThirdSize: 22,
      defaultFourthSize: 20,
      defaultFifthSize: 18,
      defaultSixthSize: 16
    },
    list: {
      defaultSize: 16,
      defaultFont: 'Microsoft YaHei',
      defaultColor: '#000000',
      defaultLineDash: [],
      defaultRowFlex: 'left'
    },
    table: {
      tdPadding: 5,
      defaultBorderType: 'all',
      defaultTdBorderColor: '#000000',
      defaultTdBorderWidth: 1,
      defaultTdBackgroundColor: ''
    },
    header: {
      top: 50,
      maxHeightRadio: 1
    },
    footer: {
      bottom: 50,
      maxHeightRadio: 1
    },
    pageBreak: {
      font: 'Microsoft YaHei',
      size: 12,
      color: '#000000'
    },
    superscript: {
      fontSizeRatio: 0.6,
      offsetRatio: 0.4,
      lineWidth: 1
    },
    subscript: {
      fontSizeRatio: 0.6,
      offsetRatio: 0.4,
      lineWidth: 1
    },
    separator: {
      lineWidth: 1,
      strokeStyle: '#000000',
      dash: [5, 5]
    },
    lineBreak: {
      width: 12,
      height: 12,
      color: '#000000'
    },
    background: {
      color: '#ffffff',
      repeat: 'no-repeat',
      size: 'cover'
    },
    placeholder: {
      color: '#000000',
      size: 12,
      font: 'Microsoft YaHei'
    },
    group: {
      backgroundColor: ''
    },
    lineNumber: {
      size: 12,
      font: 'Microsoft YaHei',
      color: '#000000',
      disabled: false,
      right: 10,
      type: 'continuous'
    },
    pageBorder: {
      color: '#000000',
      lineWidth: 1,
      padding: [10, 10, 10, 10]
    },
    badge: {
      size: 10,
      font: 'Microsoft YaHei',
      color: '#000000',
      backgroundColor: '#000000'
    },
    iframeBlock: {
      src: '',
      width: 300,
      height: 200
    },
    block: {
      src: '',
      width: 300,
      height: 200
    },
    label: {
      size: 12,
      font: 'Microsoft YaHei',
      color: '#000000',
      valueStyle: {}
    },
    whiteSpace: {
      size: 12,
      font: 'Microsoft YaHei',
      color: '#000000'
    },
    magnifier: {
      size: 12,
      font: 'Microsoft YaHei',
      color: '#000000'
    },
    wordBreak: 'break-all',
    dragDisable: false,
    historyMaxRecordCount: 100,
    i18nLangItems: [],
    letterClass: [],
    textareaBorderColor: '#000000',
    imageMaxWidth: 100,
    imageMaxHeight: 100,
    imageViewer: {
      zIndex: 1000
    },
    defaultAlpha: 1,
    hoverOpacity: 0.7,
    activeOpacity: 1,
    strikethrough: {
      lineWidth: 1,
      color: '#000000'
    },
    underline: {
      lineWidth: 1,
      color: '#000000',
      style: 'solid'
    }
  } as any

  it('空数组会补偿零宽字符', () => {
    const list: any[] = []
    formatElementList(list, { editorOptions: mockOptions })
    expect(list.length).toBeGreaterThan(0)
    expect(list[0].value).toBe('\u200B')
  })

  it('普通文本元素应用默认值', () => {
    const list = [{ value: 'hello' }]
    formatElementList(list as any, { editorOptions: mockOptions })
    expect(list.length).toBeGreaterThan(1)
    expect(list[0].value).toBe('\u200B')
  })

  it('isForceCompensation 强制补偿首字符', () => {
    const list = [{ value: 'a' }]
    formatElementList(list as any, { isForceCompensation: true, editorOptions: mockOptions })
    expect(list[0].value).toBe('\u200B')
  })

  it('isHandleFirstElement false 跳过首字符补偿', () => {
    const list = [{ value: 'hello' }]
    formatElementList(list as any, { isHandleFirstElement: false, editorOptions: mockOptions })
    expect(list[0].value).not.toBe('\u200B')
  })
})

describe('unzipElementList', () => {
  it('单字符元素直接返回', () => {
    const list = [{ value: 'a' }]
    const result = unzipElementList(list as any)
    expect(result.length).toBe(1)
    expect(result[0].value).toBe('a')
  })

  it('多字符元素拆分为单字符', () => {
    const list = [{ value: 'abc', bold: true }]
    const result = unzipElementList(list as any)
    expect(result.length).toBe(3)
    expect(result[0].value).toBe('a')
    expect(result[0].bold).toBe(true)
    expect(result[1].value).toBe('b')
    expect(result[2].value).toBe('c')
  })
})

describe('zipElementList', () => {
  it('相邻文本元素合并', () => {
    const list = [
      { value: 'a', type: ElementType.TEXT },
      { value: 'b', type: ElementType.TEXT }
    ]
    const result = zipElementList(list as any)
    expect(result.length).toBe(1)
    expect(result[0].value).toBe('ab')
  })
})

describe('pickElementAttr', () => {
  it('返回默认压缩属性', () => {
    const el = { value: 'hello', bold: true, size: 16, color: '#f00' }
    const result = pickElementAttr(el as any)
    expect(result).toHaveProperty('value')
    expect(result).toHaveProperty('bold')
    expect(result).toHaveProperty('size')
  })
})

describe('getAnchorElement', () => {
  it('从列表中获取指定索引的锚点元素', () => {
    const list = [
      { value: 'hello' },
      { value: 'world' }
    ]
    const result = getAnchorElement(list as any, 0)
    expect(result).toBeTruthy()
  })

  it('空列表返回 null', () => {
    const result = getAnchorElement([], 0)
    expect(result).toBeNull()
  })
})

describe('isTextLikeElement', () => {
  it('纯文本返回 true', () => {
    expect(isTextLikeElement({ value: 'hello' } as any)).toBe(true)
  })

  it('图片返回 false', () => {
    expect(isTextLikeElement({ value: '', type: ElementType.IMAGE } as any)).toBe(false)
  })
})

describe('isTextElement', () => {
  it('纯文本返回 true', () => {
    expect(isTextElement({ value: 'hello', type: ElementType.TEXT } as any)).toBe(true)
  })

  it('无 type 的文本返回 true', () => {
    expect(isTextElement({ value: 'hello' } as any)).toBe(true)
  })
})

describe('getElementListText', () => {
  it('提取元素列表文本', () => {
    const list = [
      { value: 'hello' },
      { value: 'world' }
    ]
    expect(getElementListText(list as any)).toBe('helloworld')
  })
})

describe('getTextFromElementList', () => {
  it('从元素列表提取纯文本', () => {
    const list = [
      { value: 'hello' },
      { value: '\n' },
      { value: 'world' }
    ]
    const result = getTextFromElementList(list as any)
    expect(result).toContain('hello')
    expect(result).toContain('world')
  })
})

describe('createDomFromElementList', () => {
  it('将元素列表转为 DOM', () => {
    const list = [{ value: 'hello' }]
    const dom = createDomFromElementList(list as any)
    expect(dom).toBeTruthy()
    expect(dom.tagName).toBe('DIV')
  })
})

describe('getElementListByHTML', () => {
  it('从 HTML 解析元素列表', () => {
    const html = '<p>hello world</p>'
    const result = getElementListByHTML(html, { innerWidth: 500 })
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('isSameElementExceptValue', () => {
  it('相同属性不同 value 返回 true', () => {
    const a = { value: 'hello', bold: true, size: 16 }
    const b = { value: 'world', bold: true, size: 16 }
    expect(isSameElementExceptValue(a as any, b as any)).toBe(true)
  })

  it('不同属性返回 false', () => {
    const a = { value: 'hello', bold: true }
    const b = { value: 'world', bold: false }
    expect(isSameElementExceptValue(a as any, b as any)).toBe(false)
  })
})

describe('getIsBlockElement', () => {
  it('表格是块级元素', () => {
    expect(getIsBlockElement({ type: ElementType.TABLE } as any)).toBe(true)
  })

  it('纯文本不是块级元素', () => {
    expect(getIsBlockElement({ value: 'hello' } as any)).toBe(false)
  })

  it('undefined 返回 false', () => {
    expect(getIsBlockElement(undefined)).toBe(false)
  })
})

describe('getSlimCloneElementList', () => {
  it('返回浅拷贝列表', () => {
    const list = [{ value: 'hello' }, { value: 'world' }]
    const result = getSlimCloneElementList(list as any)
    expect(result).toHaveLength(2)
    expect(result[0].value).toBe('hello')
    expect(result).not.toBe(list)
  })
})

describe('convertTextAlignToRowFlex', () => {
  it('center 转 center', () => {
    const el = document.createElement('div')
    el.style.textAlign = 'center'
    expect(convertTextAlignToRowFlex(el)).toBe(RowFlex.CENTER)
  })

  it('right 转 right', () => {
    const el = document.createElement('div')
    el.style.textAlign = 'right'
    expect(convertTextAlignToRowFlex(el)).toBe(RowFlex.RIGHT)
  })
})

describe('convertRowFlexToTextAlign', () => {
  it('center 转 center', () => {
    expect(convertRowFlexToTextAlign(RowFlex.CENTER)).toBe('center')
  })

  it('right 转 right', () => {
    expect(convertRowFlexToTextAlign(RowFlex.RIGHT)).toBe('right')
  })
})

describe('convertRowFlexToJustifyContent', () => {
  it('center 转 center', () => {
    expect(convertRowFlexToJustifyContent(RowFlex.CENTER)).toBe('center')
  })

  it('left 转 flex-start', () => {
    expect(convertRowFlexToJustifyContent(RowFlex.LEFT)).toBe('flex-start')
  })
})

describe('replaceHTMLElementTag', () => {
  it('创建新标签并复制属性内容', () => {
    const parent = document.createElement('div')
    parent.innerHTML = '<b>bold</b>'
    const node = parent.querySelector('b')!
    const newNode = replaceHTMLElementTag(node, 'strong')
    expect(newNode.tagName).toBe('STRONG')
    expect(newNode.innerHTML).toBe('bold')
  })
})
