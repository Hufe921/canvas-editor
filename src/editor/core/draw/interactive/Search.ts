import { ZERO } from '../../../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { ControlComponent } from '../../../dataset/enum/Control'
import { EditorContext } from '../../../dataset/enum/Editor'
import { ElementType } from '../../../dataset/enum/Element'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import {
  IReplaceOption,
  ISearchResult,
  ISearchResultRestArgs
} from '../../../interface/Search'
import { getUUID, isNumber } from '../../../utils'
import { Position } from '../../position/Position'
import { Draw } from '../Draw'

export interface INavigateInfo {
  index: number
  count: number
}

export class Search {
  private draw: Draw
  private options: Required<IEditorOption>
  private position: Position
  private searchKeyword: string | null
  private searchNavigateIndex: number | null
  private searchMatchList: ISearchResult[]

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.position = draw.getPosition()
    this.searchNavigateIndex = null
    this.searchKeyword = null
    this.searchMatchList = []
  }

  public getSearchKeyword(): string | null {
    return this.searchKeyword
  }

  public setSearchKeyword(payload: string | null) {
    this.searchKeyword = payload
    this.searchNavigateIndex = null
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
          this.searchNavigateIndex = index - (this.searchKeyword.length - 1)
          break
        }
        index--
      }
      if (!isExistPre) {
        const lastSearchMatch =
          this.searchMatchList[this.searchMatchList.length - 1]
        if (lastSearchMatch.groupId === searchNavigateId) return null
        this.searchNavigateIndex =
          this.searchMatchList.length - 1 - (this.searchKeyword.length - 1)
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
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = pageNo * (height + pageGap)
    // 创建定位锚点
    const anchor = document.createElement('div')
    anchor.style.position = 'absolute'
    // 扩大搜索词尺寸，使可视范围更广
    const ANCHOR_OVERFLOW_SIZE = 50
    anchor.style.width = `${rightTop[0] - leftTop[0] + ANCHOR_OVERFLOW_SIZE}px`
    anchor.style.height = `${
      leftBottom[1] - leftTop[1] + ANCHOR_OVERFLOW_SIZE
    }px`
    anchor.style.left = `${leftTop[0]}px`
    anchor.style.top = `${leftTop[1] + preY}px`
    this.draw.getContainer().append(anchor)
    // 移动到可视范围
    anchor.scrollIntoView(false)
    anchor.remove()
  }

  public getSearchNavigateIndexList() {
    if (this.searchNavigateIndex === null || !this.searchKeyword) return []
    return new Array(this.searchKeyword.length)
      .fill(this.searchNavigateIndex)
      .map((navigate, index) => navigate + index)
  }

  public getSearchMatchList(): ISearchResult[] {
    return this.searchMatchList
  }

  public getSearchNavigateInfo(): null | INavigateInfo {
    if (!this.searchKeyword || !this.searchMatchList.length) return null
    const index =
      this.searchNavigateIndex !== null
        ? this.searchNavigateIndex / this.searchKeyword.length + 1
        : 0
    let count = 0
    let groupId = null
    for (let s = 0; s < this.searchMatchList.length; s++) {
      const match = this.searchMatchList[s]
      if (groupId === match.groupId) continue
      groupId = match.groupId
      count += 1
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
    const keyword = payload.toLocaleLowerCase()
    const searchMatchList: ISearchResult[] = []
    // 分组
    const elementListGroup: {
      type: EditorContext
      elementList: IElement[]
      index: number
    }[] = []
    const originalElementListLength = originalElementList.length
    // 查找表格所在位置
    const tableIndexList = []
    for (let e = 0; e < originalElementListLength; e++) {
      const element = originalElementList[e]
      if (element.type === ElementType.TABLE) {
        tableIndexList.push(e)
      }
    }
    let i = 0
    let elementIndex = 0
    while (elementIndex < originalElementListLength - 1) {
      const endIndex = tableIndexList.length
        ? tableIndexList[i]
        : originalElementListLength
      const pageElement = originalElementList.slice(elementIndex, endIndex)
      if (pageElement.length) {
        elementListGroup.push({
          index: elementIndex,
          type: EditorContext.PAGE,
          elementList: pageElement
        })
      }
      const tableElement = originalElementList[endIndex]
      if (tableElement) {
        elementListGroup.push({
          index: endIndex,
          type: EditorContext.TABLE,
          elementList: [tableElement]
        })
      }
      elementIndex = endIndex + 1
      i++
    }
    // 搜索文本
    function searchClosure(
      payload: string | null,
      type: EditorContext,
      elementList: IElement[],
      restArgs?: ISearchResultRestArgs
    ) {
      if (!payload) return
      const text = elementList
        .map(e =>
          !e.type ||
          (TEXTLIKE_ELEMENT_TYPE.includes(e.type) &&
            e.controlComponent !== ControlComponent.CHECKBOX &&
            !e.control?.hide)
            ? e.value
            : ZERO
        )
        .filter(Boolean)
        .join('')
        .toLocaleLowerCase()
      const matchStartIndexList = []
      let index = text.indexOf(payload)
      while (index !== -1) {
        matchStartIndexList.push(index)
        index = text.indexOf(payload, index + payload.length)
      }
      for (let m = 0; m < matchStartIndexList.length; m++) {
        const startIndex = matchStartIndexList[m]
        const groupId = getUUID()
        for (let i = 0; i < payload.length; i++) {
          const index = startIndex + i + (restArgs?.startIndex || 0)
          searchMatchList.push({
            type,
            index,
            groupId,
            ...restArgs
          })
        }
      }
    }
    for (let e = 0; e < elementListGroup.length; e++) {
      const group = elementListGroup[e]
      if (group.type === EditorContext.TABLE) {
        const tableElement = group.elementList[0]
        for (let t = 0; t < tableElement.trList!.length; t++) {
          const tr = tableElement.trList![t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const restArgs: ISearchResultRestArgs = {
              tableId: tableElement.id,
              tableIndex: group.index,
              trIndex: t,
              tdIndex: d,
              tdId: td.id
            }
            searchClosure(keyword, group.type, td.value, restArgs)
          }
        }
      } else {
        searchClosure(keyword, group.type, group.elementList, {
          startIndex: group.index
        })
      }
    }
    return searchMatchList
  }

  public compute(payload: string) {
    this.searchMatchList = this.getMatchList(
      payload,
      this.draw.getOriginalElementList()
    )
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
    const positionList = this.position.getOriginalPositionList()
    const elementList = this.draw.getOriginalElementList()
    ctx.save()
    ctx.globalAlpha = searchMatchAlpha
    for (let s = 0; s < this.searchMatchList.length; s++) {
      const searchMatch = this.searchMatchList[s]
      let position: IElementPosition | null = null
      if (searchMatch.type === EditorContext.TABLE) {
        const { tableIndex, trIndex, tdIndex, index } = searchMatch
        position =
          elementList[tableIndex!]?.trList![trIndex!].tdList[tdIndex!]
            ?.positionList![index]
      } else {
        position = positionList[searchMatch.index]
      }
      if (!position) continue
      const {
        coordinate: { leftTop, leftBottom, rightTop },
        pageNo
      } = position
      if (pageNo !== pageIndex) continue
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
      ctx.fillRect(x, y, width, height)
    }
    ctx.restore()
  }

  public replace(payload: string, option?: IReplaceOption) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    if (!payload || new RegExp(`${ZERO}`, 'g').test(payload)) return
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
    const isDesignMode = this.draw.isDesignMode()
    // 匹配index变化的差值
    let pageDiffCount = 0
    let tableDiffCount = 0
    // 匹配搜索词的组标识
    let curGroupId = ''
    // 表格上下文
    let curTdId = ''
    // 搜索值 > 替换值：增加元素；搜索值 < 替换值：减少元素
    let firstMatchIndex = -1
    const elementList = this.draw.getOriginalElementList()
    for (let m = 0; m < matchList.length; m++) {
      const match = matchList[m]
      if (match.type === EditorContext.TABLE) {
        const { tableIndex, trIndex, tdIndex, index, tdId } = match
        if (curTdId && tdId !== curTdId) {
          tableDiffCount = 0
        }
        curTdId = tdId!
        const curTableIndex = tableIndex! + pageDiffCount
        const tableElementList =
          elementList[curTableIndex].trList![trIndex!].tdList[tdIndex!].value
        // 表格内元素
        const curIndex = index + tableDiffCount
        const tableElement = tableElementList[curIndex]
        // 非设计模式下设置元素不可删除 || 控件结构元素 => 禁止替换
        if (
          !isDesignMode &&
          (tableElement?.control?.deletable === false ||
            tableElement?.title?.deletable === false)
        ) {
          continue
        }
        if (curGroupId === match.groupId) {
          this.draw.spliceElementList(tableElementList, curIndex, 1)
          tableDiffCount--
          continue
        }
        if (!~firstMatchIndex) {
          firstMatchIndex = m
        }
        for (let p = 0; p < payload.length; p++) {
          const value = payload[p]
          if (p === 0) {
            tableElement.value = value
          } else {
            this.draw.spliceElementList(tableElementList, curIndex + p, 0, [
              {
                ...tableElement,
                value
              }
            ])
            tableDiffCount++
          }
        }
      } else {
        const curIndex = match.index + pageDiffCount
        const element = elementList[curIndex]
        // 非设计模式下设置元素不可删除 || 控件结构元素 => 禁止替换
        if (
          (!isDesignMode &&
            (element?.control?.deletable === false ||
              element?.title?.deletable === false)) ||
          (element.type === ElementType.CONTROL &&
            element.controlComponent !== ControlComponent.VALUE)
        ) {
          continue
        }
        if (!~firstMatchIndex) {
          firstMatchIndex = m
        }
        if (curGroupId === match.groupId) {
          this.draw.spliceElementList(elementList, curIndex, 1)
          pageDiffCount--
          continue
        }
        for (let p = 0; p < payload.length; p++) {
          const value = payload[p]
          if (p === 0) {
            element.value = value
          } else {
            this.draw.spliceElementList(elementList, curIndex + p, 0, [
              {
                ...element,
                value
              }
            ])
            pageDiffCount++
          }
        }
      }
      curGroupId = match.groupId
    }
    if (!~firstMatchIndex) return
    // 定位-首个被匹配关键词后
    const firstMatch = matchList[firstMatchIndex]
    const firstIndex = firstMatch.index + (payload.length - 1)
    if (firstMatch.type === EditorContext.TABLE) {
      const { tableIndex, trIndex, tdIndex, index } = firstMatch
      const element =
        elementList[tableIndex!].trList![trIndex!].tdList[tdIndex!].value[index]
      this.position.setPositionContext({
        isTable: true,
        index: tableIndex,
        trIndex,
        tdIndex,
        tdId: element.tdId,
        trId: element.trId,
        tableId: element.tableId
      })
    } else {
      this.position.setPositionContext({
        isTable: false
      })
    }
    this.draw.getRange().setRange(firstIndex, firstIndex)
    // 重新渲染
    this.draw.render({
      curIndex: firstIndex
    })
  }
}
