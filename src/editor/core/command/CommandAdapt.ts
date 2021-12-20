import { ZERO } from "../../dataset/constant/Common"
import { EDITOR_ELEMENT_STYLE } from "../../dataset/constant/Element"
import { EditorContext } from "../../dataset/enum/Editor"
import { ElementType } from "../../dataset/enum/Element"
import { ElementStyleKey } from "../../dataset/enum/ElementStyle"
import { RowFlex } from "../../dataset/enum/Row"
import { IDrawImagePayload } from "../../interface/Draw"
import { IEditorOption } from "../../interface/Editor"
import { IElement, IElementStyle } from "../../interface/Element"
import { ISearchResult, ISearchResultRestArgs } from "../../interface/Search"
import { IColgroup } from "../../interface/table/Colgroup"
import { ITd } from "../../interface/table/Td"
import { ITr } from "../../interface/table/Tr"
import { getUUID } from "../../utils"
import { formatElementList } from "../../utils/element"
import { printImageBase64 } from "../../utils/print"
import { Draw } from "../draw/Draw"
import { TableTool } from "../draw/particle/table/TableTool"
import { CanvasEvent } from "../event/CanvasEvent"
import { HistoryManager } from "../history/HistoryManager"
import { Position } from "../position/Position"
import { RangeManager } from "../range/RangeManager"

export class CommandAdapt {

  private readonly defaultWidth: number = 40

