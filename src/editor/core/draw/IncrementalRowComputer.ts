import { ZERO } from '../../dataset/constant/Common'
import { ElementType } from '../../dataset/enum/Element'
import type {
  IComputeRange,
  IComputeRowListPayload,
  IIncrementalRowListResult
} from '../../interface/Draw'
import type { IElement } from '../../interface/Element'
import type { IRow, IRowComputeState } from '../../interface/Row'
import type { Draw } from './Draw'

/**
 * 行级增量行计算器。
 *
 * 行边界是断行依赖链的重置点（行首 x 由容器状态决定），因此编辑只需从受影响行
 * 断点续算，与某个旧行结构状态收敛即停（通常 1~3 行），其后旧行原样复用。
 * y/pageNo 等位置状态不影响行内容，过期快照依然安全。
 *
 * 门控不满足时返回 null，调用方退回全量，行为与未开启时一致。
 */
export class IncrementalRowComputer {
  private draw: Draw
  // 行对象 -> 该行起始时刻的跨行状态快照（续算恢复点）
  private readonly snapshotMap: WeakMap<IRow, IRowComputeState>
  // 布局签名：变化意味着快照状态失效（缩放/边距/纸张/页眉页脚等）
  private lastLayoutSignature: string | null = null
  // 脏区间追踪：编辑对主文档元素列表的修改区间，由 render 消费并重置
  private dirtyElementList: IElement[] | null = null
  private dirtyStartIndex = Infinity
  private dirtyEndIndex = 0
  // 非 splice 类结构性修改（原地字段变更）：下次渲染强制全量计算
  private isLayoutDirty = false

  constructor(draw: Draw) {
    this.draw = draw
    this.snapshotMap = new WeakMap()
  }

  // 记录行起始状态快照。行首换行符自身的列表计数需回退，
  // 使快照描述行首元素参与计算前的状态
  public recordSnapshot(
    row: IRow,
    snapshot: IRowComputeState,
    firstElement?: IElement
  ) {
    if (
      firstElement?.listId &&
      firstElement.value === ZERO &&
      !firstElement.listWrap
    ) {
      const count = snapshot.listIndexMap.get(firstElement.listId)
      if (count === 0) {
        snapshot.listIndexMap.delete(firstElement.listId)
      } else if (count != null) {
        snapshot.listIndexMap.set(firstElement.listId, count - 1)
      }
    }
    this.snapshotMap.set(row, snapshot)
  }

  /**
   * 记录主文档元素列表的一次修改区间（脏区间，增量续算提示）。
   * splice/delete 助手自动记录；少数直接 splice 的场景需显式调用。
   */
  public markRangeDirty(
    elementList: IElement[],
    start: number,
    deleteCount: number,
    insertCount: number
  ) {
    // 非主文档列表（表格单元格/页眉页脚）的修改不参与
    if (elementList !== this.draw.getElementList()) return
    const netDelta = insertCount - deleteCount
    if (this.dirtyElementList !== elementList) {
      this.dirtyElementList = elementList
      this.dirtyStartIndex = start
      this.dirtyEndIndex = start + Math.max(deleteCount, insertCount, 1)
      return
    }
    // 合并既有脏区间（宁大勿小，大只多重算几行）：
    // 旧区间之前的修改使其整体平移；区间内部的插入使末端扩张
    if (start < this.dirtyStartIndex) {
      this.dirtyStartIndex += netDelta
      this.dirtyEndIndex += netDelta
    } else if (
      start > this.dirtyStartIndex &&
      start < this.dirtyEndIndex &&
      netDelta > 0
    ) {
      this.dirtyEndIndex += netDelta
    }
    this.dirtyStartIndex = Math.min(this.dirtyStartIndex, start)
    this.dirtyEndIndex = Math.max(
      this.dirtyEndIndex,
      start + Math.max(deleteCount, insertCount, 1)
    )
  }

  // 非 splice 类结构性修改（标题重组等原地字段变更）：下次渲染强制全量计算
  public markFullDirty() {
    this.isLayoutDirty = true
  }

  // 取出并重置本次编辑的脏区间（render 每次计算前调用）
  public consumeDirtyRange(): IComputeRange | undefined {
    const elementList = this.dirtyElementList
    const startIndex = this.dirtyStartIndex
    const endIndex = this.dirtyEndIndex
    const isFullyDirty = this.isLayoutDirty
    this.dirtyElementList = null
    this.dirtyStartIndex = Infinity
    this.dirtyEndIndex = 0
    this.isLayoutDirty = false
    if (
      isFullyDirty ||
      !elementList ||
      elementList !== this.draw.getElementList() ||
      !Number.isFinite(startIndex)
    ) {
      return undefined
    }
    return {
      startIndex: Math.max(startIndex, 0),
      // 余量覆盖缝后一个元素，防止收敛复用到受编辑波及的旧行
      endIndex: Math.min(endIndex + 1, elementList.length)
    }
  }

