import type { ITablePositionContext } from '../../../interface/Position'
import { ZERO } from '../../../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { ControlComponent } from '../../../dataset/enum/Control'
import { EditorContext } from '../../../dataset/enum/Editor'
import { ElementType } from '../../../dataset/enum/Element'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import {
  IReplaceOption,
  ISearchOption,
  ISearchResult,
  ISearchResultRestArgs
} from '../../../interface/Search'
import { getUUID, indexOf, isNumber, splitText } from '../../../utils'
import { Position } from '../../position/Position'
import { RangeManager } from '../../range/RangeManager'
import { Draw } from '../Draw'

export interface INavigateInfo {
  index: number
  count: number
}

export class Search {
  private draw: Draw
  private options: Required<IEditorOption>
  private position: Position
  private range: RangeManager
  private searchKeyword: string | null
  private searchNavigateIndex: number | null
  private searchOptions: ISearchOption | null
  private searchMatchList: ISearchResult[]

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.position = draw.getPosition()
    this.range = draw.getRange()
    this.searchNavigateIndex = null
    this.searchOptions = null
    this.searchKeyword = null
    this.searchMatchList = []
  }

  public getSearchKeyword(): string | null {
    return this.searchKeyword
  }

  public setSearchKeyword(payload: string | null, options?: ISearchOption) {
    this.searchKeyword = payload
    this.searchNavigateIndex = null
    this.searchOptions = options || null
  }

  private getSearchMatchGroupStartIndex(index: number): number | null {
    const searchMatch = this.searchMatchList[index]
    if (!searchMatch) return null
    let groupStartIndex = index
    while (
      groupStartIndex > 0 &&
      this.searchMatchList[groupStartIndex - 1].groupId === searchMatch.groupId
    ) {
      groupStartIndex--
    }
    return groupStartIndex
  }

  public searchNavigatePre(): number | null {
    if (!this.searchMatchList.length || !this.searchKeyword) return null
    if (this.searchNavigateIndex === null) {
      this.searchNavigateIndex = 0
    } else {
      let index = this.searchNavigateIndex - 1
      let isExistPre = false
      const searchNavigateId =
        this.searchMatchList[this.searchNavigateIndex].groupId
      while (index >= 0) {
        const match = this.searchMatchList[index]
        if (searchNavigateId !== match.groupId) {
          isExistPre = true
          this.searchNavigateIndex = this.getSearchMatchGroupStartIndex(index)
          break
        }
        index--
      }
      if (!isExistPre) {
        const lastSearchMatch =
          this.searchMatchList[this.searchMatchList.length - 1]
        if (lastSearchMatch.groupId === searchNavigateId) return null
        this.searchNavigateIndex = this.getSearchMatchGroupStartIndex(
          this.searchMatchList.length - 1
        )
      }
    }
    return this.searchNavigateIndex
  }

  public searchNavigateNext(): number | null {
    if (!this.searchMatchList.length || !this.searchKeyword) return null
    if (this.searchNavigateIndex === null) {
      this.searchNavigateIndex = 0
    } else {
      let index = this.searchNavigateIndex + 1
      let isExistNext = false
      const searchNavigateId =
        this.searchMatchList[this.searchNavigateIndex].groupId
      while (index < this.searchMatchList.length) {
        const match = this.searchMatchList[index]
        if (searchNavigateId !== match.groupId) {
          isExistNext = true
          this.searchNavigateIndex = index
          break
        }
        index++
      }
      if (!isExistNext) {
        const firstSearchMatch = this.searchMatchList[0]
        if (firstSearchMatch.groupId === searchNavigateId) return null
        this.searchNavigateIndex = 0
      }
    }
    return this.searchNavigateIndex
  }

  public searchNavigateScrollIntoView(position: IElementPosition) {
    const {
      coordinate: { leftTop, leftBottom, rightTop },
      pageNo
    } = position
    const { x: pageLeft, y: preY } = this.draw.getPageOffset(pageNo)
    // 创建定位锚点
    const anchor = document.createElement('div')
    anchor.style.position = 'absolute'
    // 扩大搜索词尺寸，使可视范围更广
    const ANCHOR_OVERFLOW_SIZE = 50
    anchor.style.width = `${rightTop[0] - leftTop[0] + ANCHOR_OVERFLOW_SIZE}px`
    anchor.style.height = `${
      leftBottom[1] - leftTop[1] + ANCHOR_OVERFLOW_SIZE
    }px`
    anchor.style.left = `${leftTop[0] + pageLeft}px`
    anchor.style.top = `${leftTop[1] + preY}px`
    this.draw.getContainer().append(anchor)
    // 移动到可视范围
    anchor.scrollIntoView(false)
    anchor.remove()
  }

  public getSearchNavigateIndexList() {
    if (this.searchNavigateIndex === null || !this.searchKeyword) return []
    const searchNavigate = this.searchMatchList[this.searchNavigateIndex]
    if (!searchNavigate) return []
    const indexList: number[] = []
    let index = this.searchNavigateIndex
    while (
      index < this.searchMatchList.length &&
      this.searchMatchList[index].groupId === searchNavigate.groupId
    ) {
      indexList.push(index)
      index++
    }
    return indexList
  }

  public getSearchMatchList(): ISearchResult[] {
    return this.searchMatchList
  }

  public getSearchNavigateInfo(): null | INavigateInfo {
    if (!this.searchKeyword || !this.searchMatchList.length) return null
    const searchNavigateId =
      this.searchNavigateIndex !== null
        ? this.searchMatchList[this.searchNavigateIndex]?.groupId
        : null
    let index = 0
    let count = 0
    let groupId = null
    for (let s = 0; s < this.searchMatchList.length; s++) {
      const match = this.searchMatchList[s]
      if (groupId === match.groupId) continue
      groupId = match.groupId
      count += 1
      if (searchNavigateId === groupId) {
        index = count
      }
    }
    return {
      index,
      count
    }
  }

  public getMatchList(
    payload: string,
    originalElementList: IElement[]
  ): ISearchResult[] {
    const { isRegEnable = false, isIgnoreCase = true } =
      this.searchOptions || {}
    const keyword = isIgnoreCase ? payload.toLocaleLowerCase() : payload
    const searchMatchList: ISearchResult[] = []
    const hidden = (element: IElement) =>
      element.hide ||
      element.control?.hide ||
      element.area?.hide ||
      this.draw.getTraceParticle().isTraceHidden(element)
    const search = (
      elements: IElement[],
      start: number,
      end: number,
      path: ITablePositionContext[]
    ) => {
      let text = ''
      const sources: number[] = []
      for (let index = start; index < end; index++) {
        const element = elements[index]
        const visible =
          !hidden(element) &&
          (!element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)) &&
          element.controlComponent !== ControlComponent.CHECKBOX &&
          element.controlComponent !== ControlComponent.RADIO
        let value = visible ? element.value : ZERO
        if (isIgnoreCase) value = value.toLocaleLowerCase()
        text += value
        sources.push(...Array.from({ length: value.length }, () => index))
      }
      const pattern = isRegEnable ? new RegExp(keyword) : keyword
      const claimed = new Set<number>()
      let match = indexOf(text, pattern)
      while (match.index >= 0 && match.length > 0) {
        const groupId = getUUID()
        const indices = [
          ...new Set(sources.slice(match.index, match.index + match.length))
        ]
        const last = path.at(-1)
        const context: ISearchResultRestArgs = last
          ? {
              tableIndex: path[0].index,
              tableId: last.tableId,
              trIndex: last.trIndex,
              tdIndex: last.tdIndex,
              tdId: last.tdId,
              tablePath: path.map(item => ({ ...item }))
            }
          : {}
        if (!indices.some(index => claimed.has(index))) {
          for (const index of indices) {
            claimed.add(index)
            searchMatchList.push({
              type: last ? EditorContext.TABLE : EditorContext.PAGE,
              index,
              groupId,
              ...context
            })
          }
        }
        match = indexOf(text, pattern, match.index + match.length)
      }
    }
    const visit = (
      elements: IElement[],
      path: ITablePositionContext[] = []
    ) => {
      let start = 0
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index]
        if (element.type !== ElementType.TABLE) continue
        search(elements, start, index, path)
        if (!hidden(element))
          for (const [trIndex, row] of element.trList!.entries())
            for (const [tdIndex, td] of row.tdList.entries())
              visit(td.value, [
                ...path,
                {
                  index,
                  trIndex,
                  tdIndex,
                  tdId: td.id,
                  trId: row.id,
                  tableId: element.id
                }
              ])
        start = index + 1
      }
      search(elements, start, elements.length, path)
    }
    visit(originalElementList)
    return searchMatchList
  }

  private matchCell(elements: IElement[], match: ISearchResult) {
    return this.position.getTableTdByContext(elements, {
      isTable: true,
      index: match.tableIndex,
      trIndex: match.trIndex,
      tdIndex: match.tdIndex,
      tableId: match.tableId,
      tablePath: match.tablePath
    })
  }

  private setMatchContext(match: ISearchResult) {
    this.position.setPositionContext(
      match.type === EditorContext.TABLE
        ? {
            isTable: true,
            index: match.tableIndex,
            trIndex: match.trIndex,
            tdIndex: match.tdIndex,
            tdId: match.tdId,
            tableId: match.tableId,
            trId: match.tablePath?.at(-1)?.trId,
            tablePath: match.tablePath
          }
        : { isTable: false }
    )
  }

  public compute(payload: string) {
    const isPickSelectionElementList =
      this.searchOptions?.isLimitSelection && !this.range.getIsCollapsed()
    // 搜索元素范围（默认全部 || 设置搜索选中区域）
    const searchElementList = isPickSelectionElementList
      ? this.range.getSelectionElementList()
      : this.draw.getOriginalElementList()
    if (!searchElementList?.length) {
      this.searchMatchList = []
      return
    }
    this.searchMatchList = this.getMatchList(payload, searchElementList)
    // 根据选区位置index/tableIndex往后移动
    if (!isPickSelectionElementList || !this.searchMatchList.length) return
    const { startIndex } = this.range.getRange()
    // getSelectionElementList实际返回的元素列表为选区位置之后的元素列表，所以需要+1
    const offset = startIndex + 1
    for (const searchMatch of this.searchMatchList) {
      if (searchMatch.type === EditorContext.TABLE) {
        searchMatch.tableIndex! += offset
        if (searchMatch.tablePath?.length)
          searchMatch.tablePath[0].index += offset
      } else {
        searchMatch.index += offset
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, pageIndex: number) {
    if (
      !this.searchMatchList ||
      !this.searchMatchList.length ||
      !this.searchKeyword
    ) {
      return
    }
    const { searchMatchAlpha, searchMatchColor, searchNavigateMatchColor } =
      this.options
    const positionList = this.position.getOriginalPositionList(pageIndex)
    const elementList = this.draw.getOriginalElementList()
    ctx.save()
    ctx.globalAlpha = searchMatchAlpha
    for (let s = 0; s < this.searchMatchList.length; s++) {
      const searchMatch = this.searchMatchList[s]
      let position: IElementPosition | null = null
      let targetPositions = positionList
      if (searchMatch.type === EditorContext.TABLE) {
        targetPositions =
          this.matchCell(elementList, searchMatch)?.positionList || []
        position = targetPositions[searchMatch.index]
      } else {
        position = positionList[searchMatch.index]
      }
      if (!position) continue
      const {
        coordinate: { leftTop, leftBottom, rightTop },
        pageNo
      } = position
      const native = this.position.getNativeLines?.(targetPositions)
      const nativeRects = native?.length
        ? this.position.getNativeRangeRects(
            searchMatch.index,
            searchMatch.index + 1,
            targetPositions,
            pageIndex
          )
        : null
      if (nativeRects ? !nativeRects.length : pageNo !== pageIndex) continue
      // 高亮并定位当前搜索词
      const searchMatchIndexList = this.getSearchNavigateIndexList()
      if (searchMatchIndexList.includes(s)) {
        ctx.fillStyle = searchNavigateMatchColor
        // 是否是第一个字符，则移动到可视范围
        const preSearchMatch = this.searchMatchList[s - 1]
        if (!preSearchMatch || preSearchMatch.groupId !== searchMatch.groupId) {
          this.searchNavigateScrollIntoView(position)
        }
      } else {
        ctx.fillStyle = searchMatchColor
      }
      const x = leftTop[0]
      const y = leftTop[1]
      const width = rightTop[0] - leftTop[0]
      const height = leftBottom[1] - leftTop[1]
      if (nativeRects) {
        for (const rect of nativeRects)
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
      } else ctx.fillRect(x, y, width, height)
    }
    ctx.restore()
  }

  public replace(payload: string, option?: IReplaceOption) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    if (payload === undefined || payload === null) return
    let matchList = this.getSearchMatchList()
    // 替换搜索项
    const replaceIndex = option?.index
    if (isNumber(replaceIndex)) {
      const matchGroup: ISearchResult[][] = []
      matchList.forEach(match => {
        const last = matchGroup[matchGroup.length - 1]
        if (!last || last[0].groupId !== match.groupId) {
          matchGroup.push([match])
        } else {
          last.push(match)
        }
      })
      matchList = matchGroup[replaceIndex]
    }
    if (!matchList?.length) return
    if (!this.draw.getOptions().trace.disabled) {
      this.replaceWithTrace(payload, matchList)
      return
    }
    const groups: ISearchResult[][] = []
    for (const match of matchList) {
      const last = groups.at(-1)
      if (last?.[0].groupId === match.groupId) last.push(match)
      else groups.push([match])
    }
    const root = this.draw.getOriginalElementList()
    const values = splitText(payload)
    let first: ISearchResult | undefined
    let cursor = -1
    for (const group of groups.reverse()) {
      const match = group[0]
      const cell =
        match.type === EditorContext.TABLE
          ? this.matchCell(root, match)
          : undefined
      const elements = cell?.value || root
      const selected = elements.slice(match.index, match.index + group.length)
      if (
        !selected.length ||
        selected.some(
          element =>
            (!this.draw.isDesignMode() &&
              (element.control?.deletable === false ||
                element.title?.deletable === false)) ||
            (element.type === ElementType.CONTROL &&
              element.controlComponent !== ControlComponent.VALUE)
        )
      )
        continue
      if (!this.draw.isDesignMode() && cell?.deletable === false) continue
      const source = selected[0]
      const length = elements.length
      this.draw.deleteElementList(elements, match.index, group.length, {
        tdDeletable: cell?.deletable !== false
      })
      if (elements.length !== length - group.length) continue
      this.draw.spliceElementList(
        elements,
        match.index,
        0,
        values.map(value => ({ ...source, value }))
      )
      first = match
      cursor = Math.max(0, match.index + values.length - 1)
    }
    if (!first) return
    this.setMatchContext(first)
    this.range.setRange(cursor, cursor)
    this.draw.render({ curIndex: cursor })
  }

  private replaceWithTrace(payload: string, matchList: ISearchResult[]) {
    const matchGroupList: ISearchResult[][] = []
    for (const match of matchList) {
      const lastGroup = matchGroupList[matchGroupList.length - 1]
      if (!lastGroup || lastGroup[0].groupId !== match.groupId) {
        matchGroupList.push([match])
      } else {
        lastGroup.push(match)
      }
    }
    const elementList = this.draw.getOriginalElementList()
    let firstReplacedMatch: ISearchResult | null = null
    let firstReplacedIndex = -1
    for (let g = matchGroupList.length - 1; g >= 0; g--) {
      const matchGroup = matchGroupList[g]
      const firstMatch = matchGroup[0]
      let targetElementList: IElement[]
      let tdDeletable = true
      if (firstMatch.type === EditorContext.TABLE) {
        const td = this.matchCell(elementList, firstMatch)
        if (!td) continue
        targetElementList = td.value
        tdDeletable = td.deletable !== false
      } else {
        targetElementList = elementList
      }
      const startIndex = firstMatch.index
      const matchElementList = targetElementList.slice(
        startIndex,
        startIndex + matchGroup.length
      )
      if (
        matchElementList.some(
          element =>
            element.type === ElementType.CONTROL &&
            element.controlComponent !== ControlComponent.VALUE
        )
      ) {
        continue
      }
      const deleteElementList =
        this.draw.deleteElementList(
          targetElementList,
          startIndex,
          matchGroup.length,
          { tdDeletable }
        ) || []
      const sourceElement = deleteElementList[0]
      if (!sourceElement) continue
      const replaceIndex = targetElementList.indexOf(sourceElement, startIndex)
      if (payload) {
        const insertElementList = splitText(payload).map(value => {
          const element: IElement = {
            ...sourceElement,
            value
          }
          delete element.trace
          return element
        })
        this.draw.getTraceParticle().markElementListInserted(insertElementList)
        this.draw.spliceElementList(
          targetElementList,
          replaceIndex,
          0,
          insertElementList
        )
      }
      firstReplacedMatch = firstMatch
      firstReplacedIndex = payload
        ? replaceIndex + splitText(payload).length - 1
        : Math.max(replaceIndex - 1, 0)
    }
    if (!firstReplacedMatch) return
    this.setMatchContext(firstReplacedMatch)
    this.draw.getRange().setRange(firstReplacedIndex, firstReplacedIndex)
    this.draw.render({
      curIndex: firstReplacedIndex
    })
  }
}
