import { TraceType } from '../dataset/enum/Trace'
import { ElementType } from '../dataset/enum/Element'
import { IElement } from '../interface/Element'
import { ITr } from '../interface/table/Tr'
import { deepClone } from '.'
import { isTextElement } from './element'

export interface IDiffOp {
  type: 'equal' | 'insert' | 'delete'
  value: string
}

interface IMiddleSnake {
  // 中间蛇起点与终点（相对当前片段的坐标）
  x: number
  y: number
  u: number
  v: number
  // 总编辑距离
  d: number
}

interface ITextChar {
  elementIndex: number
  char: string
}

interface IAnchorUnit {
  // 同一锚点的连续元素（控件前后缀形式时一个控件对应多个元素）
  elements: IElement[]
  // 稳定配对标识
  key: string | null
}

interface IDocumentTokens {
  // 以非文本元素为界切分的文本片段（记录每个字符所属的元素索引）
  segments: ITextChar[][]
  // 非文本元素（锚点）
  anchors: IAnchorUnit[]
}

function pushOp(ops: IDiffOp[], type: IDiffOp['type'], value: string) {
  if (!value) return
  const last = ops[ops.length - 1]
  if (last && last.type === type) {
    last.value += value
  } else {
    ops.push({ type, value })
  }
}

// Myers O(ND) 差分算法线性空间分治所需的"中间蛇"
// 参考：An O(ND) Difference Algorithm and Its Variations (Myers, 1986)
function findMiddleSnake(a: string[], b: string[]): IMiddleSnake {
  const n = a.length
  const m = b.length
  const max = Math.ceil((n + m) / 2)
  const delta = n - m
  const offset = max
  const vf: number[] = new Array(2 * max + 1).fill(0)
  const vb: number[] = new Array(2 * max + 1).fill(0)
  for (let d = 0; d <= max; d++) {
    // 正向：从 (0, 0) 出发沿对角线搜索
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && vf[k - 1 + offset] < vf[k + 1 + offset])
          ? vf[k + 1 + offset]
          : vf[k - 1 + offset] + 1
      let y = x - k
      const sx = x
      const sy = y
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      vf[k + offset] = x
      // 总编辑距离为奇数时，正向路径可能与反向路径重叠
      if (delta % 2 !== 0) {
        const bk = k - delta
        if (bk >= 1 - d && bk <= d - 1 && x + vb[bk + offset] >= n) {
          return { x: sx, y: sy, u: x, v: y, d: 2 * d - 1 }
        }
      }
    }
    // 反向：从 (n, m) 出发沿对角线搜索，k 为相对 delta 的偏移
    for (let k = -d; k <= d; k += 2) {
      // 从 k-1 对角线"向上"移动（消耗 b，x 不变）；
      // 或从 k+1 对角线"向左"移动（消耗 a，x + 1），取走得更远者
      let x: number
      if (k === d) {
        x = vb[k - 1 + offset]
      } else if (k === -d) {
        x = vb[k + 1 + offset] + 1
      } else {
        x = Math.max(vb[k - 1 + offset], vb[k + 1 + offset] + 1)
      }
      let y = x + k
      const sx = x
      const sy = y
      while (x < n && y >= 0 && y < m && a[n - 1 - x] === b[m - 1 - y]) {
        x++
        y++
      }
      vb[k + offset] = x
      // 总编辑距离为偶数时，反向路径可能与正向路径重叠
      if (delta % 2 === 0) {
        const fk = k + delta
        if (fk >= -d && fk <= d && x + vf[fk + offset] >= n) {
          // 反向坐标转换回正向坐标：蛇从 (n-x, m-y) 到 (n-sx, m-sy)
          return { x: n - x, y: m - y, u: n - sx, v: m - sy, d: 2 * d }
        }
      }
    }
  }
  return { x: 0, y: 0, u: n, v: m, d: n + m }
}

