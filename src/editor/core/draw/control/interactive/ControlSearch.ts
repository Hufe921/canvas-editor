import { ZERO } from '../../../../dataset/constant/Common'
import { ControlComponent } from '../../../../dataset/enum/Control'
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
  private control: Control
  private options: DeepRequired<IEditorOption>
  private highlightList: IControlHighlight[]
  private highlightMatchResult: IHighlightMatchResult

  constructor(control: Control) {
    this.draw = control.getDraw()
    this.control = control
    this.options = this.draw.getOptions()

    this.highlightList = []
    this.highlightMatchResult = []
  }

  // 获取控件设置高亮信息
  public getControlHighlight(elementList: IElement[], index: number) {
    const {
      control: {
        activeBackgroundColor,
        disabledBackgroundColor,
        existValueBackgroundColor,
        noValueBackgroundColor
      }
    } = this.options
    const element = elementList[index]
    const isPrintMode = this.draw.isPrintMode()
    const activeControlElement = this.control.getActiveControl()?.getElement()
    // 颜色配置：元素 > 控件激活 > 控件禁用 > 控件存在值 > 控件不存在值
    let isActiveControlHighlight = false
    let isDisabledControlHighlight = false
    let isExitsValueControlHighlight = false
    let isNoValueControlHighlight = false
    if (!element.highlight) {
      // 控件激活时高亮色
      isActiveControlHighlight =
        !isPrintMode &&
        !!activeBackgroundColor &&
        !!activeControlElement &&
        element.controlId === activeControlElement.controlId &&
        !this.control.getIsRangeInPostfix()
    }
    if (!isActiveControlHighlight) {
      // 控件禁用时高亮色
      isDisabledControlHighlight =
        !isPrintMode && !!disabledBackgroundColor && !!element.control?.disabled
    }
    if (!isDisabledControlHighlight) {
      // 控件存在值时高亮色
      isExitsValueControlHighlight =
        !isPrintMode &&
        !!existValueBackgroundColor &&
        !!element.controlId &&
        this.control.getIsExistValueByElementListIndex(elementList, index)
    }
    if (!isExitsValueControlHighlight) {
      // 控件不存在值时高亮色
      isNoValueControlHighlight =
        !isPrintMode &&
        !!noValueBackgroundColor &&
        !!element.controlId &&
        !this.control.getIsExistValueByElementListIndex(elementList, index)
    }
    return (
      (isActiveControlHighlight ? activeBackgroundColor : '') ||
      (isDisabledControlHighlight ? disabledBackgroundColor : '') ||
      (isExitsValueControlHighlight ? existValueBackgroundColor : '') ||
      (isNoValueControlHighlight ? noValueBackgroundColor : '')
    )
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
        const currentControl = element?.control
        if (!currentControl) continue
        const highlightIndex = this.highlightList.findIndex(
          highlight =>
            highlight.id === element.controlId ||
            (currentControl.conceptId &&
              currentControl.conceptId === highlight.conceptId)
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
        const controlElementList = elementList
          .slice(startIndex, newEndIndex)
          .map(element =>
            element.controlComponent === ControlComponent.VALUE
              ? element
              : { value: ZERO }
          )
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