  // 行所在的页码；跨页表格拆分后行对象可能不在最终行列表中，
  // 返回 undefined 退化为全量位置计算
  public findPageNoOfRow(row: IRow): number | undefined {
    const pageRowList = this.draw.getPageRowList()
    for (let pageNo = 0; pageNo < pageRowList.length; pageNo++) {
      if (pageRowList[pageNo].includes(row)) return pageNo
    }
    return undefined
  }

  /**
   * 尝试增量计算。成功返回合并后的行列表与首个变动行
   * （拆分跨页表格前的原始行列表），失败返回 null（调用方走全量）。
   */
  public tryCompute(
    range: IComputeRange | undefined,
    payload: IComputeRowListPayload
  ): IIncrementalRowListResult | null {
    // 渲染载荷固定携带主文档元素列表；表格/页眉页脚上下文中的编辑不参与增量
    const elementList = payload.elementList
    const positionContext = this.draw.getPosition().getPositionContext()
    const zone = this.draw.getZone()
    const rawRowList = this.draw.getRawRowList()
    // 全局门控
    if (
      !range ||
      !this.draw.getOptions().lab.incrementalCompute ||
      positionContext?.isTable ||
      zone.isHeaderActive() ||
      zone.isFooterActive() ||
      !Number.isInteger(range.startIndex) ||
      !Number.isInteger(range.endIndex) ||
      range.startIndex < 0 ||
      range.endIndex > elementList.length ||
      range.startIndex >= range.endIndex ||
      rawRowList.length === 0 ||
      elementList.length === 0 ||
      // 分栏布局暂不增量（栏游标推进规则复杂）
      (this.draw.getColumnLayout()?.count || 1) > 1 ||
      // 存在浮动/环绕元素时行的可用宽度受页面位置影响，行封闭性被破坏
      (payload.surroundElementList?.length || 0) > 0 ||
      // 控件最小宽度占位会 splice 进元素列表，级联续算可能重复生成
      this.draw.getIsControlMinWidthPlaceholder() ||
      // 上次渲染发生过 maxPageNo 截断（elementList 被裁剪），行列表与元素失配
      this.draw.getIsElementListTruncated() ||
      // 布局签名变化：缩放/边距/纸张/页眉页脚等
      this.lastLayoutSignature === null ||
      this.lastLayoutSignature !== this.getLayoutSignature()
    ) {
      return null
    }
    // 定位续算行：取编辑点前一元素所在的行。编辑点恰好在行首时
    //（如段落末尾打字），新内容实际汇入前一行
    const startRowIdx = this._findRowIndexOfElement(
      rawRowList,
      Math.max(range.startIndex - 1, 0)
    )
    if (startRowIdx < 0) return null
    const resumeRow = rawRowList[startRowIdx]
    const resumeStart = resumeRow.startIndex
    const snapshot = this.snapshotMap.get(resumeRow)
    if (!snapshot) return null
    // 旧行首元素 -> 行序号：收敛锚点按对象身份定位（元素索引在编辑后已失效）
    const firstElementRowMap = new Map<IElement, number>()
    for (let i = startRowIdx + 1; i < rawRowList.length; i++) {
      const firstElement = rawRowList[i].elementList[0]
      if (firstElement) {
        firstElementRowMap.set(firstElement, i)
      }
    }
    // 断点续算：从受影响行重算，直至与旧行结构状态收敛或文档末尾
    let convergedOldRowIdx = -1
    let convergedStartIndex = -1
    let isAborted = false
    const preRow = startRowIdx > 0 ? rawRowList[startRowIdx - 1] : null
    const rows = this.draw.computeRowList({
      ...payload,
      resume: {
        startIndex: resumeStart,
        state: snapshot,
        preRowLastElement: preRow?.elementList[preRow.elementList.length - 1],
        shouldAbort: (element, index) => {
          // 级联超限时续算收益不再；复杂结构元素不参与增量
          if (
            index - resumeStart > IncrementalRowComputer.MAX_CASCADE_ELEMENT ||
            this._isComplexElement(element)
          ) {
            isAborted = true
            return true
          }
          return false
        },
        converge: (state, firstElement, startIndex) => {
          // 收敛行必须完整位于编辑区间之外：行首元素未变不代表行内容未变
          if (startIndex < range.endIndex) return false
          const oldRowIdx = firstElementRowMap.get(firstElement)
          if (oldRowIdx == null) return false
          const oldSnapshot = this.snapshotMap.get(rawRowList[oldRowIdx])
          if (!oldSnapshot || !this._isStructuralEqual(state, oldSnapshot)) {
            return false
          }
          convergedOldRowIdx = oldRowIdx
          convergedStartIndex = startIndex
          return true
        }
      }
    })
    if (isAborted) return null
    // 裁剪续算产物：丢弃空的种子行（行首元素强制换行时种子行不参与布局）
    const newRows = rows.slice()
    if (newRows.length && newRows[0].elementList.length === 0) {
      newRows.shift()
    }
    // 收敛时丢弃末尾诞生的新行：其内容即被复用旧行的行首元素
    const isConverged = convergedOldRowIdx >= 0
    if (isConverged) {
      const lastRow = newRows[newRows.length - 1]
      if (
        !lastRow ||
        lastRow.elementList.length !== 1 ||
        lastRow.elementList[0] !== elementList[convergedStartIndex]
      ) {
        return null
      }
      newRows.pop()
    }
    if (!newRows.length) return null
    const keptRowIdx = isConverged ? convergedOldRowIdx : rawRowList.length
    // 合并：替换 [startRowIdx, keptRowIdx) 的旧行
    const merged = [
      ...rawRowList.slice(0, startRowIdx),
      ...newRows,
      ...rawRowList.slice(keptRowIdx)
    ]
    // 尾部重编号：元素索引偏移 + 行序号顺延（纯赋值，不做任何测量）。
    // 复用行的快照不因位置偏移而失效：位置状态不影响行内容
    if (keptRowIdx < rawRowList.length) {
      const newCovered = convergedStartIndex - resumeStart
      const oldCovered = rawRowList[keptRowIdx].startIndex - resumeStart
      const delta = newCovered - oldCovered
      for (let i = startRowIdx + newRows.length; i < merged.length; i++) {
        merged[i].startIndex += delta
        merged[i].rowIndex = merged[i - 1].rowIndex + 1
      }
    }
    return { rowList: merged, firstChangedRow: merged[startRowIdx] }
  }