function diffInternal(
  a: string[],
  aStart: number,
  aEnd: number,
  b: string[],
  bStart: number,
  bEnd: number,
  ops: IDiffOp[]
) {
  // 去除公共前缀
  let prefix = 0
  while (
    aStart + prefix < aEnd &&
    bStart + prefix < bEnd &&
    a[aStart + prefix] === b[bStart + prefix]
  ) {
    prefix++
  }
  if (prefix) {
    pushOp(ops, 'equal', a.slice(aStart, aStart + prefix).join(''))
  }
  aStart += prefix
  bStart += prefix
  // 去除公共后缀
  let suffix = 0
  while (
    aEnd - 1 - suffix >= aStart &&
    bEnd - 1 - suffix >= bStart &&
    a[aEnd - 1 - suffix] === b[bEnd - 1 - suffix]
  ) {
    suffix++
  }
  const aMidEnd = aEnd - suffix
  const bMidEnd = bEnd - suffix
  if (aStart >= aMidEnd) {
    pushOp(ops, 'insert', b.slice(bStart, bMidEnd).join(''))
  } else if (bStart >= bMidEnd) {
    pushOp(ops, 'delete', a.slice(aStart, aMidEnd).join(''))
  } else {
    const aMid = a.slice(aStart, aMidEnd)
    const bMid = b.slice(bStart, bMidEnd)
    const snake = findMiddleSnake(aMid, bMid)
    if (snake.d <= 1) {
      // 去除公共前后缀后不会出现编辑距离小于 2 的情况，兜底按整体替换处理
      pushOp(ops, 'delete', aMid.join(''))
      pushOp(ops, 'insert', bMid.join(''))
    } else {
      diffInternal(
        a,
        aStart,
        aStart + snake.x,
        b,
        bStart,
        bStart + snake.y,
        ops
      )
      if (snake.u !== snake.x || snake.v !== snake.y) {
        pushOp(ops, 'equal', aMid.slice(snake.x, snake.u).join(''))
      }
      diffInternal(
        a,
        aStart + snake.u,
        aMidEnd,
        b,
        bStart + snake.v,
        bMidEnd,
        ops
      )
    }
  }
  if (suffix) {
    pushOp(ops, 'equal', a.slice(aMidEnd, aEnd).join(''))
  }
}

// 字符级对比两段文本，输出操作序列
export function diffText(oldText: string, newText: string): IDiffOp[] {
  const a = [...oldText]
  const b = [...newText]
  const ops: IDiffOp[] = []
  diffInternal(a, 0, a.length, b, 0, b.length, ops)
  return ops
}

// 段落切分：以换行符分隔并保留换行符
function splitLines(text: string): string[] {
  const parts = text.split('\n')
  return parts.map((part, i) => (i < parts.length - 1 ? `${part}\n` : part))
}

// 文本相似度：单字符与 bigram 多重集合 Dice 系数取较大者（兼顾超短文本）
function textSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const dice = (size: number): number => {
    if (a.length < size || b.length < size) return 0
    const grams = new Map<string, number>()
    for (let i = 0; i <= a.length - size; i++) {
      const gram = a.slice(i, i + size)
      grams.set(gram, (grams.get(gram) || 0) + 1)
    }
    let overlap = 0
    for (let i = 0; i <= b.length - size; i++) {
      const gram = b.slice(i, i + size)
      const count = grams.get(gram) || 0
      if (count > 0) {
        overlap++
        grams.set(gram, count - 1)
      }
    }
    return (2 * overlap) / (a.length - size + 1 + (b.length - size + 1))
  }
  return Math.max(dice(1), dice(2))
}

// 行级"修改块"内按位置配对的行，相似度高则细化为字符级对比，
// 其余保持整行新增/删除，保证输出可读性
const LINE_SIMILARITY_THRESHOLD = 0.5

function refineChangedLines(
  ops: IDiffOp[],
  deletedText: string,
  insertedText: string
) {
  const deletedLines = splitLines(deletedText)
  const insertedLines = splitLines(insertedText)
  const count = Math.max(deletedLines.length, insertedLines.length)
  for (let i = 0; i < count; i++) {
    const oldLine = deletedLines[i]
    const newLine = insertedLines[i]
    if (
      oldLine !== undefined &&
      newLine !== undefined &&
      (oldLine === newLine ||
        textSimilarity(oldLine, newLine) >= LINE_SIMILARITY_THRESHOLD)
    ) {
      for (const op of diffText(oldLine, newLine)) {
        pushOp(ops, op.type, op.value)
      }
    } else {
      if (oldLine !== undefined) pushOp(ops, 'delete', oldLine)
      if (newLine !== undefined) pushOp(ops, 'insert', newLine)
    }
  }
}

