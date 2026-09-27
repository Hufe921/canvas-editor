import { describe, it, expect } from 'vitest'
import { diffText, compareElementList, IDiffOp } from '@/editor/utils/diff'
import { getNonTraceElementList } from '@/editor/utils/element'
import { TraceType } from '@/editor/dataset/enum/Trace'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ListType } from '@/editor/dataset/enum/List'
import { IElement } from '@/editor/interface/Element'

// 朴素 DP 求 LCS 长度，用于验证 diff 最小编辑距离
function lcsLength(a: string[], b: string[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

function pick(ops: IDiffOp[], types: string[]): string {
  return ops
    .filter(op => types.includes(op.type))
    .map(op => op.value)
    .join('')
}

describe('diffText', () => {
  it('完全相同的文本输出 equal', () => {
    expect(diffText('你好世界', '你好世界')).toEqual([
      { type: 'equal', value: '你好世界' }
    ])
  })

  it('纯新增输出 equal + insert', () => {
    expect(diffText('你好', '你好世界')).toEqual([
      { type: 'equal', value: '你好' },
      { type: 'insert', value: '世界' }
    ])
  })

  it('纯删除输出 equal + delete', () => {
    expect(diffText('你好世界', '你好')).toEqual([
      { type: 'equal', value: '你好' },
      { type: 'delete', value: '世界' }
    ])
  })

  it('替换输出 insert + delete', () => {
    const ops = diffText('发热三天', '发热两天')
    expect(ops).toEqual([
      { type: 'equal', value: '发热' },
      { type: 'insert', value: '两' },
      { type: 'delete', value: '三' },
      { type: 'equal', value: '天' }
    ])
  })

  it('空字符串边界', () => {
    expect(diffText('', '')).toEqual([])
    expect(diffText('', 'abc')).toEqual([{ type: 'insert', value: 'abc' }])
    expect(diffText('abc', '')).toEqual([{ type: 'delete', value: 'abc' }])
  })

  it('随机字符串：可还原双方文本且编辑距离最小', () => {
    const charset = 'abcdefg你好世界\n'
    let seed = 42
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const randomText = (length: number) =>
      Array.from(
        { length },
        () => charset[Math.floor(random() * charset.length)]
      ).join('')
    for (let t = 0; t < 200; t++) {
      const a = randomText(Math.floor(random() * 40))
      const b = randomText(Math.floor(random() * 40))
      const ops = diffText(a, b)
      // equal + delete 还原旧文本；equal + insert 还原新文本
      expect(pick(ops, ['equal', 'delete'])).toBe(a)
      expect(pick(ops, ['equal', 'insert'])).toBe(b)
      // 编辑距离最小：insert + delete = N + M - 2 * LCS
      const editCount = ops
        .filter(op => op.type !== 'equal')
        .reduce((sum, op) => sum + [...op.value].length, 0)
      const minEdit =
        [...a].length + [...b].length - 2 * lcsLength([...a], [...b])
      expect(editCount).toBe(minEdit)
    }
  })
})

describe('compareElementList', () => {
  const toElements = (text: string): IElement[] =>
    [...text].map(value => ({ value }))

  it('相同文档原样输出且无留痕记录', () => {
    const oldList = toElements('你好')
    const result = compareElementList(oldList, toElements('你好'))
    expect(result.map(e => e.value).join('')).toBe('你好')
    expect(result.every(e => !e.trace)).toBe(true)
  })

  it('新增内容追加 INSERTED 留痕记录', () => {
    const result = compareElementList(
      toElements('你好'),
      toElements('你好世界')
    )
    expect(result.map(e => e.value).join('')).toBe('你好世界')
    const inserted = result.filter(e =>
      e.trace?.some(record => record.type === TraceType.INSERTED)
    )
    expect(inserted.map(e => e.value).join('')).toBe('世界')
  })

  it('删除内容保留旧元素并追加 DELETED 留痕记录', () => {
    const result = compareElementList(
      toElements('你好世界'),
      toElements('你好')
    )
    expect(result.map(e => e.value).join('')).toBe('你好世界')
    const deleted = result.filter(e =>
      e.trace?.some(record => record.type === TraceType.DELETED)
    )
    expect(deleted.map(e => e.value).join('')).toBe('世界')
  })

  it('非文本元素作为锚点原样保留', () => {
    const anchor: IElement = {
      value: '',
      type: 'image' as never,
      width: 10,
      height: 10
    }
    const result = compareElementList(
      [...toElements('前文'), anchor, ...toElements('后文')],
      [...toElements('前文'), anchor, ...toElements('后文补充')]
    )
    const anchorIndex = result.findIndex(e => e.type === anchor.type)
    expect(anchorIndex).toBe(2)
    expect(result.map(e => e.value).join('')).toBe('前文后文补充')
  })

  it('不污染入参', () => {
    const oldList = toElements('你好世界')
    const newList = toElements('你好')
    compareElementList(oldList, newList)
    expect(oldList).toEqual(toElements('你好世界'))
    expect(newList).toEqual(toElements('你好'))
  })
})

describe('compareElementList-嵌套结构', () => {
  const toElements = (text: string): IElement[] =>
    [...text].map(value => ({ value }))

  const toControl = (id: string, text: string): IElement => ({
    type: ElementType.CONTROL,
    value: '',
    controlId: id,
    control: {
      type: ControlType.TEXT,
      value: text ? toElements(text) : null
    }
  })

  const toList = (id: string, text: string): IElement => ({
    type: ElementType.LIST,
    value: '',
    listId: id,
    listType: ListType.OL,
    valueList: toElements(text)
  })

  const toLink = (url: string, text: string): IElement => ({
    type: ElementType.HYPERLINK,
    value: '',
    url,
    valueList: toElements(text)
  })

  const toTable = (text: string): IElement => ({
    type: ElementType.TABLE,
    value: '',
    trList: [
      {
        height: 30,
        tdList: [{ colspan: 1, rowspan: 1, value: toElements(text) }]
      }
    ]
  })

  const traceText = (list: IElement[], type: TraceType) =>
    list
      .filter(e => e.trace?.some(record => record.type === type))
      .map(e => e.value)
      .join('')

  it('控件内值修改：子元素带 INSERTED/DELETED 记录', () => {
    const result = compareElementList(
      [toControl('c1', '张三')],
      [toControl('c1', '李四')]
    )
    expect(result).toHaveLength(1)
    expect(result[0].controlId).toBe('c1')
    const value = result[0].control!.value!
    expect(traceText(value, TraceType.INSERTED)).toBe('李四')
    expect(traceText(value, TraceType.DELETED)).toBe('张三')
  })

  it('控件值从无到有：新值整体标记 INSERTED', () => {
    const result = compareElementList(
      [toControl('c1', '')],
      [toControl('c1', '补充内容')]
    )
    const value = result[0].control!.value!
    expect(traceText(value, TraceType.INSERTED)).toBe('补充内容')
  })

  it('列表项增删：新增项标记 INSERTED', () => {
    const result = compareElementList(
      [toList('l1', '苹果\n香蕉')],
      [toList('l1', '苹果\n香蕉\n橙子')]
    )
    const valueList = result[0].valueList!
    expect(traceText(valueList, TraceType.INSERTED)).toContain('橙子')
    expect(
      valueList
        .filter(e => !e.trace)
        .map(e => e.value)
        .join('')
    ).toBe('苹果\n香蕉')
  })

  it('超链接文字修改：valueList 带 INSERTED/DELETED 记录', () => {
    const result = compareElementList(
      [toLink('https://hufe.club', '旧文字')],
      [toLink('https://hufe.club', '新文字')]
    )
    expect(result[0].url).toBe('https://hufe.club')
    const valueList = result[0].valueList!
    expect(traceText(valueList, TraceType.INSERTED)).toBe('新')
    expect(traceText(valueList, TraceType.DELETED)).toBe('旧')
  })

  it('表格单元格内容修改：单元格内递归对比', () => {
    const result = compareElementList([toTable('旧值')], [toTable('新值')])
    const value = result[0].trList![0].tdList[0].value
    expect(traceText(value, TraceType.INSERTED)).toBe('新')
    expect(traceText(value, TraceType.DELETED)).toBe('旧')
  })

  it('整个控件被删除：子树整体标记 DELETED', () => {
    const result = compareElementList([toControl('c1', '张三')], [])
    expect(result).toHaveLength(1)
    expect(
      result[0].trace?.some(record => record.type === TraceType.DELETED)
    ).toBe(true)
    expect(traceText(result[0].control!.value!, TraceType.DELETED)).toBe('张三')
  })

  it('整个列表新增：子树整体标记 INSERTED', () => {
    const result = compareElementList([], [toList('l1', '苹果\n香蕉')])
    expect(result).toHaveLength(1)
    expect(
      result[0].trace?.some(record => record.type === TraceType.INSERTED)
    ).toBe(true)
    expect(traceText(result[0].valueList!, TraceType.INSERTED)).toBe(
      '苹果\n香蕉'
    )
  })

  it('锚点按稳定标识配对：位置漂移仍能递归对比', () => {
    const image: IElement = {
      type: ElementType.IMAGE,
      value: '',
      width: 10,
      height: 10
    }
    const result = compareElementList(
      [image, toControl('c1', '张三')],
      [toControl('c1', '张四')]
    )
    // 图片未配对标记删除，控件按 controlId 配对并递归对比
    expect(
      result[0].trace?.some(record => record.type === TraceType.DELETED)
    ).toBe(true)
    const control = result.find(e => e.type === ElementType.CONTROL)!
    const value = control.control!.value!
    expect(traceText(value, TraceType.INSERTED)).toBe('四')
    expect(traceText(value, TraceType.DELETED)).toBe('三')
  })

  it('中段锚点删除不级联错配：其余锚点保持配对', () => {
    const image: IElement = {
      type: ElementType.IMAGE,
      value: '',
      width: 10,
      height: 10
    }
    const controlWithConcept = (id: string, text: string): IElement => ({
      type: ElementType.CONTROL,
      value: '',
      controlId: id,
      control: {
        type: ControlType.TEXT,
        conceptId: id,
        value: toElements(text)
      }
    })
    const oldList = [
      image,
      controlWithConcept('removed', '甲'),
      toList('l1', '苹果'),
      controlWithConcept('kept', '乙')
    ]
    const newList = [
      image,
      toList('l1', '苹果'),
      controlWithConcept('kept', '乙')
    ]
    const result = compareElementList(oldList, newList)
    // 图片、列表、保留控件均无留痕
    const clean = result.filter(e => !e.trace)
    expect(clean.map(e => e.type)).toContain(ElementType.IMAGE)
    expect(clean.map(e => e.type)).toContain(ElementType.LIST)
    const kept = result.find(e => e.control?.conceptId === 'kept')!
    expect(kept.trace).toBeUndefined()
    expect(kept.control!.value!.every(e => !e.trace)).toBe(true)
    // 仅被删控件整体标记 DELETED
    const removed = result.find(e => e.control?.conceptId === 'removed')!
    expect(
      removed.trace?.some(record => record.type === TraceType.DELETED)
    ).toBe(true)
    expect(traceText([removed], TraceType.INSERTED)).toBe('')
  })

  it('小改动文档：标记范围限于真实改动', () => {
    // 模拟 id 重建：旧文档无标识，新文档同类型锚点顺序一致但标识不同
    const oldList = [
      ...toElements('第一段内容。\n'),
      toLink('https://hufe.club', '链接文字'),
      ...toElements('\n第二段内容。\n'),
      toList('l1', '苹果\n香蕉'),
      ...toElements('\n第三段内容。')
    ]
    const newList = [
      ...toElements('第一段内容。\n'),
      toLink('https://hufe.club', '链接文字'),
      ...toElements('\n第二段内容有修改。\n'),
      toList('l2', '苹果\n香蕉'),
      ...toElements('\n第三段内容。')
    ]
    const result = compareElementList(oldList, newList)
    const inserted = traceText(result, TraceType.INSERTED)
    const deleted = traceText(result, TraceType.DELETED)
    // 仅"有修改"三字的改动被标记
    expect(inserted).toBe('有修改')
    expect(deleted).toBe('')
  })

  it('段落级对比：整行插入只标记新行', () => {
    const result = compareElementList(
      toElements('啊啊啊\n呜呜'),
      toElements('啊啊啊\n啦啦\n呜呜')
    )
    expect(traceText(result, TraceType.INSERTED)).toBe('啦啦\n')
    expect(traceText(result, TraceType.DELETED)).toBe('')
  })

  it('段落级对比：相似行配对后做字符级对比', () => {
    const result = compareElementList(
      toElements('患者病情稳定。\n出院。'),
      toElements('患者病情好转。\n出院。')
    )
    expect(traceText(result, TraceType.INSERTED)).toBe('好转')
    expect(traceText(result, TraceType.DELETED)).toBe('稳定')
  })

  it('幂等：清洗对比结果后与新版对比无任何标记', () => {
    const oldList = [
      ...toElements('第一段。\n'),
      toControl('c1', '张三'),
      ...toElements('\n第二段。')
    ]
    const newList = [
      ...toElements('第一段。\n'),
      toControl('c1', '张四'),
      ...toElements('\n第二段补充。')
    ]
    const round1 = compareElementList(oldList, newList)
    // 模拟保存后再次打开：剥离留痕作为新基线
    const cleaned = getNonTraceElementList(round1)
    const round2 = compareElementList(cleaned, newList)
    expect(traceText(round2, TraceType.INSERTED)).toBe('')
    expect(traceText(round2, TraceType.DELETED)).toBe('')
    // 嵌套结构同样无标记
    const control = round2.find(e => e.type === ElementType.CONTROL)!
    expect(control.trace).toBeUndefined()
    expect(control.control!.value!.every(e => !e.trace)).toBe(true)
  })
})
