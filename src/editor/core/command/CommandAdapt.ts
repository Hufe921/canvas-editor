import { WRAP, ZERO } from '../../dataset/constant/Common'
import { EDITOR_ELEMENT_STYLE_ATTR } from '../../dataset/constant/Element'
import { defaultWatermarkOption } from '../../dataset/constant/Watermark'
import { ControlComponent } from '../../dataset/enum/Control'
import { EditorContext, EditorMode, PageMode } from '../../dataset/enum/Editor'
import { ElementType } from '../../dataset/enum/Element'
import { ElementStyleKey } from '../../dataset/enum/ElementStyle'
import { RowFlex } from '../../dataset/enum/Row'
import { IDrawImagePayload, IPainterOptions } from '../../interface/Draw'
import { IEditorOption, IEditorResult } from '../../interface/Editor'
import { IElement, IElementStyle } from '../../interface/Element'
import { IColgroup } from '../../interface/table/Colgroup'
import { ITd } from '../../interface/table/Td'
import { ITr } from '../../interface/table/Tr'
import { IWatermark } from '../../interface/Watermark'
import { downloadFile, getUUID } from '../../utils'
import { formatElementList } from '../../utils/element'
import { printImageBase64 } from '../../utils/print'
import { Control } from '../draw/control/Control'
import { Draw } from '../draw/Draw'
import { TableTool } from '../draw/particle/table/TableTool'
import { CanvasEvent } from '../event/CanvasEvent'
import { HistoryManager } from '../history/HistoryManager'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { WorkerManager } from '../worker/WorkerManager'


export class CommandAdapt {

  private readonly defaultWidth: number = 40