// 层级对比：先按段落（换行符分隔）对齐，段落级判为"修改"的行对
// 再做字符级对比；无换行的文本直接字符级对比
function diffTextHierarchical(oldText: string, newText: string): IDiffOp[] {
  if (!oldText.includes('\n') && !newText.includes('\n')) {
    return diffText(oldText, newText)
  }
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  const lineOps: IDiffOp[] = []
  diffInternal(
    oldLines,
    0,
    oldLines.length,
    newLines,
    0,
    newLines.length,
    lineOps
  )
  const ops: IDiffOp[] = []
  for (let i = 0; i < lineOps.length; i++) {
    const op = lineOps[i]
    const next = lineOps[i + 1]
    if (op.type === 'delete' && next?.type === 'insert') {
      refineChangedLines(ops, op.value, next.value)
      i++
    } else if (op.type === 'insert' && next?.type === 'delete') {
      refineChangedLines(ops, next.value, op.value)
      i++
    } else {
      pushOp(ops, op.type, op.value)
    }
  }
  return ops
}

// 锚点的稳定配对标识：控件 conceptId/controlId、列表 listId、
// 标题 titleId、超链接 url（conceptId 优先：controlId 经编辑器往返会重建）
function getAnchorKey(elements: IElement[]): string | null {
  const element = elements[0]
  const controlKey = element.control?.conceptId || element.controlId
  if (controlKey) return `control:${controlKey}`
  if (element.type === ElementType.LIST && element.listId) {
    return `list:${element.listId}`
  }
  if (element.type === ElementType.TITLE && element.titleId) {
    return `title:${element.titleId}`
  }
  if (element.type === ElementType.HYPERLINK && element.url) {
    return `hyperlink:${element.url}`
  }
  return null
}

function tokenize(elementList: IElement[]): IDocumentTokens {
  const segments: ITextChar[][] = [[]]
  const anchors: IAnchorUnit[] = []
  elementList.forEach((element, index) => {
    if (isTextElement(element)) {
      if (!element.value) return
      for (const char of element.value) {
        segments[segments.length - 1].push({ elementIndex: index, char })
      }
      return
    }
    // 与前一锚点共享 controlId 且中间无文本：同一控件，并入其锚点整体
    const lastAnchor = anchors[anchors.length - 1]
    if (
      element.controlId &&
      lastAnchor &&
      !segments[segments.length - 1].length &&
      lastAnchor.elements[0].controlId === element.controlId
    ) {
      lastAnchor.elements.push(element)
      return
    }
    const unit: IAnchorUnit = { elements: [element], key: null }
    unit.key = getAnchorKey(unit.elements)
    anchors.push(unit)
    segments.push([])
  })
  return { segments, anchors }
}

// 将一组连续字符按所属元素合并输出，traceType 存在时追加留痕记录
function appendElements(
  result: IElement[],
  sourceList: IElement[],
  chars: ITextChar[],
  traceType?: TraceType
) {
  let group: ITextChar[] = []
  const flush = () => {
    if (!group.length) return
    const element = sourceList[group[0].elementIndex]
    const clone: IElement = {
      ...element,
      value: group.map(c => c.char).join('')
    }
    if (traceType) {
      clone.trace = [...(element.trace || []), { type: traceType }]
    }
    result.push(clone)
    group = []
  }
  for (const char of chars) {
    if (group.length && char.elementIndex !== group[0].elementIndex) {
      flush()
    }
    group.push(char)
  }
  flush()
}

// 给整棵元素子树追加留痕记录（未配对锚点整体新增/删除时使用）
function markElementTree(elementList: IElement[], type: TraceType) {
  for (const element of elementList) {
    const records = element.trace || []
    if (records[records.length - 1]?.type !== type) {
      element.trace = [...records, { type }]
    }
    if (element.control?.value) {
      markElementTree(element.control.value, type)
    }
    if (element.valueList) {
      markElementTree(element.valueList, type)
    }
    for (const tr of element.trList || []) {
      for (const td of tr.tdList) {
        markElementTree(td.value, type)
      }
    }
  }
}

// 表格内容对比：行、单元格按下标配对，单元格内容递归对比
function mergeTableTrList(
  oldTrList: ITr[] | undefined,
  newTrList: ITr[] | undefined
): ITr[] {
  const oldList = oldTrList || []
  const newList = newTrList || []
  const result: ITr[] = []
  const rowCount = Math.min(oldList.length, newList.length)
  for (let r = 0; r < rowCount; r++) {
    const newTr = newList[r]
    const oldTdList = oldList[r].tdList
    const newTdList = newTr.tdList
    const tdCount = Math.min(oldTdList.length, newTdList.length)
    for (let d = 0; d < tdCount; d++) {
      newTdList[d].value = compareElementListInternal(
        oldTdList[d].value,
        newTdList[d].value
      )
    }
    // 多余单元格：旧版本标记删除，新版本标记新增
    for (let d = tdCount; d < oldTdList.length; d++) {
      markElementTree(oldTdList[d].value, TraceType.DELETED)
      newTr.tdList.push(oldTdList[d])
    }
    for (let d = tdCount; d < newTdList.length; d++) {
      markElementTree(newTdList[d].value, TraceType.INSERTED)
    }
    result.push(newTr)
  }
  // 多余行：旧版本整行标记删除，新版本整行标记新增
  for (let r = rowCount; r < oldList.length; r++) {
    for (const td of oldList[r].tdList) {
      markElementTree(td.value, TraceType.DELETED)
    }
    result.push(oldList[r])
  }
  for (let r = rowCount; r < newList.length; r++) {
    for (const td of newList[r].tdList) {
      markElementTree(td.value, TraceType.INSERTED)
    }
    result.push(newList[r])
  }
  return result
}

