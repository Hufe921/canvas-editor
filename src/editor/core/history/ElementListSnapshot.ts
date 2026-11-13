import type { IComputeRange } from '../../interface/Draw'
import type { IElement } from '../../interface/Element'
import { deepClone } from '../../utils'
import { getSlimCloneElementList } from '../../utils/element'

export type HistoryDirection = 'undo' | 'redo'

export interface IHistoryElementListRestore {
  elementList: IElement[]
  deleteCount?: number
  insertCount?: number
}

/**
 * 根据较新状态的正向脏区间恢复相邻历史状态。
 *
 * 区间外复用当前文档元素（不是历史快照），既保留旧行收敛所需的对象身份，
 * 也不会让后续编辑污染历史副本；只有目标状态的脏区间需要重新克隆。
 */
export function restoreHistoryElementList(
  currentList: IElement[],
  targetList: IElement[],
  forwardRange: IComputeRange | undefined,
  direction: HistoryDirection
): IHistoryElementListRestore {
  if (forwardRange) {
    const { startIndex, endIndex: newerEndIndex } = forwardRange
    const newerLength =
      direction === 'undo' ? currentList.length : targetList.length
    const olderLength =
      direction === 'undo' ? targetList.length : currentList.length
    const olderEndIndex = newerEndIndex - (newerLength - olderLength)
    const currentEndIndex = direction === 'undo' ? newerEndIndex : olderEndIndex
    const targetEndIndex = direction === 'undo' ? olderEndIndex : newerEndIndex
    if (
      Number.isInteger(startIndex) &&
      Number.isInteger(newerEndIndex) &&
      startIndex >= 0 &&
      startIndex < newerEndIndex &&
      newerEndIndex <= newerLength &&
      olderEndIndex >= startIndex &&
      olderEndIndex <= olderLength &&
      currentEndIndex <= currentList.length &&
      targetEndIndex <= targetList.length
    ) {
      const elementList = currentList
        .slice(0, startIndex)
        .concat(
          deepClone(targetList.slice(startIndex, targetEndIndex)),
          currentList.slice(currentEndIndex)
        )
      if (elementList.length === targetList.length) {
        return {
          elementList,
          deleteCount: currentEndIndex - startIndex,
          insertCount: targetEndIndex - startIndex
        }
      }
    }
  }
  return { elementList: deepClone(targetList) }
}

interface IElementListSnapshot {
  sourceList: IElement[]
  clonedList: IElement[]
}

/**
 * 历史记录快照的结构共享缓存。
 *
 * 仅当调用方提供覆盖全部数据修改的脏区间时复用旧快照：区间外元素仍共享
 * 上一次的历史副本，区间内元素重新克隆。sourceList 用于校验快照是否仍
 * 与当前文档衔接，任何接缝不一致都会退化为全文快照。
 */
export class ElementListSnapshot {
  private snapshot: IElementListSnapshot | null = null

  public capture(
    elementList: IElement[],
    dirtyRange?: IComputeRange
  ): IElement[] {
    const previous = this.snapshot
    const clonedList = previous
      ? this._captureIncremental(elementList, previous, dirtyRange)
      : null
    const result = clonedList || getSlimCloneElementList(elementList)
    this.snapshot = {
      sourceList: elementList.slice(),
      clonedList: result
    }
    return result
  }

  public reset(): void {
    this.snapshot = null
  }

  private _captureIncremental(
    elementList: IElement[],
    previous: IElementListSnapshot,
    dirtyRange?: IComputeRange
  ): IElement[] | null {
    if (!dirtyRange) return null
    const { startIndex, endIndex } = dirtyRange
    const netDelta = elementList.length - previous.sourceList.length
    const previousEndIndex = endIndex - netDelta
    if (
      startIndex < 0 ||
      endIndex < startIndex ||
      endIndex > elementList.length ||
      previousEndIndex < startIndex ||
      previousEndIndex > previous.sourceList.length
    ) {
      return null
    }
    // 两个接缝必须仍指向同一批源元素，防止撤销、替换文档或漏报修改后
    // 错用旧副本。区间覆盖正确性由唯一调用方（成功的增量排版）保证。
    const isPrefixConnected =
      startIndex === 0 ||
      previous.sourceList[startIndex - 1] === elementList[startIndex - 1]
    const isSuffixConnected =
      endIndex === elementList.length ||
      (previousEndIndex < previous.sourceList.length &&
        previous.sourceList[previousEndIndex] === elementList[endIndex])
    if (!isPrefixConnected || !isSuffixConnected) return null
    const changedClone = getSlimCloneElementList(
      elementList.slice(startIndex, endIndex)
    )
    return previous.clonedList
      .slice(0, startIndex)
      .concat(changedClone, previous.clonedList.slice(previousEndIndex))
  }
}
