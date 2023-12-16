import { ElementType } from '../../../../dataset/enum/Element'
import { DeepRequired } from '../../../../interface/Common'
import {
  IControlHighlight,
  IControlHighlightRule
} from '../../../../interface/Control'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement, IElementPosition } from '../../../../interface/Element'
import {
  ISearchResult,
  ISearchResultRestArgs
} from '../../../../interface/Search'
import { Draw } from '../../Draw'
import { Control } from '../Control'

type IHighlightMatchResult = (ISearchResult & IControlHighlightRule)[]

export class ControlSearch {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private highlightList: IControlHighlight[]
  private highlightMatchResult: IHighlightMatchResult

  constructor(control: Control) {
    this.draw = control.getDraw()
    this.options = this.draw.getOptions()

    this.highlightList = []
    this.highlightMatchResult = []
  }

  public getHighlightMatchResult(): IHighlightMatchResult {
    return this.highlightMatchResult
  }

  public getHighlightList(): IControlHighlight[] {
    return this.highlightList
  }

  public setHighlightList(payload: IControlHighlight[]) {
    this.highlightList = payload
  }

  public computeHighlightList() {
    const search = this.draw.getSearch()
    const computeHighlight = (
      elementList: IElement[],
      restArgs?: ISearchResultRestArgs
    ) => {
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        i++
        // 表格下钻处理
        if (element.type === ElementType.TABLE) {
          const trList = element.trList!
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              const restArgs: ISearchResultRestArgs = {
                tableId: element.id,
                tableIndex: i - 1,
                trIndex: r,
                tdIndex: d,
                tdId: td.id
              }
              computeHighlight(td.value, restArgs)
            }
          }
        }
        const controlConceptId = element?.control?.conceptId
        if (!controlConceptId) continue
        const highlightIndex = this.highlightList.findIndex(
          highlight => highlight.conceptId === controlConceptId
        )
        if (!~highlightIndex) continue
        // 搜索后控件结束索引
        const startIndex = i
        let newEndIndex = i
        while (newEndIndex < elementList.length) {
          const nextElement = elementList[newEndIndex]
          if (nextElement.controlId !== element.controlId) break
          newEndIndex++
        }
        i = newEndIndex
        // 高亮信息
        const controlElementList = elementList.slice(startIndex, newEndIndex)
        const highlight = this.highlightList[highlightIndex]
        const { ruleList } = highlight
        for (let r = 0; r < ruleList.length; r++) {
          const rule = ruleList[r]
          const searchResult = search.getMatchList(
            rule.keyword,
            controlElementList
          )
          this.highlightMatchResult.push(
            ...searchResult.map(result => ({
              ...result,
              ...rule,
              ...restArgs,
              index: result.index + startIndex // 实际索引
            }))
          )
        }
      }
    }
    this.highlightMatchResult = []
    computeHighlight(this.draw.getOriginalMainElementList())
  }

  public renderHighlightList(ctx: CanvasRenderingContext2D, pageIndex: number) {
    if (!this.highlightMatchResult?.length) return
    const { searchMatchAlpha, searchMatchColor } = this.options
    const positionList = this.draw.getPosition().getOriginalPositionList()
    const elementList = this.draw.getOriginalElementList()
    ctx.save()
    for (let s = 0; s < this.highlightMatchResult.length; s++) {
      const searchMatch = this.highlightMatchResult[s]
      let position: IElementPosition | null = null
      if (searchMatch.tableId) {
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
      ctx.fillStyle = searchMatch.backgroundColor || searchMatchColor
      ctx.globalAlpha = searchMatch.alpha || searchMatchAlpha
      const x = leftTop[0]
      const y = leftTop[1]
      const width = rightTop[0] - leftTop[0]
      const height = leftBottom[1] - leftTop[1]
      ctx.fillRect(x, y, width, height)
    }
    ctx.restore()
  }
}
