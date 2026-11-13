import { describe, expect, it } from 'vitest'
import { ImageDisplay } from '@/editor/dataset/enum/Common'
import { ControlComponent, ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ListType } from '@/editor/dataset/enum/List'
import { TitleLevel } from '@/editor/dataset/enum/Title'
import { TraceType } from '@/editor/dataset/enum/Trace'
import type { IElement } from '@/editor/interface/Element'
import { deepCloneOmitKeys } from '@/editor/utils'
import { getSlimCloneElementList } from '@/editor/utils/element'

// 模拟排版后（Draw.computeRowList 通过 Object.assign 原地回填）
// 元素上挂载的渲染期字段，这些字段不应进入历史快照
function withRenderFields(element: IElement): IElement {
  const rowElement = element as any
  rowElement.metrics = {
    width: 16,
    height: 16,
    boundingBoxAscent: 12,
    boundingBoxDescent: 4
  }
  rowElement.left = 0
  rowElement.style = '16px Microsoft YaHei'
  return element
}

// 覆盖各类嵌套可变结构的复杂文档
function createComplexElementList(): IElement[] {
  const control: any = {
    type: ControlType.TEXT,
    value: [{ value: '控件值' }],
    placeholder: '请输入',
    conceptId: 'control-1'
  }
  return [
    withRenderFields({ value: '纯文本' }),
    // textDecoration.style 为对象内层的 style 键，
    // 历史实现会将其一并剔除，此处锁定该行为
    withRenderFields({
      value: '样式',
      bold: true,
      color: '#ff0000',
      textDecoration: { style: 'wavy' as any }
    }),
    withRenderFields({
      type: ElementType.HYPERLINK,
      value: '',
      url: 'https://example.com',
      hyperlinkId: 'link-1',
      valueList: [withRenderFields({ value: '链接文字' })]
    }),
    withRenderFields({
      type: ElementType.TITLE,
      value: '',
      level: TitleLevel.FIRST,
      titleId: 'title-1',
      valueList: [withRenderFields({ value: '标题文字' })]
    }),
    withRenderFields({
      type: ElementType.LIST,
      value: '',
      listType: ListType.OL,
      listId: 'list-1',
      valueList: [withRenderFields({ value: '列表项' })]
    }),
    withRenderFields({
      type: ElementType.CHECKBOX,
      value: '',
      checkbox: { value: false, code: 'yes' }
    }),
    withRenderFields({
      type: ElementType.RADIO,
      value: '',
      radio: { value: true, code: 'on' }
    }),
    withRenderFields({
      type: ElementType.DATE,
      value: '',
      dateFormat: 'yyyy-MM-dd',
      dateId: 'date-1',
      valueList: [{ value: '2026' }, { value: '-' }, { value: '09' }]
    }),
    withRenderFields({
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 100 }, { width: 100 }],
      trList: [
        {
          id: 'tr-1',
          height: 40,
          tdList: [
            {
              id: 'td-1',
              colspan: 1,
              rowspan: 1,
              value: [withRenderFields({ value: '单元格' })]
            },
            {
              id: 'td-2',
              colspan: 1,
              rowspan: 1,
              value: [{ value: '' }]
            }
          ]
        }
      ]
    }),
    // 控件 prefix/value/postfix 共享同一 control 对象引用
    withRenderFields({
      type: ElementType.CONTROL,
      value: '',
      control,
      controlId: 'control-1',
      controlComponent: ControlComponent.PREFIX
    }),
    withRenderFields({
      type: ElementType.CONTROL,
      value: '控件值',
      control,
      controlId: 'control-1',
      controlComponent: ControlComponent.VALUE
    }),
    withRenderFields({
      type: ElementType.CONTROL,
      value: '',
      control,
      controlId: 'control-1',
      controlComponent: ControlComponent.POSTFIX
    }),
    withRenderFields({
      type: ElementType.IMAGE,
      value: '',
      width: 100,
      height: 100,
      imgDisplay: ImageDisplay.INLINE,
      imgFloatPosition: { x: 1, y: 2, pageNo: 0 },
      imgCrop: { x: 0, y: 0, width: 10, height: 10 }
    }),
    withRenderFields({
      type: ElementType.SEPARATOR,
      value: '',
      dashArray: [1, 2]
    }),
    withRenderFields({ value: '分组', groupIds: ['g1', 'g2'] }),
    withRenderFields({
      value: '留痕',
      trace: [{ type: TraceType.INSERTED, author: 'a', timestamp: 1 }]
    }),
    // extension 为 unknown 类型，可能是任意嵌套对象
    withRenderFields({
      value: '扩展',
      extension: { nested: { count: 1 }, tags: ['x'] }
    })
  ]
}

function findByType(list: IElement[], type: ElementType): IElement {
  return list.find(el => el.type === type)!
}

