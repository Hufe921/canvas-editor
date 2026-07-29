import { ImageDisplay } from '../../dataset/enum/Common'
import { ElementType } from '../../dataset/enum/Element'
import { INCREMENTAL_COMPUTE_MIN_ELEMENT_COUNT } from '../../dataset/constant/Editor'
import { IElement } from '../../interface/Element'
import { IRow, IRowElement } from '../../interface/Row'
import { Draw } from './Draw'

// 行布局状态快照：增量计算的恢复点与再同步比对依据
export interface IRowLayoutState {
  x: number
  y: number
  pageNo: number
  pageStartY: number
  columnIndex: number
  // 行创建时（仅含首个元素）的尺寸信息
  initWidth: number
  initHeight: number
  initAscent: number
}

// 主文档元素列表的一次变更记录（供增量行计算使用）
export interface IElementListChange {
  start: number
  deletedCount: number
  insertedCount: number
  isComplex: boolean
}

// 增量行计算门禁：文档存在的复杂特性
export interface IIncrementalComputeFeature {
  list: boolean
  control: boolean
  area: boolean
}

// computeRowList 行布局快照与复杂特性记录
export interface IComputeRowListRecord {
  stateList: IRowLayoutState[]
  feature: IIncrementalComputeFeature
}

// computeRowList 内部扩展参数（不对外暴露）
export interface IComputeRowListInternalOption {
  // 恢复：以种子行与布局状态从指定元素下标继续计算
  resume?: {
    startElementIndex: number
    seedRowList: IRow[]
    state: IRowLayoutState
  }
  // 再同步：新行与旧行起点元素同一且布局状态一致时复用其后全部旧行
  sync?: {
    oldRowList: IRow[]
    oldStateList: IRowLayoutState[]
    delta: number
    isStrict: boolean
    // 输出：命中的旧行下标
    oldRowIndex?: number
  }
  // 记录：全量计算时输出行布局快照与复杂特性标记
  record?: IComputeRowListRecord
}

