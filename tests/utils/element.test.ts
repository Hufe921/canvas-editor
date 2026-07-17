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
  replaceHTMLElementTag,
  scanToOwner,
  getOutermostOwner
} from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TraceType } from '@/editor/dataset/enum/Trace'
import { RowFlex } from '@/editor/dataset/enum/Row'
import { ControlType, ControlComponent } from '@/editor/dataset/enum/Control'
import type { IElement } from '@/editor/interface/Element'

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

describe('formatElementList', () => {
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
    formatElementList(list as any, {
      isForceCompensation: true,
      editorOptions: mockOptions
    })
    expect(list[0].value).toBe('\u200B')
  })

  it('isHandleFirstElement false 跳过首字符补偿', () => {
    const list = [{ value: 'hello' }]
    formatElementList(list as any, {
      isHandleFirstElement: false,
      editorOptions: mockOptions
    })
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

  it('相同 trace 的相邻文本元素合并', () => {
    const trace = [{ type: TraceType.DELETED, author: 'hufe', timestamp: 1 }]
    const list = [
      { value: 'a', type: ElementType.TEXT, size: 16, trace },
      { value: 'b', type: ElementType.TEXT, size: 16, trace: [...trace] }
    ]
    const result = zipElementList(list as any)
    expect(result.length).toBe(1)
    expect(result[0].value).toBe('ab')
    expect(result[0].trace).toEqual(trace)
  })

  it('不同 trace 的相邻文本元素不合并', () => {
    const list = [
      {
        value: 'a',
        type: ElementType.TEXT,
        trace: [{ type: TraceType.DELETED, author: 'hufe', timestamp: 1 }]
      },
      {
        value: 'b',
        type: ElementType.TEXT,
        trace: [{ type: TraceType.DELETED, author: 'hufe', timestamp: 2 }]
      }
    ]
    const result = zipElementList(list as any)
    expect(result.length).toBe(2)
  })

  it('先插入后删除的相邻元素合并，保留两条记录', () => {
    const trace = [
      { type: TraceType.INSERTED, author: 'hufe', timestamp: 1 },
      { type: TraceType.DELETED, author: 'hufe', timestamp: 2 }
    ]
    const list = [
      { value: 'a', type: ElementType.TEXT, size: 16, trace },
      { value: 'b', type: ElementType.TEXT, size: 16, trace: [...trace] }
    ]
    const result = zipElementList(list as any)
    expect(result.length).toBe(1)
    expect(result[0].value).toBe('ab')
    expect(result[0].trace).toHaveLength(2)
    expect(result[0].trace?.[0].type).toBe(TraceType.INSERTED)
    expect(result[0].trace?.[1].type).toBe(TraceType.DELETED)
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
    const list = [{ value: 'hello' }, { value: 'world' }]
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
    expect(
      isTextLikeElement({ value: '', type: ElementType.IMAGE } as any)
    ).toBe(false)
  })
})

describe('isTextElement', () => {
  it('纯文本返回 true', () => {
    expect(
      isTextElement({ value: 'hello', type: ElementType.TEXT } as any)
    ).toBe(true)
  })

  it('无 type 的文本返回 true', () => {
    expect(isTextElement({ value: 'hello' } as any)).toBe(true)
  })
})

describe('getElementListText', () => {
  it('提取元素列表文本', () => {
    const list = [{ value: 'hello' }, { value: 'world' }]
    expect(getElementListText(list as any)).toBe('helloworld')
  })
})