describe('getSlimCloneElementList', () => {
  it('与 deepCloneOmitKeys 历史实现结果完全一致', () => {
    const list = createComplexElementList()
    const expected = deepCloneOmitKeys<IElement[], any>(list, [
      'metrics',
      'style'
    ])
    expect(getSlimCloneElementList(list)).toEqual(expected)
  })

  it('剔除渲染期回填的 metrics/style 字段（含嵌套层级）', () => {
    const list = createComplexElementList()
    const snapshot = getSlimCloneElementList(list)
    const table = findByType(snapshot, ElementType.TABLE) as any
    expect(table.metrics).toBeUndefined()
    expect(table.style).toBeUndefined()
    // 排版时 left 字段也会被回填，历史实现保留该字段
    expect(table.left).toBe(0)
    const cellText = table.trList[0].tdList[0].value[0]
    expect(cellText.metrics).toBeUndefined()
    expect(cellText.style).toBeUndefined()
    // textDecoration 内层的 style 键同样被剔除（与历史行为一致）
    const styled = snapshot[1]
    expect(styled.textDecoration).toEqual({})
  })

  it('克隆后修改原元素列表（含嵌套结构）不污染快照', () => {
    const list = createComplexElementList()
    const snapshot = getSlimCloneElementList(list)
    const expected = deepCloneOmitKeys<IElement[], any>(list, [
      'metrics',
      'style'
    ])
    // 快照完成后继续编辑：原地修改各种嵌套可变结构
    list[0].value = 'MUTATED'
    const hyperlink = findByType(list, ElementType.HYPERLINK)
    hyperlink.valueList![0].value = 'MUTATED'
    const title = findByType(list, ElementType.TITLE)
    title.valueList![0].value = 'MUTATED'
    const listEl = findByType(list, ElementType.LIST)
    listEl.valueList![0].value = 'MUTATED'
    const checkbox = findByType(list, ElementType.CHECKBOX)
    checkbox.checkbox!.value = true
    const radio = findByType(list, ElementType.RADIO)
    radio.radio!.value = false
    const date = findByType(list, ElementType.DATE)
    date.valueList!.push({ value: 'MUTATED' })
    const table = findByType(list, ElementType.TABLE)
    table.trList![0].tdList[0].value![0].value = 'MUTATED'
    table.colgroup![0].width = 999
    const control = findByType(list, ElementType.CONTROL).control!
    control.value![0].value = 'MUTATED'
    const controlRaw = control as any
    controlRaw.placeholder = 'MUTATED'
    const image = findByType(list, ElementType.IMAGE)
    image.imgFloatPosition!.x = 999
    image.imgCrop!.width = 999
    const separator = findByType(list, ElementType.SEPARATOR)
    separator.dashArray!.push(3)
    list[14].groupIds!.push('g3')
    list[15].trace!.push({ type: TraceType.DELETED })
    const extension = list[16].extension as any
    extension.nested.count = 2
    extension.tags.push('y')
    // 渲染期字段继续被排版改写
    const tableRaw = table as any
    tableRaw.metrics.width = 9999
    const firstRaw = list[0] as any
    firstRaw.newProp = { a: 1 }
    // 快照不受任何影响
    expect(snapshot).toEqual(expected)
    // 快照与原列表不共享任何嵌套引用
    const snapshotTable = findByType(snapshot, ElementType.TABLE)
    expect(snapshotTable.trList).not.toBe(table.trList)
    expect(snapshotTable.trList![0].tdList).not.toBe(
      table.trList![0].tdList
    )
    expect(findByType(snapshot, ElementType.CONTROL).control).not.toBe(
      control
    )
    expect(findByType(snapshot, ElementType.CHECKBOX).checkbox).not.toBe(
      checkbox.checkbox
    )
  })

  it('性能对比：9.9 万元素文档克隆耗时（仅输出，不断言）', () => {
    const size = 99000
    const list: IElement[] = []
    for (let i = 0; i < size; i++) {
      if (i % 2000 === 1999) {
        list.push(
          withRenderFields({
            type: ElementType.TABLE,
            value: '',
            colgroup: [{ width: 100 }],
            trList: [
              {
                id: `tr-${i}`,
                height: 40,
                tdList: [
                  {
                    id: `td-${i}`,
                    colspan: 1,
                    rowspan: 1,
                    value: [withRenderFields({ value: '格' })]
                  }
                ]
              }
            ]
          })
        )
      } else if (i % 500 === 499) {
        list.push(
          withRenderFields({
            type: ElementType.CONTROL,
            value: '控件',
            control: {
              type: ControlType.TEXT,
              value: [{ value: '控件' }]
            } as any,
            controlId: `control-${i}`,
            controlComponent: ControlComponent.VALUE
          })
        )
      } else if (i % 300 === 299) {
        list.push(
          withRenderFields({
            type: ElementType.CHECKBOX,
            value: '',
            checkbox: { value: false }
          })
        )
      } else {
        list.push(
          withRenderFields({
            value: '文',
            font: 'Microsoft YaHei',
            size: 16,
            color: '#000000'
          })
        )
      }
    }
    const omitKeys = ['metrics', 'style']
    // 预热，避免 JIT 编译计入单次耗时
    deepCloneOmitKeys(list, omitKeys)
    getSlimCloneElementList(list)
    const runs = 5
    let oldTotal = 0
    let newTotal = 0
    let oldResult: IElement[] = []
    let newResult: IElement[] = []
    for (let r = 0; r < runs; r++) {
      const oldStart = performance.now()
      oldResult = deepCloneOmitKeys(list, omitKeys)
      oldTotal += performance.now() - oldStart
      const newStart = performance.now()
      newResult = getSlimCloneElementList(list)
      newTotal += performance.now() - newStart
    }
    console.log(
      `[getSlimCloneElementList] ${size} 元素 x ${runs} 次平均: ` +
        `deepCloneOmitKeys ${(oldTotal / runs).toFixed(2)}ms -> ` +
        `专用克隆 ${(newTotal / runs).toFixed(2)}ms`
    )
    expect(newResult.length).toBe(size)
    // 抽样确认结果一致（全量 toEqual 在 9.9 万元素上过慢）
    for (const i of [0, 299, 499, 1999, size - 1]) {
      expect(newResult[i]).toEqual(oldResult[i])
    }
  })
})