  // 每次 isCompute 渲染后调用：布局签名变化（缩放/边距/纸张等）时既有快照失效
  public observeLayout(): void {
    this.lastLayoutSignature = this.getLayoutSignature()
  }

  private getLayoutSignature(): string {
    const options = this.draw.getOptions()
    const header = this.draw.getHeader()
    const footer = this.draw.getFooter()
    return JSON.stringify({
      scale: options.scale,
      defaultSize: options.defaultSize,
      defaultTabWidth: options.defaultTabWidth,
      wordBreak: options.wordBreak,
      pageMode: options.pageMode,
      paperDirection: options.paperDirection,
      margins: options.margins,
      width: options.width,
      height: options.height,
      innerWidth: this.draw.getInnerWidth(),
      columnCount: this.draw.getColumnLayout()?.count || 1,
      headerDisabled: options.header.disabled,
      headerElementCount: header?.getElementList().length ?? 0,
      footerDisabled: options.footer.disabled,
      footerElementCount: footer?.getElementList().length ?? 0
    })
  }

  // 二分定位元素索引所在的行（最后一个 startIndex <= elementIndex 的行）
  private _findRowIndexOfElement(rowList: IRow[], elementIndex: number): number {
    let left = 0
    let right = rowList.length - 1
    let result = -1
    while (left <= right) {
      const mid = (left + right) >> 1
      if (rowList[mid].startIndex <= elementIndex) {
        result = mid
        left = mid + 1
      } else {
        right = mid - 1
      }
    }
    return result
  }

  // 复杂结构元素：独行或递归结构、浮动元素及控件不参与增量续算
  private _isComplexElement(element: IElement): boolean {
    return (
      element.type === ElementType.TABLE ||
      element.type === ElementType.PAGE_BREAK ||
      element.type === ElementType.BLOCK ||
      element.type === ElementType.SEPARATOR ||
      element.type === ElementType.IMAGE ||
      element.type === ElementType.LATEX ||
      !!element.control ||
      !!element.controlComponent ||
      !!element.areaId ||
      !!element.isControlMinWidthPlaceholder
    )
  }

  // 结构状态比对：位置状态（x/y/pageNo 等）不影响行内容，不参与比对
  private _isStructuralEqual(
    a: IRowComputeState,
    b: IRowComputeState
  ): boolean {
    if (
      a.direction !== b.direction ||
      a.innerWidth !== b.innerWidth ||
      a.startX !== b.startX ||
      a.pageHeight !== b.pageHeight ||
      a.column !== b.column ||
      a.controlRealWidth !== b.controlRealWidth ||
      a.margins[0] !== b.margins[0] ||
      a.margins[1] !== b.margins[1] ||
      a.margins[2] !== b.margins[2] ||
      a.margins[3] !== b.margins[3]
    ) {
      return false
    }
    if (a.listIndexMap.size !== b.listIndexMap.size) return false
    for (const [key, value] of a.listIndexMap) {
      if (b.listIndexMap.get(key) !== value) return false
    }
    return true
  }

  private static readonly MAX_CASCADE_ELEMENT = 2000
}