// 二分查找起始下标等于 target 的行下标，未命中返回 -1
export function binarySearchRowByStartIndex(
  rowList: IRow[],
  target: number
): number {
  let low = 0
  let high = rowList.length - 1
  while (low <= high) {
    const mid = (low + high) >> 1
    const startIndex = rowList[mid].startIndex
    if (startIndex === target) return mid
    if (startIndex < target) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return -1
}

// 二分查找最后一个起始下标 <= target 的行下标，未命中返回 -1
function binarySearchRowFloor(rowList: IRow[], target: number): number {
  let low = 0
  let high = rowList.length - 1
  let result = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (rowList[mid].startIndex <= target) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return result
}

export class IncrementalRowCompute {
  private draw: Draw
  private rowStateList: IRowLayoutState[]
  private computedElementList: IElement[] | null
  private feature: IIncrementalComputeFeature

  constructor(draw: Draw) {
    this.draw = draw
    this.rowStateList = []
    this.computedElementList = null
    this.feature = {
      list: false,
      control: false,
      area: false
    }
  }

  // 全量计算时创建行布局快照与复杂特性记录
  public createRecord(): IComputeRowListRecord {
    return {
      stateList: [],
      feature: {
        list: false,
        control: false,
        area: false
      }
    }
  }

  // 保存全量计算产出的快照记录（无记录时清空，禁用增量）
  public saveRecord(
    record: IComputeRowListRecord | null,
    elementList: IElement[]
  ) {
    if (!record) {
      this.rowStateList = []
      this.computedElementList = null
      return
    }
    this.rowStateList = record.stateList
    this.computedElementList = elementList
    this.feature = record.feature
  }

  /**
   * 增量行计算：仅重算变更影响的行，命中再同步后复用其后全部旧行。
   * 门禁严格——任何不确定场景返回 null 回退全量计算。
   */
  public computeRowList(payload: {
    startX: number
    startY: number
    pageHeight: number
    isPagingMode: boolean
    innerWidth: number
    surroundElementList: IElement[]
    elementList: IElement[]
    rawRowList: IRow[]
    pendingChange: IElementListChange | null
  }): IRow[] | null {
    const {
      startX,
      startY,
      pageHeight,
      isPagingMode,
      innerWidth,
      surroundElementList,
      elementList,
      rawRowList,
      pendingChange
    } = payload
    // 门禁：简单单段变更
    if (!pendingChange || pendingChange.isComplex) return null
    // 门禁：大文档且上次全量计算已记录行布局快照
    if (elementList.length < INCREMENTAL_COMPUTE_MIN_ELEMENT_COUNT) return null
    if (this.computedElementList !== elementList) return null
    if (!rawRowList.length || this.rowStateList.length !== rawRowList.length) {
      return null
    }
    // 门禁：无复杂特性（列表/控件/区域/环绕元素/分栏/页数限制）
    const feature = this.feature
    if (feature.list || feature.control || feature.area) {
      return null
    }
    if (surroundElementList.length) return null
    if (!this.draw.getZone().isMainActive()) return null
    if (Number.isInteger(this.draw.getOptions().pageNumber.maxPageNo)) {
      return null
    }
    const layout = this.draw.getColumnLayout()
    if (isPagingMode && layout && layout.count > 1) return null
    const { start, deletedCount, insertedCount } = pendingChange
    // 门禁：插入段不含复杂特性
    for (let j = start; j < start + insertedCount; j++) {
      const el = elementList[j]
      if (!el) return null
      if (
        el.type === ElementType.TABLE ||
        el.listId ||
        el.controlId ||
        el.control ||
        el.areaId ||
        el.imgDisplay === ImageDisplay.SURROUND
      ) {
        return null
      }
    }
    const oldRowList = rawRowList
    const oldStateList = this.rowStateList
    const delta = insertedCount - deletedCount
    // 定位恢复行：包含变更点前一个元素（词汇/标点跨行影响）的旧行
    const anchorIndex = start - 1
    const resumeRowIndex =
      anchorIndex < 0 ? 0 : binarySearchRowFloor(oldRowList, anchorIndex)
    if (!~resumeRowIndex) return null
    const sync: IComputeRowListInternalOption['sync'] = {
      oldRowList,
      oldStateList,
      delta,
      isStrict: isPagingMode
    }
    const recordStateList: IRowLayoutState[] = []
    let rowList: IRow[]
    if (!resumeRowIndex) {
      // 变更点位于首行：从头重算并尝试再同步
      rowList = this.draw.computeRowList(
        {
          startX,
          startY,
          pageHeight,
          isPagingMode,
          innerWidth,
          surroundElementList: [],
          elementList
        },
        { sync, record: { stateList: recordStateList, feature: this.feature } }
      )
    } else {
      const resumeRow = oldRowList[resumeRowIndex]
      const resumeState = oldStateList[resumeRowIndex]
      const resumeStartIndex = resumeRow.startIndex
      // 恢复行需至少重算两个元素（末行收尾逻辑依赖循环执行）
      if (!resumeState || resumeStartIndex >= elementList.length - 1) {
        return null
      }
      // 同一性断言：恢复行首元素未被改动
      const firstElement = elementList[resumeStartIndex]
      if (!firstElement || firstElement !== resumeRow.elementList[0]) {
        return null
      }
      // 恢复行为表格行：尺寸快照可能因单元格内容变化过期，回退全量
      if (firstElement.type === ElementType.TABLE) return null
      // 重建恢复行：字段复用旧行，内容与尺寸还原为仅含首元素的创建时点
      const seedRow: IRow = {
        ...resumeRow,
        width: resumeState.initWidth,
        height: resumeState.initHeight,
        ascent: resumeState.initAscent,
        elementList: [firstElement as IRowElement],
        isWidthNotEnough: false
      }
      const seedRowList = oldRowList.slice(0, resumeRowIndex)
      seedRowList.push(seedRow)
      recordStateList.push(...oldStateList.slice(0, resumeRowIndex + 1))
      rowList = this.draw.computeRowList(
        {
          startX,
          startY,
          pageHeight,
          isPagingMode,
          innerWidth,
          surroundElementList: [],
          elementList
        },
        {
          resume: {
            startElementIndex: resumeStartIndex + 1,
            seedRowList,
            state: resumeState
          },
          sync,
          record: { stateList: recordStateList, feature: this.feature }
        }
      )
    }
    this.rowStateList = recordStateList
    return rowList
  }
}