// 配对锚点的递归合并：以新版本元素为基准，子内容为新旧递归对比结果
function mergeAnchorUnit(
  oldUnit: IAnchorUnit,
  newUnit: IAnchorUnit
): IElement[] {
  const oldElement = oldUnit.elements[0]
  const newElement = newUnit.elements[0]
  const isSingleUnit =
    oldUnit.elements.length === 1 && newUnit.elements.length === 1
  if (isSingleUnit && oldElement.type === newElement.type) {
    if (newElement.type === ElementType.CONTROL && newElement.control) {
      newElement.control = {
        ...newElement.control,
        value: compareElementListInternal(
          oldElement.control?.value || [],
          newElement.control.value || []
        )
      }
      return [newElement]
    }
    if (oldElement.valueList || newElement.valueList) {
      newElement.valueList = compareElementListInternal(
        oldElement.valueList || [],
        newElement.valueList || []
      )
      return [newElement]
    }
    if (oldElement.trList || newElement.trList) {
      newElement.trList = mergeTableTrList(oldElement.trList, newElement.trList)
      return [newElement]
    }
  }
  // 无法递归时（多元素控件整体、类型不一致等）以新版本为准
  return newUnit.elements
}

// 锚点内容指纹：收集锚点内全部嵌套文本
function getAnchorText(unit: IAnchorUnit): string {
  let text = ''
  const walk = (elementList: IElement[]) => {
    for (const element of elementList) {
      text += element.value || ''
      if (element.control?.value) walk(element.control.value)
      if (element.valueList) walk(element.valueList)
      for (const tr of element.trList || []) {
        for (const td of tr.tdList) walk(td.value)
      }
    }
  }
  walk(unit.elements)
  return text
}

// 锚点配对权重：稳定标识相等权重最高（2）；
// 标识缺失或冲突时回退内容指纹相似度（1），类型不同不可配对（0）
const ANCHOR_SIMILARITY_THRESHOLD = 0.5

function anchorPairWeight(
  a: IAnchorUnit,
  b: IAnchorUnit,
  textA: string,
  textB: string
): number {
  if (a.key && b.key && a.key === b.key) return 2
  if (a.elements[0].type !== b.elements[0].type) return 0
  if (!textA && !textB) {
    // 无内容锚点（如图片、空控件）：标识冲突时不配对，否则同类型即可配对
    return a.key && b.key ? 0 : 1
  }
  return textSimilarity(textA, textB) >= ANCHOR_SIMILARITY_THRESHOLD ? 1 : 0
}

// 锚点配对：加权 LCS 求最优单调匹配，
// 一个锚点的增删不会影响其余锚点的配对（无级联错配）
function pairAnchors(
  oldAnchors: IAnchorUnit[],
  newAnchors: IAnchorUnit[]
): Map<number, number> {
  const n = oldAnchors.length
  const m = newAnchors.length
  // 预计算内容指纹，避免 DP 过程中重复遍历同一锚点子树（O(n·m) 次）
  const oldTexts = oldAnchors.map(getAnchorText)
  const newTexts = newAnchors.map(getAnchorText)
  const weights: number[][] = []
  const dp: number[][] = []
  for (let i = 0; i <= n; i++) {
    weights.push(new Array(m + 1).fill(0))
    dp.push(new Array(m + 1).fill(0))
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const weight = anchorPairWeight(
        oldAnchors[i - 1],
        newAnchors[j - 1],
        oldTexts[i - 1],
        newTexts[j - 1]
      )
      weights[i][j] = weight
      dp[i][j] = Math.max(
        dp[i - 1][j],
        dp[i][j - 1],
        weight > 0 ? dp[i - 1][j - 1] + weight : 0
      )
    }
  }
  // 回溯取出配选对（newIndex -> oldIndex）
  const pairs = new Map<number, number>()
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const weight = weights[i][j]
    if (weight > 0 && dp[i][j] === dp[i - 1][j - 1] + weight) {
      pairs.set(j - 1, i - 1)
      i--
      j--
    } else if (dp[i][j] === dp[i - 1][j]) {
      i--
    } else {
      j--
    }
  }
  return pairs
}