  private draw: Draw
  private range: RangeManager
  private position: Position
  private historyManager: HistoryManager
  private canvasEvent: CanvasEvent
  private tableTool: TableTool
  private options: Required<IEditorOption>
  private control: Control
  private workerManager: WorkerManager

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.historyManager = draw.getHistoryManager()
    this.canvasEvent = draw.getCanvasEvent()
    this.tableTool = draw.getTableTool()
    this.options = draw.getOptions()
    this.control = draw.getControl()
    this.workerManager = draw.getWorkerManager()
  }

  public mode(payload: EditorMode) {
    const mode = this.draw.getMode()
    if (mode === payload) return
    this.draw.setMode(payload)
    this.draw.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public cut() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.canvasEvent.cut()
  }

  public copy() {
    this.canvasEvent.copy()
  }

  public async paste() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const text = await navigator.clipboard.readText()
    if (text) {
      this.canvasEvent.input(text)
    }
  }

  public selectAll() {
    this.canvasEvent.selectAll()
  }

  public backspace() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const elementList = this.draw.getElementList()
    const { startIndex, endIndex } = this.range.getRange()
    const isCollapsed = startIndex === endIndex
    // ?????????????????????
    if (isCollapsed && elementList[startIndex].value === ZERO && startIndex === 0) {
      return
    }
    if (!isCollapsed) {
      elementList.splice(startIndex + 1, endIndex - startIndex)
    } else {
      elementList.splice(startIndex, 1)
    }
    const curIndex = isCollapsed ? startIndex - 1 : startIndex
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public setRange(startIndex: number, endIndex: number) {
    if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) return
    this.range.setRange(startIndex, endIndex)
    const isCollapsed = startIndex === endIndex
    this.draw.render({
      curIndex: isCollapsed ? startIndex : undefined,
      isComputeRowList: false,
      isSubmitHistory: false,
      isSetCursor: isCollapsed
    })
  }

  public undo() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.historyManager.undo()
  }

  public redo() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.historyManager.redo()
  }

  public painter(options: IPainterOptions) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const painterStyle: IElementStyle = {}
    selection.forEach(s => {
      const painterStyleKeys = EDITOR_ELEMENT_STYLE_ATTR
      painterStyleKeys.forEach(p => {
        const key = p as keyof typeof ElementStyleKey
        if (painterStyle[key] === undefined) {
          painterStyle[key] = s[key] as any
        }
      })
    })
    this.draw.setPainterStyle(painterStyle, options)
  }

  public applyPainterStyle() {
    this.canvasEvent.applyPainterStyle()
  }

  public format() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
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
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.font = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public sizeAdd() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
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
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
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
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noBoldIndex = selection.findIndex(s => !s.bold)
    selection.forEach(el => {
      el.bold = !!~noBoldIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public italic() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noItalicIndex = selection.findIndex(s => !s.italic)
    selection.forEach(el => {
      el.italic = !!~noItalicIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public underline() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noUnderlineIndex = selection.findIndex(s => !s.underline)
    selection.forEach(el => {
      el.underline = !!~noUnderlineIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public strikeout() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    const noStrikeoutIndex = selection.findIndex(s => !s.strikeout)
    selection.forEach(el => {
      el.strikeout = !!~noStrikeoutIndex
    })
    this.draw.render({ isSetCursor: false })
  }

  public superscript() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const selection = this.range.getSelection()
    if (!selection) return
    const superscriptIndex = selection.findIndex(s => s.type === ElementType.SUPERSCRIPT)
    selection.forEach(el => {
      // ????????????
      if (~superscriptIndex) {
        if (el.type === ElementType.SUPERSCRIPT) {
          el.type = ElementType.TEXT
          delete el.actualSize
        }
      } else {
        // ????????????
        if (!el.type || el.type === ElementType.TEXT || el.type === ElementType.SUBSCRIPT) {
          el.type = ElementType.SUPERSCRIPT
        }
      }
    })
    this.draw.render({ isSetCursor: false })
  }

  public subscript() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const selection = this.range.getSelection()
    if (!selection) return
    const subscriptIndex = selection.findIndex(s => s.type === ElementType.SUBSCRIPT)
    selection.forEach(el => {
      // ????????????
      if (~subscriptIndex) {
        if (el.type === ElementType.SUBSCRIPT) {
          el.type = ElementType.TEXT
          delete el.actualSize
        }
      } else {
        // ????????????
        if (!el.type || el.type === ElementType.TEXT || el.type === ElementType.SUPERSCRIPT) {
          el.type = ElementType.SUBSCRIPT
        }
      }
    })
    this.draw.render({ isSetCursor: false })
  }

  public color(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.color = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public highlight(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const selection = this.range.getSelection()
    if (!selection) return
    selection.forEach(el => {
      el.highlight = payload
    })
    this.draw.render({ isSetCursor: false })
  }

  public rowFlex(payload: RowFlex) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const pageNo = this.draw.getPageNo()
    const positionList = this.position.getPositionList()
    // ??????/????????????
    const startRowNo = positionList[startIndex].rowNo
    const endRowNo = positionList[endIndex].rowNo
    const elementList = this.draw.getElementList()
    // ?????????????????????
    for (let p = 0; p < positionList.length; p++) {
      const position = positionList[p]
      if (position.pageNo !== pageNo) continue
      if (position.rowNo > endRowNo) break
      if (position.rowNo >= startRowNo && position.rowNo <= endRowNo) {
        elementList[p].rowFlex = payload
      }
    }
    // ????????????
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public rowMargin(payload: number) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const pageNo = this.draw.getPageNo()
    const positionList = this.position.getPositionList()
    // ??????/????????????
    const startRowNo = positionList[startIndex].rowNo
    const endRowNo = positionList[endIndex].rowNo
    const elementList = this.draw.getElementList()
    // ?????????????????????
    for (let p = 0; p < positionList.length; p++) {
      const position = positionList[p]
      if (position.pageNo !== pageNo) continue
      if (position.rowNo > endRowNo) break
      if (position.rowNo >= startRowNo && position.rowNo <= endRowNo) {
        elementList[p].rowMargin = payload
      }
    }
    // ????????????
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public insertTable(row: number, col: number) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
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
    // ?????????element
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
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    // ??????????????????????????????
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
    // ???????????????
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
    // ?????????????????????
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
    // ????????????
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public insertTableBottomRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
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
    // ??????/?????????????????????????????????
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
    // ???????????????
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
    // ?????????????????????
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
    // ????????????
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public insertTableLeftCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex!
    // ?????????
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
    // ??????????????????
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
    // ?????????????????????
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
    // ????????????
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public insertTableRightCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex! + 1
    // ?????????
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
    // ??????????????????
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
    // ?????????????????????
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
    // ????????????
    this.draw.render({ curIndex: 0 })
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public deleteTableRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    // ????????????????????????????????????????????????
    if (curTrList.length <= 1) {
      this.deleteTable()
      return
    }
    // ?????????
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
    // ???????????????
    curTrList.splice(trIndex!, 1)
    // ?????????????????????
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(0, 0)
    // ????????????
    this.draw.render({
      curIndex: positionContext.index
    })
    this.tableTool.dispose()
  }

  public deleteTableCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTd = curTrList[trIndex!].tdList[tdIndex!]
    const curColIndex = curTd.colIndex!
    // ????????????????????????????????????????????????
    const moreTdTr = curTrList.find(tr => tr.tdList.length > 1)
    if (!moreTdTr) {
      this.deleteTable()
      return
    }
    // ????????????
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (td.colspan > 1) {
          const tdColIndex = td.colIndex!
          // ??????????????????
          if (tdColIndex <= curColIndex && tdColIndex + td.colspan - 1 >= curColIndex) {
            td.colspan -= 1
          }
        }
      }
    }
    // ???????????????
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
    // ?????????????????????
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(0, 0)
    // ????????????
    this.draw.render({
      curIndex: positionContext.index
    })
    this.tableTool.dispose()
  }

  public deleteTable() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
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

  public mergeTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { isCrossRowCol, startTdIndex, endTdIndex, startTrIndex, endTrIndex } = this.range.getRange()
    if (!isCrossRowCol) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    let startTd = curTrList[startTrIndex!].tdList[startTdIndex!]
    let endTd = curTrList[endTrIndex!].tdList[endTdIndex!]
    // ??????????????????
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    // ????????????
    const rowCol: ITd[][] = []
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdList: ITd[] = []
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const tdColIndex = td.colIndex!
        const tdRowIndex = td.rowIndex!
        if (
          tdColIndex >= startColIndex && tdColIndex <= endColIndex
          && tdRowIndex >= startRowIndex && tdRowIndex <= endRowIndex
        ) {
          tdList.push(td)
        }
      }
      if (tdList.length) {
        rowCol.push(tdList)
      }
    }
    if (!rowCol.length) return
    // ???????????????
    const lastRow = rowCol[rowCol.length - 1]
    const leftTop = rowCol[0][0]
    const rightBottom = lastRow[lastRow.length - 1]
    const startX = leftTop.x!
    const startY = leftTop.y!
    const endX = rightBottom.x! + rightBottom.width!
    const endY = rightBottom.y! + rightBottom.height!
    for (let t = 0; t < rowCol.length; t++) {
      const tr = rowCol[t]
      for (let d = 0; d < tr.length; d++) {
        const td = tr[d]
        const tdStartX = td.x!
        const tdStartY = td.y!
        const tdEndX = tdStartX + td.width!
        const tdEndY = tdStartY + td.height!
        // ??????????????????
        if (startX > tdStartX || startY > tdStartY || endX < tdEndX || endY < tdEndY) {
          return
        }
      }
    }
    // ???????????????
    const mergeTdIdList: string[] = []
    const anchorTd = rowCol[0][0]
    for (let t = 0; t < rowCol.length; t++) {
      const tr = rowCol[t]
      for (let d = 0; d < tr.length; d++) {
        const td = tr[d]
        const isAnchorTd = t === 0 && d === 0
        // ???????????????id
        if (!isAnchorTd) {
          mergeTdIdList.push(td.id!)
        }
        // ?????????
        if (t === 0 && d !== 0) {
          anchorTd.colspan += td.colspan
        }
        // ?????????
        if (t !== 0) {
          if (anchorTd.colIndex === td.colIndex) {
            anchorTd.rowspan += td.rowspan
          }
        }
      }
    }
    // ?????????????????????
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      let d = 0
      while (d < tr.tdList.length) {
        const td = tr.tdList[d]
        if (mergeTdIdList.includes(td.id!)) {
          tr.tdList.splice(d, 1)
          d--
        }
        d++
      }
    }
    // ????????????
    const curIndex = startTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render()
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public cancelMergeTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]!
    const curTd = curTr.tdList[tdIndex!]
    if (curTd.rowspan === 1 && curTd.colspan === 1) return
    const colspan = curTd.colspan
    // ????????????
    if (curTd.colspan > 1) {
      for (let c = 1; c < curTd.colspan; c++) {
        const tdId = getUUID()
        curTr.tdList.splice(tdIndex! + c, 0, {
          id: tdId,
          rowspan: 1,
          colspan: 1,
          value: [{
            value: ZERO,
            size: 16,
            tableId: element.id,
            trId: curTr.id,
            tdId
          }]
        })
      }
      curTd.colspan = 1
    }
    // ????????????
    if (curTd.rowspan > 1) {
      for (let r = 1; r < curTd.rowspan; r++) {
        const tr = curTrList[trIndex! + r]
        for (let c = 0; c < colspan; c++) {
          const tdId = getUUID()
          tr.tdList.splice(curTd.colIndex!, 0, {
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
        }
      }
      curTd.rowspan = 1
    }
    // ????????????
    const curIndex = curTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render()
    const position = this.position.getOriginalPositionList()
    this.tableTool.render(element, position[index!])
  }

  public hyperlink(payload: IElement) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const elementList = this.draw.getElementList()
    const { valueList, url } = payload
    const hyperlinkId = getUUID()
    const newElementList = valueList?.map<IElement>(v => ({
      url,
      hyperlinkId,
      value: v.value,
      type: ElementType.HYPERLINK
    }))
    if (!newElementList) return
    const start = startIndex + 1
    if (startIndex === endIndex) {
      elementList.splice(start, 0, ...newElementList)
    } else {
      elementList.splice(start, endIndex - startIndex, ...newElementList)
    }
    const curIndex = start + newElementList.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public getHyperlinkRange(): [number, number] | null {
    let leftIndex = -1
    let rightIndex = -1
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return null
    const elementList = this.draw.getElementList()
    const startElement = elementList[startIndex]
    if (startElement.type !== ElementType.HYPERLINK) return null
    // ????????????
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (preElement.hyperlinkId !== startElement.hyperlinkId) {
        leftIndex = preIndex
        break
      }
      preIndex--
    }
    // ????????????
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (nextElement.hyperlinkId !== startElement.hyperlinkId) {
        rightIndex = nextIndex - 1
        break
      }
      nextIndex++
    }
    // ???????????????
    if (nextIndex === elementList.length) {
      rightIndex = nextIndex - 1
    }
    if (!~leftIndex || !~rightIndex) return null
    return [leftIndex, rightIndex]
  }

  public deleteHyperlink() {
    // ?????????????????????
    const hyperRange = this.getHyperlinkRange()
    if (!hyperRange) return
    const elementList = this.draw.getElementList()
    const [leftIndex, rightIndex] = hyperRange
    // ????????????
    elementList.splice(leftIndex + 1, rightIndex - leftIndex)
    this.draw.getHyperlinkParticle().clearHyperlinkPopup()
    // ????????????
    this.range.setRange(leftIndex, leftIndex)
    this.draw.render({
      curIndex: leftIndex
    })
  }

  public cancelHyperlink() {
    // ?????????????????????
    const hyperRange = this.getHyperlinkRange()
    if (!hyperRange) return
    const elementList = this.draw.getElementList()
    const [leftIndex, rightIndex] = hyperRange
    // ????????????
    for (let i = leftIndex; i <= rightIndex; i++) {
      const element = elementList[i]
      delete element.type
      delete element.url
      delete element.hyperlinkId
      delete element.underline
    }
    this.draw.getHyperlinkParticle().clearHyperlinkPopup()
    // ????????????
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex,
      isComputeRowList: false
    })
  }

  public separator(payload: number[]) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const elementList = this.draw.getElementList()
    let curIndex = -1
    // ??????????????????????????????????????????????????????
    const endElement = elementList[endIndex + 1]
    if (endElement && endElement.type === ElementType.SEPARATOR) {
      if (endElement.dashArray && endElement.dashArray.join() === payload.join()) return
      curIndex = endIndex
      endElement.dashArray = payload
    } else {
      const newElement: IElement = {
        value: WRAP,
        type: ElementType.SEPARATOR,
        dashArray: payload
      }
      // ????????????????????????
      if (startIndex !== 0 && elementList[startIndex].value === ZERO) {
        elementList.splice(startIndex, 1, newElement)
        curIndex = startIndex - 1
      } else {
        elementList.splice(startIndex + 1, 0, newElement)
        curIndex = startIndex
      }
    }
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public pageBreak() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    this.insertElementList([{
      type: ElementType.PAGE_BREAK,
      value: WRAP
    }])
  }

  public addWatermark(payload: IWatermark) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const options = this.draw.getOptions()
    const { color, size, opacity, font } = defaultWatermarkOption
    options.watermark.data = payload.data
    options.watermark.color = payload.color || color
    options.watermark.size = payload.size || size
    options.watermark.opacity = payload.opacity || opacity
    options.watermark.font = payload.font || font
    this.draw.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public deleteWatermark() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const options = this.draw.getOptions()
    if (options.watermark && options.watermark.data) {
      options.watermark = { ...defaultWatermarkOption }
      this.draw.render({
        isSetCursor: false,
        isSubmitHistory: false
      })
    }
  }

  public image(payload: IDrawImagePayload) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
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
    this.draw.setSearchKeyword(payload)
    this.draw.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public replace(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    if (!payload || new RegExp(`${ZERO}`, 'g').test(payload)) return
    const matchList = this.draw.getSearch().getSearchMatchList()
    if (!matchList.length) return
    // ??????index???????????????
    let pageDiffCount = 0
    let tableDiffCount = 0
    // ???????????????????????????
    let curGroupId = ''
    // ???????????????
    let curTdId = ''
    // ????????? > ???????????????????????????????????? < ????????????????????????
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
        const tableElementList = elementList[curTableIndex].trList![trIndex!].tdList[tdIndex!].value
        // ???????????????
        const curIndex = index + tableDiffCount
        const tableElement = tableElementList[curIndex]
        if (curGroupId === match.groupId) {
          tableElementList.splice(curIndex, 1)
          tableDiffCount--
          continue
        }
        for (let p = 0; p < payload.length; p++) {
          const value = payload[p]
          if (p === 0) {
            tableElement.value = value
          } else {
            tableElementList.splice(curIndex + p, 0, {
              ...tableElement,
              value
            })
            tableDiffCount++
          }
        }
      } else {
        const curIndex = match.index + pageDiffCount
        const element = elementList[curIndex]
        if (
          element.type === ElementType.CONTROL
          && element.controlComponent !== ControlComponent.VALUE
        ) {
          continue
        }
        if (!~firstMatchIndex) {
          firstMatchIndex = m
        }
        if (curGroupId === match.groupId) {
          elementList.splice(curIndex, 1)
          pageDiffCount--
          continue
        }
        for (let p = 0; p < payload.length; p++) {
          const value = payload[p]
          if (p === 0) {
            element.value = value
          } else {
            elementList.splice(curIndex + p, 0, {
              ...element,
              value
            })
            pageDiffCount++
          }
        }
      }
      curGroupId = match.groupId
    }
    if (!~firstMatchIndex) return
    // ??????-???????????????????????????
    const firstMatch = matchList[firstMatchIndex]
    const firstIndex = firstMatch.index + (payload.length - 1)
    if (firstMatch.type === EditorContext.TABLE) {
      const { tableIndex, trIndex, tdIndex, index } = firstMatch
      const element = elementList[tableIndex!].trList![trIndex!].tdList[tdIndex!].value[index]
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
    this.range.setRange(firstIndex, firstIndex)
    // ????????????
    this.draw.render({
      curIndex: firstIndex
    })
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

  public replaceImageElement(payload: string) {
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    const element = elementList[startIndex]
    if (!element || element.type !== ElementType.IMAGE) return
    // ????????????
    element.id = getUUID()
    element.value = payload
    this.draw.render({
      isSetCursor: false
    })
  }

  public saveAsImageElement() {
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    const element = elementList[startIndex]
    if (!element || element.type !== ElementType.IMAGE) return
    downloadFile(element.value, `${element.id!}.png`)
  }

  public getImage(): string[] {
    return this.draw.getDataURL()
  }

  public getValue(): IEditorResult {
    return this.draw.getValue()
  }

  public getWordCount(): Promise<number> {
    return this.workerManager.getWordCount()
  }

  public pageMode(payload: PageMode) {
    this.draw.setPageMode(payload)
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

  public insertElementList(payload: IElement[]) {
    if (!payload.length) return
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.draw.insertElementList(payload)
  }

  public removeControl() {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex !== endIndex) return
    const elementList = this.draw.getElementList()
    const element = elementList[startIndex]
    if (element.type !== ElementType.CONTROL) return
    // ????????????
    const control = this.draw.getControl()
    const newIndex = control.removeControl(startIndex)
    // ????????????
    this.range.setRange(newIndex, newIndex)
    this.draw.render({
      curIndex: newIndex
    })
  }

}