  private draw: Draw
  private range: RangeManager
  private position: Position
  private historyManager: HistoryManager
  private canvasEvent: CanvasEvent
  private tableTool: TableTool
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.historyManager = draw.getHistoryManager()
    this.canvasEvent = draw.getCanvasEvent()
    this.tableTool = draw.getTableTool()
    this.options = draw.getOptions()
  }

  public cut() {
    this.canvasEvent.cut()
  }

  public copy() {
    this.canvasEvent.copy()
  }

  public async paste() {
    const text = await navigator.clipboard.readText()
    if (text) {
      this.canvasEvent.input(text)
    }
  }

  public selectAll() {
    this.canvasEvent.selectAll()
  }

  public undo() {
    this.historyManager.undo()
  }

  public redo() {
    this.historyManager.redo()
  }

  public painter() {
    const selection = this.range.getSelection()
    if (!selection) return
    const painterStyle: IElementStyle = {}
    selection.forEach(s => {
      const painterStyleKeys = EDITOR_ELEMENT_STYLE
      painterStyleKeys.forEach(p => {
        const key = p as keyof typeof ElementStyleKey
        if (painterStyle[key] === undefined) {
          painterStyle[key] = s[key] as any
        }
      })
    })
    this.draw.setPainterStyle(painterStyle)
  }

  public format() {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.font = ''
      el.color = ''
      el.bold = false
      el.italic = false
      el.underline = false
      el.strikeout = false
    })
    this.draw.render({ isSetCursor: false })
  }

  public font(payload: string) {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.font = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public sizeAdd() {
    const selection = this.range.getSelection()
    if (!selection) return
    const lessThanMaxSizeIndex = selection.findIndex(s => !s.size || s.size + 2 <= 72)
    const { defaultSize } = this.options
    if (!~lessThanMaxSizeIndex) return
    selection.forEach(el => {
      if (!el.size) {
        el.size = defaultSize
      }
      if (el.size + 2 > 72) return
      el.size += 2
    })
    this.draw.render({ isSetCursor: false })
  }

  public sizeMinus() {
    const selection = this.range.getSelection()
    if (!selection) return
    const greaterThanMaxSizeIndex = selection.findIndex(s => !s.size || s.size - 2 >= 8)
    if (!~greaterThanMaxSizeIndex) return
    const { defaultSize } = this.options
    selection.forEach(el => {
      if (!el.size) {
        el.size = defaultSize
      }
      if (el.size - 2 < 8) return
      el.size -= 2
    })
    this.draw.render({ isSetCursor: false })
  }

  public bold() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noBoldIndex = selection.findIndex(s => !s.bold)
    selection.forEach(el => {
      el.bold = !!~noBoldIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public italic() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noItalicIndex = selection.findIndex(s => !s.italic)
    selection.forEach(el => {
      el.italic = !!~noItalicIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public underline() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noUnderlineIndex = selection.findIndex(s => !s.underline)
    selection.forEach(el => {
      el.underline = !!~noUnderlineIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public strikeout() {
    const selection = this.range.getSelection()
    if (!selection) return
    const noStrikeoutIndex = selection.findIndex(s => !s.strikeout)
    selection.forEach(el => {
      el.strikeout = !!~noStrikeoutIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public color(payload: string) {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.color = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public highlight(payload: string) {
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.highlight = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public rowFlex(payload: RowFlex) {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === 0 && endIndex === 0) return
    const pageNo = this.draw.getPageNo()
    const positionList = this.position.getPositionList()
    // 开始/结束行号
    const startRowNo = positionList[startIndex].rowNo
    const endRowNo = positionList[endIndex].rowNo
    const elementList = this.draw.getElementList()
    // 当前选区所在行
    for (let p = 0; p < positionList.length; p++) {
      const postion = positionList[p]
      if (postion.pageNo !== pageNo) continue
      if (postion.rowNo > endRowNo) break
      if (postion.rowNo >= startRowNo && postion.rowNo <= endRowNo) {
        elementList[p].rowFlex = payload
      }
    }
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public rowMargin(payload: number) {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === 0 && endIndex === 0) return
    const pageNo = this.draw.getPageNo()
    const positionList = this.position.getPositionList()
    // 开始/结束行号
    const startRowNo = positionList[startIndex].rowNo
    const endRowNo = positionList[endIndex].rowNo
    const elementList = this.draw.getElementList()
    // 当前选区所在行
    for (let p = 0; p < positionList.length; p++) {
      const postion = positionList[p]
      if (postion.pageNo !== pageNo) continue
      if (postion.rowNo > endRowNo) break
      if (postion.rowNo >= startRowNo && postion.rowNo <= endRowNo) {
        elementList[p].rowMargin = payload
      }
    }
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public insertTable(row: number, col: number) {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === 0 && endIndex === 0) return
    const elementList = this.draw.getElementList()
    const { width, margins } = this.options
    const innerWidth = width - margins[1] - margins[3]
    // colgroup
    const colgroup: IColgroup[] = []
    const colWidth = innerWidth / col
    for (let c = 0; c < col; c++) {
      colgroup.push({
        width: colWidth
      })
    }
    // trlist
    const trList: ITr[] = []
    for (let r = 0; r < row; r++) {
      const tdList: ITd[] = []
      const tr: ITr = {
        height: 40,
        tdList
      }
      for (let c = 0; c < col; c++) {
        tdList.push({
          colspan: 1,
          rowspan: 1,
          value: [{ value: ZERO, size: 16 }]
        })
      }
      trList.push(tr)
    }
    const element: IElement = {
      type: ElementType.TABLE,
      value: ZERO,
      colgroup,
      trList
    }
    // 格式化element
    formatElementList([element])
    const curIndex = startIndex + 1
    if (startIndex === endIndex) {
      elementList.splice(curIndex, 0, element)
    } else {
      elementList.splice(curIndex, endIndex - startIndex, element)
    }
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex, isSetCursor: false })
  }

  public insertTableTopRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    // 之前跨行的增加跨行数
    if (curTr.tdList.length < element.colgroup!.length) {
      const curTrNo = curTr.tdList[0].rowIndex!
      for (let t = 0; t < trIndex!; t++) {
        const tr = curTrList[t]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          if (td.rowspan > 1 && td.rowIndex! + td.rowspan >= curTrNo + 1) {
            td.rowspan += 1
          }
        }
      }
    }
    // 增加当前行
    const newTrId = getUUID()
    const newTr: ITr = {
      height: curTr.height,
      id: newTrId,
      tdList: []
    }
    for (let t = 0; t < curTr.tdList.length; t++) {
      const curTd = curTr.tdList[t]
      const newTdId = getUUID()
      newTr.tdList.push({
        id: newTdId,
        rowspan: 1,
        colspan: curTd.colspan,
        value: [{
          value: ZERO,
          size: 16,
          tableId,
          trId: newTrId,
          tdId: newTdId
        }]
      })
    }
    curTrList.splice(trIndex!, 0, newTr)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public insertTableBottomRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    const anchorTr = curTrList.length - 1 === trIndex
      ? curTr
      : curTrList[trIndex! + 1]
    // 之前/当前行跨行的增加跨行数
    if (anchorTr.tdList.length < element.colgroup!.length) {
      const curTrNo = anchorTr.tdList[0].rowIndex!
      for (let t = 0; t < trIndex! + 1; t++) {
        const tr = curTrList[t]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          if (td.rowspan > 1 && td.rowIndex! + td.rowspan >= curTrNo + 1) {
            td.rowspan += 1
          }
        }
      }
    }
    // 增加当前行
    const newTrId = getUUID()
    const newTr: ITr = {
      height: anchorTr.height,
      id: newTrId,
      tdList: []
    }
    for (let t = 0; t < anchorTr.tdList.length; t++) {
      const curTd = anchorTr.tdList[t]
      const newTdId = getUUID()
      newTr.tdList.push({
        id: newTdId,
        rowspan: 1,
        colspan: curTd.colspan,
        value: [{
          value: ZERO,
          size: 16,
          tableId,
          trId: newTrId,
          tdId: newTdId
        }]
      })
    }
    curTrList.splice(trIndex! + 1, 0, newTr)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: trIndex! + 1,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public insertTableLeftCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex!
    // 增加列
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdId = getUUID()
      tr.tdList.splice(curTdIndex, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [{
          value: ZERO,
          size: 16,
          tableId,
          trId: tr.id,
          tdId
        }]
      })
    }
    // 重新计算宽度
    const colgroup = element.colgroup!
    colgroup.splice(curTdIndex, 0, {
      width: this.defaultWidth
    })
    const colgroupWidth = colgroup.reduce((pre, cur) => pre + cur.width, 0)
    const width = this.draw.getOriginalInnerWidth()
    if (colgroupWidth > width) {
      const adjustWidth = (colgroupWidth - width) / colgroup.length
      for (let g = 0; g < colgroup.length; g++) {
        const group = colgroup[g]
        group.width -= adjustWidth
      }
    }
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: 0,
      tdIndex: curTdIndex,
      tdId: curTrList[0].tdList[curTdIndex].id,
      trId: curTrList[0].id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public insertTableRightCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex! + 1
    // 增加列
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdId = getUUID()
      tr.tdList.splice(curTdIndex, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [{
          value: ZERO,
          size: 16,
          tableId,
          trId: tr.id,
          tdId
        }]
      })
    }
    // 重新计算宽度
    const colgroup = element.colgroup!
    colgroup.splice(curTdIndex, 0, {
      width: this.defaultWidth
    })
    const colgroupWidth = colgroup.reduce((pre, cur) => pre + cur.width, 0)
    const width = this.draw.getOriginalInnerWidth()
    if (colgroupWidth > width) {
      const adjustWidth = (colgroupWidth - width) / colgroup.length
      for (let g = 0; g < colgroup.length; g++) {
        const group = colgroup[g]
        group.width -= adjustWidth
      }
    }
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: 0,
      tdIndex: curTdIndex,
      tdId: curTrList[0].tdList[curTdIndex].id,
      trId: curTrList[0].id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public deleteTableRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    // 如果是最后一行，直接删除整个表格
    if (curTrList.length <= 1) {
      this.deleteTable()
      return
    }
    // 补跨行
    for (let d = 0; d < curTr.tdList.length; d++) {
      const td = curTr.tdList[d]
      if (td.rowspan > 1) {
        let start = trIndex! + 1
        while (start < trIndex! + td.rowspan) {
          const tdId = getUUID()
          const tr = curTrList[start]
          tr.tdList.splice(d, 0, {
            id: tdId,
            rowspan: 1,
            colspan: 1,
            value: [{
              value: ZERO,
              size: 16,
              tableId: element.id,
              trId: tr.id,
              tdId
            }]
          })
          start += 1
        }
      }
    }
    // 删除当前行
    curTrList.splice(trIndex!, 1)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ isSetCursor: false })
    this.tableTool.dispose()
  }

  public deleteTableCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTd = curTrList[trIndex!].tdList[tdIndex!]
    const curColIndex = curTd.colIndex!
    // 如果是最后一列，直接删除整个表格
    const moreTdTr = curTrList.find(tr => tr.tdList.length > 1)
    if (!moreTdTr) {
      this.deleteTable()
      return
    }
    // 跨列处理
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (td.colspan > 1) {
          const tdColIndex = td.colIndex!
          // 交叉减去一列
          if (tdColIndex <= curColIndex && tdColIndex + td.colspan - 1 >= curColIndex) {
            td.colspan -= 1
          }
        }
      }
    }
    // 删除当前列
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      let start = -1
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (td.colIndex === curColIndex) {
          start = d
        }
      }
      if (~start) {
        tr.tdList.splice(start, 1)
      }
    }
    element.colgroup?.splice(curColIndex, 1)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ isSetCursor: false })
    this.tableTool.dispose()
  }

  public deleteTable() {
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable) {
      const originalElementList = this.draw.getOriginalElementList()
      originalElementList.splice(positionContext.index!, 1)
      const curIndex = positionContext.index! - 1
      this.position.setPositionContext({
        isTable: false,
        index: curIndex
      })
      this.range.setRange(curIndex, curIndex)
      this.draw.render({ curIndex })
      this.tableTool.dispose()
    }
  }

  public image(payload: IDrawImagePayload) {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex === 0 && endIndex === 0) return
    const elementList = this.draw.getElementList()
    const { value, width, height } = payload
    const element: IElement = {
      value,
      width,
      height,
      id: getUUID(),
      type: ElementType.IMAGE
    }
    const curIndex = startIndex + 1
    if (startIndex === endIndex) {
      elementList.splice(curIndex, 0, element)
    } else {
      elementList.splice(curIndex, endIndex - startIndex, element)
    }
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public search(payload: string | null) {
    if (payload) {
      let searchMatchList: ISearchResult[] = []
      // elementList按table分隔
      const elementListGroup: { type: EditorContext, elementList: IElement[], index: number }[] = []
      const originalElementList = this.draw.getOriginalElementList()
      let lastTextElementList: IElement[] = []
      for (let e = 0; e < originalElementList.length; e++) {
        const element = originalElementList[e]
        if (element.type === ElementType.TABLE) {
          if (lastTextElementList.length) {
            elementListGroup.push({
              index: e,
              type: EditorContext.PAGE,
              elementList: lastTextElementList
            })
            lastTextElementList = []
          }
          elementListGroup.push({
            index: e,
            type: EditorContext.TABLE,
            elementList: [element]
          })
        } else {
          lastTextElementList.push(element)
        }
      }
      // 搜索文本
      function searchClosure(payload: string | null, type: EditorContext, elementList: IElement[], restArgs?: ISearchResultRestArgs) {
        if (!payload) return
        const text = elementList.map(e => !e.type || e.type === ElementType.TEXT ? e.value : ZERO)
          .filter(Boolean)
          .join('')
        const matchStartIndexList = []
        let index = text.indexOf(payload)
        while (index !== -1) {
          matchStartIndexList.push(index)
          index = text.indexOf(payload, index + 1)
        }
        for (let m = 0; m < matchStartIndexList.length; m++) {
          const startIndex = matchStartIndexList[m]
          for (let i = 0; i < payload.length; i++) {
            const index = startIndex + i
            searchMatchList.push({
              type,
              index,
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
                tableIndex: group.index,
                trIndex: t,
                tdIndex: d
              }
              searchClosure(payload, group.type, td.value, restArgs)
            }
          }
        } else {
          searchClosure(payload, group.type, group.elementList)
        }
      }
      this.draw.setSearchMatch(searchMatchList)
    } else {
      this.draw.setSearchMatch(null)
    }
    this.draw.render({ isSetCursor: false, isSubmitHistory: false })
  }

  public print() {
    const { width, height, scale } = this.options
    if (scale !== 1) {
      this.draw.setPageScale(1)
    }
    printImageBase64(this.draw.getDataURL(), width, height)
    if (scale !== 1) {
      this.draw.setPageScale(scale)
    }
  }

  public pageScaleRecovery() {
    const { scale } = this.options
    if (scale !== 1) {
      this.draw.setPageScale(1)
    }
  }

  public pageScaleMinus() {
    const { scale } = this.options
    const nextScale = scale * 10 - 1
    if (nextScale >= 5) {
      this.draw.setPageScale(nextScale / 10)
    }
  }

  public pageScaleAdd() {
    const { scale } = this.options
    const nextScale = scale * 10 + 1
    if (nextScale <= 30) {
      this.draw.setPageScale(nextScale / 10)
    }
  }

}