// 对比两段文本片段并输出合并结果
function emitSegmentDiff(
  result: IElement[],
  oldData: IElement[],
  newData: IElement[],
  oldChars: ITextChar[],
  newChars: ITextChar[]
) {
  const ops = diffTextHierarchical(
    oldChars.map(c => c.char).join(''),
    newChars.map(c => c.char).join('')
  )
  let oldOffset = 0
  let newOffset = 0
  for (const op of ops) {
    const length = [...op.value].length
    if (op.type === 'equal') {
      appendElements(
        result,
        newData,
        newChars.slice(newOffset, newOffset + length)
      )
      oldOffset += length
      newOffset += length
    } else if (op.type === 'insert') {
      appendElements(
        result,
        newData,
        newChars.slice(newOffset, newOffset + length),
        TraceType.INSERTED
      )
      newOffset += length
    } else {
      appendElements(
        result,
        oldData,
        oldChars.slice(oldOffset, oldOffset + length),
        TraceType.DELETED
      )
      oldOffset += length
    }
  }
}

function compareElementListInternal(
  oldData: IElement[],
  newData: IElement[]
): IElement[] {
  const oldTokens = tokenize(oldData)
  const newTokens = tokenize(newData)
  // 锚点配对：加权 LCS 求最优单调匹配
  const pairNewToOld = pairAnchors(oldTokens.anchors, newTokens.anchors)
  const oldMatched = new Set(pairNewToOld.values())
  // 以新版本锚点顺序为主轴输出合并结果
  const result: IElement[] = []
  let oldCursor = 0
  const emitDeletedAnchor = (oldIndex: number) => {
    appendElements(
      result,
      oldData,
      oldTokens.segments[oldIndex] || [],
      TraceType.DELETED
    )
    const unit = oldTokens.anchors[oldIndex]
    markElementTree(unit.elements, TraceType.DELETED)
    result.push(...unit.elements)
  }
  for (let j = 0; j < newTokens.anchors.length; j++) {
    const i = pairNewToOld.get(j)
    if (i === undefined) {
      // 未配对的新锚点：前置文本与子树整体标记新增
      appendElements(
        result,
        newData,
        newTokens.segments[j] || [],
        TraceType.INSERTED
      )
      const unit = newTokens.anchors[j]
      markElementTree(unit.elements, TraceType.INSERTED)
      result.push(...unit.elements)
      continue
    }
    // 配对锚点之前未配对的旧锚点：整体标记删除
    while (oldCursor < i) {
      if (!oldMatched.has(oldCursor)) {
        emitDeletedAnchor(oldCursor)
      }
      oldCursor++
    }
    oldCursor = i + 1
    // 配对锚点：前置文本片段对比，锚点子内容递归合并
    emitSegmentDiff(
      result,
      oldData,
      newData,
      oldTokens.segments[i] || [],
      newTokens.segments[j] || []
    )
    result.push(...mergeAnchorUnit(oldTokens.anchors[i], newTokens.anchors[j]))
  }
  // 剩余未配对的旧锚点
  while (oldCursor < oldTokens.anchors.length) {
    if (!oldMatched.has(oldCursor)) {
      emitDeletedAnchor(oldCursor)
    }
    oldCursor++
  }
  // 尾部文本片段
  emitSegmentDiff(
    result,
    oldData,
    newData,
    oldTokens.segments[oldTokens.anchors.length] || [],
    newTokens.segments[newTokens.anchors.length] || []
  )
  return result
}

// 对比两份文档元素列表，返回带留痕记录的合并结果：
// 相同内容原样保留；新增内容追加 INSERTED 记录；删除内容追加 DELETED 记录。
// 非文本元素（控件、列表、标题、超链接、表格、图片等）作为锚点，
// 按加权 LCS 求最优单调配对（稳定标识 controlId/conceptId/listId/titleId/url
// 权重最高，同类型且内容相似度达标的锚点权重次之），避免单一锚点失配级联错配；
// 配对成功的锚点递归对比其子内容，未配对的锚点整棵子树标记新增或删除
export function compareElementList(
  oldList: IElement[],
  newList: IElement[]
): IElement[] {
  return compareElementListInternal(deepClone(oldList), deepClone(newList))
}