describe('getTextFromElementList', () => {
  it('从元素列表提取纯文本', () => {
    const list = [{ value: 'hello' }, { value: '\n' }, { value: 'world' }]
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

describe('scanToOwner', () => {
  const buildEl = (
    controlId: string,
    controlComponent: ControlComponent,
    value = ''
  ): IElement => ({
    type: ElementType.CONTROL,
    value,
    controlId,
    controlComponent,
    control: { type: ControlType.TEXT, value: null } as any
  })

  const list = [
    buildEl('OUT', ControlComponent.PREFIX, '{'),
    buildEl('OUT', ControlComponent.VALUE, 'a'),
    buildEl('IN', ControlComponent.PREFIX, '{'),
    buildEl('IN', ControlComponent.VALUE, 'x'),
    buildEl('IN', ControlComponent.POSTFIX, '}'),
    buildEl('OUT', ControlComponent.VALUE, 'b'),
    buildEl('OUT', ControlComponent.POSTFIX, '}')
  ]

  it('向右步进跳过内层段', () => {
    expect(scanToOwner(list, 1, 1, 'OUT')).toBe(5)
  })

  it('向左步进跳过内层段落', () => {
    expect(scanToOwner(list, 5, -1, 'OUT')).toBe(1)
  })

  it('同 ownerId 时正常单步', () => {
    expect(scanToOwner(list, 0, 1, 'OUT')).toBe(1)
  })

  it('越界返回边界', () => {
    expect(scanToOwner(list, 6, 1, 'OUT')).toBe(7)
    expect(scanToOwner(list, 0, -1, 'OUT')).toBe(-1)
  })
})

describe('getOutermostOwner', () => {
  const buildEl = (
    controlId: string,
    controlComponent: ControlComponent,
    value = ''
  ): IElement => ({
    type: ElementType.CONTROL,
    value,
    controlId,
    controlComponent,
    control: { type: ControlType.TEXT, value: null } as any
  })

  it('无嵌套时返回当前 controlId', () => {
    const list = [
      buildEl('A', ControlComponent.PREFIX),
      buildEl('A', ControlComponent.VALUE, 'x'),
      buildEl('A', ControlComponent.POSTFIX)
    ]
    expect(getOutermostOwner(list, 1)).toBe('A')
  })

  it('嵌套时返回最外层 controlId', () => {
    const list = [
      buildEl('OUT', ControlComponent.PREFIX),
      buildEl('OUT', ControlComponent.VALUE, 'a'),
      buildEl('MID', ControlComponent.PREFIX),
      buildEl('MID', ControlComponent.VALUE, 'b'),
      buildEl('IN', ControlComponent.PREFIX),
      buildEl('IN', ControlComponent.VALUE, 'c'),
      buildEl('IN', ControlComponent.POSTFIX),
      buildEl('MID', ControlComponent.POSTFIX),
      buildEl('OUT', ControlComponent.POSTFIX)
    ]
    expect(getOutermostOwner(list, 5)).toBe('OUT')
    expect(getOutermostOwner(list, 3)).toBe('OUT')
  })

  it('非控件位置返回 null', () => {
    const list = [{ value: 'plain text' }]
    expect(getOutermostOwner(list, 0)).toBeNull()
  })
})

describe('formatElementList - 嵌套控件', () => {
  it('外层 TEXT 的 value 含内层控件时保留内层 controlId', () => {
    const input: IElement[] = [
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.TEXT,
          value: [
            { value: '结婚年龄：' },
            {
              type: ElementType.CONTROL,
              value: '',
              control: {
                type: ControlType.TEXT,
                value: null,
                placeholder: '年龄'
              }
            },
            { value: ' 岁' }
          ],
          placeholder: '结婚年龄'
        }
      }
    ]
    formatElementList(input, {
      editorOptions: mockOptions as any,
      isForceCompensation: true
    })
    const innerControlIds = new Set(
      input
        .filter(el => el.controlComponent === ControlComponent.PREFIX)
        .map(el => el.controlId)
    )
    expect(innerControlIds.size).toBe(2)
  })
})

describe('zipElementList - 嵌套控件', () => {
  it('外层 TEXT 含内层控件时正确压缩为嵌套结构', () => {
    const outerId = 'out-1'
    const innerId = 'in-1'
    const flat: IElement[] = [
      {
        type: ElementType.CONTROL,
        value: '{',
        controlId: outerId,
        controlComponent: ControlComponent.PREFIX,
        control: { type: ControlType.TEXT, value: null }
      },
      {
        type: ElementType.CONTROL,
        value: 'a',
        controlId: outerId,
        controlComponent: ControlComponent.VALUE,
        control: { type: ControlType.TEXT, value: null }
      },
      {
        type: ElementType.CONTROL,
        value: '{',
        controlId: innerId,
        controlComponent: ControlComponent.PREFIX,
        control: { type: ControlType.TEXT, value: null }
      },
      {
        type: ElementType.CONTROL,
        value: 'x',
        controlId: innerId,
        controlComponent: ControlComponent.VALUE,
        control: { type: ControlType.TEXT, value: null }
      },
      {
        type: ElementType.CONTROL,
        value: '}',
        controlId: innerId,
        controlComponent: ControlComponent.POSTFIX,
        control: { type: ControlType.TEXT, value: null }
      },
      {
        type: ElementType.CONTROL,
        value: 'b',
        controlId: outerId,
        controlComponent: ControlComponent.VALUE,
        control: { type: ControlType.TEXT, value: null }
      },
      {
        type: ElementType.CONTROL,
        value: '}',
        controlId: outerId,
        controlComponent: ControlComponent.POSTFIX,
        control: { type: ControlType.TEXT, value: null }
      }
    ]
    const zipped = zipElementList(flat)
    expect(zipped.length).toBe(1)
    expect(zipped[0].control).toBeDefined()
    expect(zipped[0].control!.value!.length).toBe(3)
    const innerElement = zipped[0].control!.value![1]
    expect(innerElement.type).toBe(ElementType.CONTROL)
    expect(innerElement.control).toBeDefined()
    expect(innerElement.control!.value!.length).toBe(1)
    expect(innerElement.control!.value![0].value).toBe('x')
  })

  it('外层含多个并列内层控件时不重复嵌套', () => {
    const outerId = 'out-1'
    const in1Id = 'in-1'
    const in2Id = 'in-2'
    const make = (
      id: string,
      comp: ControlComponent,
      value = ''
    ): IElement => ({
      type: ElementType.CONTROL,
      value,
      controlId: id,
      controlComponent: comp,
      control: { type: ControlType.TEXT, value: null }
    })
    const flat: IElement[] = [
      make(outerId, ControlComponent.PREFIX, '{'),
      make(outerId, ControlComponent.VALUE, 'a'),
      make(in1Id, ControlComponent.PREFIX, '{'),
      make(in1Id, ControlComponent.VALUE, 'x'),
      make(in1Id, ControlComponent.POSTFIX, '}'),
      make(outerId, ControlComponent.VALUE, 'b'),
      make(in2Id, ControlComponent.PREFIX, '{'),
      make(in2Id, ControlComponent.VALUE, 'y'),
      make(in2Id, ControlComponent.POSTFIX, '}'),
      make(outerId, ControlComponent.VALUE, 'c'),
      make(outerId, ControlComponent.POSTFIX, '}')
    ]
    const zipped = zipElementList(flat)
    expect(zipped.length).toBe(1)
    const outerValue = zipped[0].control!.value!
    // 期望结构: ['a', IN1, 'b', IN2, 'c']
    expect(outerValue.length).toBe(5)
    expect(outerValue[0].value).toBe('a')
    expect(outerValue[1].type).toBe(ElementType.CONTROL)
    expect(outerValue[1].control!.value!.length).toBe(1)
    expect(outerValue[1].control!.value![0].value).toBe('x')
    expect(outerValue[2].value).toBe('b')
    expect(outerValue[3].type).toBe(ElementType.CONTROL)
    expect(outerValue[3].control!.value!.length).toBe(1)
    expect(outerValue[3].control!.value![0].value).toBe('y')
    expect(outerValue[4].value).toBe('c')
  })
})
