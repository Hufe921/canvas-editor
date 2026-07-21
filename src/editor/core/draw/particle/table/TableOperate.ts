import { ElementType, IElement, TableBorder, VerticalAlign } from '../../../..'
import { ZERO } from '../../../../dataset/constant/Common'
import { TABLE_CONTEXT_ATTR } from '../../../../dataset/constant/Element'
import { TdBorder, TdSlash } from '../../../../dataset/enum/table/Table'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { IColgroup } from '../../../../interface/table/Colgroup'
import { ITd } from '../../../../interface/table/Td'
import { ITr } from '../../../../interface/table/Tr'
import { cloneProperty, getUUID, deepClone } from '../../../../utils'
import {
  formatElementContext,
  formatElementList
} from '../../../../utils/element'
import { Position } from '../../../position/Position'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'
import { TableParticle } from './TableParticle'
import { TableTool } from './TableTool'

export class TableOperate {
  private draw: Draw
  private range: RangeManager
  private position: Position
  private tableTool: TableTool
  private tableParticle: TableParticle
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.tableTool = draw.getTableTool()
    this.tableParticle = draw.getTableParticle()
    this.options = draw.getOptions()
  }

  public insertTable(row: number, col: number) {
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable) {
      const originalElementList = this.draw.getOriginalElementList()
      let curIndex = positionContext.index ?? originalElementList.length - 1
      if (curIndex < 0) {
        curIndex = originalElementList.length - 1
      }
      const tableElement = originalElementList[curIndex]
      const pagingId = tableElement?.pagingId
      if (pagingId) {
        for (let i = curIndex + 1; i < originalElementList.length; i++) {
          if (originalElementList[i].pagingId === pagingId) {
            curIndex = i
          }
        }
      }
      this.position.setPositionContext({
        isTable: false,
        index: curIndex
      })
      this.range.setRange(curIndex, curIndex)
    }
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const { defaultTrMinHeight } = this.options.table
    const elementList = this.draw.getElementList()
    let offsetX = 0
    if (elementList[startIndex]?.listId) {
      const positionList = this.position.getPositionList()
      const { rowIndex } = positionList[startIndex]
      const rowList = this.draw.getRowList()
      const row = rowList[rowIndex]
      offsetX = row?.offsetX || 0
    }
    const innerWidth = this.draw.getContextInnerWidth() - offsetX
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
        height: defaultTrMinHeight,
        tdList
      }
      for (let c = 0; c < col; c++) {
        tdList.push({
          colspan: 1,
          rowspan: 1,
          value: []
        })
      }
      trList.push(tr)
    }
    const element: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup,
      trList
    }
    // 格式化element
    formatElementList([element], {
      editorOptions: this.options
    })
    formatElementContext(elementList, [element], startIndex, {
      editorOptions: this.options
    })
    const curIndex = startIndex + 1
    this.draw.spliceElementList(
      elementList,
      curIndex,
      startIndex === endIndex ? 0 : endIndex - startIndex,
      [element]
    )
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex, isSetCursor: false })
  }

  /**
   * 拆分表格合并
   * @param index 表格索引
   */
  public combineTable(pagingId: string, elementList?: IElement[]) {
    // 从原始元素列表中获取当前元素
    const originalElementList =
      elementList || this.draw.getOriginalElementList()

    // 获取相同pagingId的表格
    const allTableList = originalElementList.filter(
      item => item.pagingId === pagingId
    )

    const oneTable = deepClone(allTableList[0])
    if (!oneTable) {
      return {
        combineTable: {} as any,
        startIndex: -1,
        endIndex: -1
      }
    }
    // 获取第一个表格的索引
    const firstTableIndex = originalElementList.findIndex(
      (item: IElement) => item && item.id === oneTable.id
    )

    // 合并表格
    const allTrList = [...oneTable.trList!]
    allTableList.forEach((item, i) => {
      if (i !== 0) {
        const nexTrList = item.trList!.filter(tr => !tr.pagingRepeat)
        allTrList.push(...nexTrList)
        oneTable.height! += item.height!
      }
    })

    oneTable.trList = this._mergePagedTrList(allTrList)
    // 合并后的表格，分页Id和索引都为空
    oneTable.pagingId = ''
    oneTable.pagingIndex = undefined
    return {
      combineTable: oneTable,
      startIndex: firstTableIndex,
      endIndex: originalElementList.findIndex(
        (item: IElement) =>
          item && item.id === allTableList[allTableList.length - 1].id
      )
    }
  }

  /**
   * 合并元素列表中所有分页拆分的表格
   * 用于保存数据时将分页后的表格片段合并回原始表格
   */
  public mergeAllPagedTables(elementList: IElement[]): IElement[] {
    const result: IElement[] = []
    const mergedPagingIds = new Set<string>()

    for (let i = 0; i < elementList.length; i++) {
      const element = elementList[i]
      // 如果该表格有pagingId且是第一个片段，需要合并
      if (
        element.type === ElementType.TABLE &&
        element.pagingId &&
        element.pagingIndex === 0 &&
        !mergedPagingIds.has(element.pagingId)
      ) {
        mergedPagingIds.add(element.pagingId)
        // 查找所有同pagingId的表格片段
        const allFragments: IElement[] = []
        for (let j = i; j < elementList.length; j++) {
          const e = elementList[j]
          if (e.type === ElementType.TABLE && e.pagingId === element.pagingId) {
            allFragments.push(e)
          }
        }
        // 执行合并
        const merged = this._mergeTableFragments(allFragments)
        result.push(merged)
        // 跳过已处理的片段
        i += allFragments.length - 1
      } else if (
        element.type === ElementType.TABLE &&
        element.pagingId &&
        element.pagingIndex !== 0
      ) {
        // 非首个片段，已在上面处理中跳过
        continue
      } else {
        result.push(element)
      }
    }

    return result
  }

  /**
   * 合并同一pagingId的表格片段
   */
  private _mergeTableFragments(fragments: IElement[]): IElement {
    const oneTable = deepClone(fragments[0])
    const allTrList = [...oneTable.trList!]
    fragments.forEach((item, i) => {
      if (i !== 0) {
        const nexTrList = item.trList!.filter(tr => !tr.pagingRepeat)
        allTrList.push(...nexTrList)
        oneTable.height! += item.height!
      }
    })

    oneTable.trList = this._mergePagedTrList(allTrList)
    oneTable.pagingId = ''
    oneTable.pagingIndex = undefined
    return oneTable
  }

  private _mergePagedTrList(allTrList: ITr[]): ITr[] {
    const trMap = new Map<number, ITr[]>()
    allTrList.forEach((tr, index) => {
      const rowIndex = tr.originalRowIndex ?? index
      if (!trMap.has(rowIndex)) trMap.set(rowIndex, [])
      trMap.get(rowIndex)!.push(tr)
    })

    const hasRowspanFragment = allTrList.some(tr =>
      tr.tdList.some(td => td.originalTdId)
    )
    if (!hasRowspanFragment) {
      return Array.from(trMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([, trs]) => {
          const mergedTr = deepClone(trs[0])
          mergedTr.tdList.forEach((td, tdIndex) => {
            td.value = []
            trs.forEach(tr => {
              if (tr.tdList[tdIndex]?.value) {
                td.value.push(...tr.tdList[tdIndex].value)
              }
            })
          })
          return mergedTr
        })
    }

    const tdFragmentMap = new Map<
      string,
      { rowIndex: number; tdIndex: number; fragments: ITd[] }
    >()
    allTrList.forEach(tr => {
      tr.tdList.forEach((td, tdIndex) => {
        const rowIndex = td.originalRowIndex ?? tr.originalRowIndex ?? 0
        const originalTdIndex = td.originalTdIndex ?? tdIndex
        const key = td.originalTdId || `${rowIndex}_${originalTdIndex}`
        if (!tdFragmentMap.has(key)) {
          tdFragmentMap.set(key, {
            rowIndex,
            tdIndex: originalTdIndex,
            fragments: []
          })
        }
        tdFragmentMap.get(key)!.fragments.push(td)
      })
    })

    const mergedTrList = Array.from(trMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([rowIndex, trs]) => {
        const mergedTr = deepClone(trs[0])
        // 分页片段高度是渲染时的临时布局结果，合并后必须恢复原行的
        // 最小高度，让下一次布局根据合并后的内容重新测量。
        const mergedTrHeight =
          mergedTr.minHeight || this.options.table.defaultTrMinHeight
        mergedTr.height = mergedTrHeight
        mergedTr.minHeight = mergedTrHeight
        mergedTr.tdList = []
        tdFragmentMap.forEach(fragmentInfo => {
          if (fragmentInfo.rowIndex !== rowIndex) return
          const { fragments } = fragmentInfo
          const firstTd = fragments[0]
          const mergedTd = deepClone(firstTd)
          if (firstTd.originalTdId) mergedTd.id = firstTd.originalTdId
          mergedTd.rowspan = firstTd.originalRowspan || firstTd.rowspan
          mergedTd.value = []
          const sortedFragments = fragments.sort(
            (a, b) =>
              (a.pagingFragmentIndex || 0) - (b.pagingFragmentIndex || 0)
          )
          mergedTd.pagingFragmentValues = sortedFragments.map(td => td.value)
          sortedFragments.forEach(td => {
            const isEmptyPlaceholder =
              td.pagingPlaceholder && td.value.every(item => !item.value)
            if (!isEmptyPlaceholder) mergedTd.value.push(...td.value)
          })
          if (!mergedTd.value.length) mergedTd.value = [{ value: '' }]

          delete mergedTd.originalRowIndex
          delete mergedTd.originalTdIndex
          delete mergedTd.originalTdId
          delete mergedTd.originalRowspan
          delete mergedTd.pagingFragmentIndex
          delete mergedTd.pagingPlaceholder
          mergedTr.tdList.push(mergedTd)
        })
        mergedTr.tdList.sort((a, b) => (a.colIndex || 0) - (b.colIndex || 0))
        return mergedTr
      })

    return mergedTrList
  }

  // 行插入
  public insertTableTopRow() {
    const positionContext = this.position.getPositionContext()
    // positionContext 必须是表格上下文
    if (!positionContext.isTable) return
    let { index, trIndex, tableId } = positionContext
    // 从原始元素列表中获取当前元素
    const originalElementList = this.draw.getOriginalElementList()
    let element = originalElementList[index!]

    // 分页表格必须在创建新行前合并，否则当前分页片段中的跨行和列
    // 信息不完整，插入后会破坏表格结构。
    if (element.pagingId) {
      const curTr = element.trList![trIndex!]
      const originalRowIndex = curTr.originalRowIndex
      const { combineTable, startIndex, endIndex } = this.combineTable(
        element.pagingId
      )
      originalElementList.splice(
        startIndex,
        endIndex - startIndex + 1,
        combineTable
      )
      element = combineTable
      index = startIndex
      trIndex = element.trList!.findIndex(
        tr => tr.originalRowIndex === originalRowIndex
      )
      tableId = element.id
    }

    // 从当前元素中获取当前行
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
      // 新增行不能继承被拆分行的实际高度，否则空行会复制原行高度。
      height: this.options.table.defaultTrMinHeight,
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
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: newTrId,
            tdId: newTdId
          }
        ]
      })
    }
    const newTableId = tableId
    const newIndex = index!
    const newTrIndex = trIndex!
    curTrList.splice(newTrIndex, 0, newTr)
    this.position.setPositionContext({
      isTable: true,
      index: newIndex,
      trIndex: newTrIndex,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId: newTableId
    })

    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  // 向下插入一行
  public insertTableBottomRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    let { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    let element = originalElementList[index!]

    // 分页表格必须先合并，再根据原始行定位插入位置；否则会以当前
    // 分页片段的行结构创建新行，跨行关系和列结构都会错误。
    if (element.pagingId) {
      const curTr = element.trList![trIndex!]
      const originalRowIndex = curTr.originalRowIndex
      const { combineTable, startIndex, endIndex } = this.combineTable(
        element.pagingId
      )
      originalElementList.splice(
        startIndex,
        endIndex - startIndex + 1,
        combineTable
      )
      element = combineTable
      index = startIndex
      trIndex = element.trList!.findIndex(
        tr => tr.originalRowIndex === originalRowIndex
      )
      tableId = element.id
    }

    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    const anchorTr =
      curTrList.length - 1 === trIndex ? curTr : curTrList[trIndex! + 1]

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
      // 新增行不能继承被拆分行的实际高度，否则空行会复制原行高度。
      height: this.options.table.defaultTrMinHeight,
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
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: newTrId,
            tdId: newTdId
          }
        ]
      })
    }
    const newTableId = tableId
    const newTrIndex = trIndex! + 1
    const newIndex = index!
    curTrList.splice(newTrIndex, 0, newTr)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index: newIndex,
      trIndex: newTrIndex,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId: newTableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public adjustColWidth(element: IElement) {
    if (element.type !== ElementType.TABLE) return
    const { defaultColMinWidth } = this.options.table
    const colgroup = element.colgroup!
    const colgroupWidth = colgroup.reduce((pre, cur) => pre + cur.width, 0)
    const width = this.draw.getOriginalInnerWidth()
    if (colgroupWidth > width) {
      // 过滤大于最小宽度的列（可能减少宽度的列）
      const greaterMinWidthCol = colgroup.filter(
        col => col.width > defaultColMinWidth
      )
      // 均分多余宽度
      const adjustWidth = (colgroupWidth - width) / greaterMinWidthCol.length
      for (let g = 0; g < colgroup.length; g++) {
        const group = colgroup[g]
        // 小于最小宽度的列不处理
        if (group.width - adjustWidth >= defaultColMinWidth) {
          group.width -= adjustWidth
        }
      }
    }
  }

  public insertTableLeftCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    this.tableParticle.computeRowColInfo(element)
    const curTr = element.trList![trIndex!]
    const curTd = curTr.tdList[tdIndex!]
    const curRowOriginalIndex = curTr.originalRowIndex ?? trIndex!
    const curColIndex = curTd.colIndex!
    let newTableId = element.id
    let newIndex = index!
    let newTrIndex = trIndex!
    let newTdIndex = tdIndex!
    let table = element
    if (element.pagingId) {
      const { combineTable, startIndex, endIndex } = this.combineTable(
        element.pagingId
      )
      table = combineTable
      newIndex = startIndex
      newTableId = combineTable.id
      this.tableParticle.computeRowColInfo(table)
      const mappedTrIndex = table.trList!.findIndex(
        tr => tr.originalRowIndex === curRowOriginalIndex
      )
      if (~mappedTrIndex) {
        newTrIndex = mappedTrIndex
      }
      originalElementList.splice(startIndex, endIndex - startIndex + 1, table)
    }

    this.tableParticle.computeRowColInfo(table)
    const anchorTr = table.trList![newTrIndex]
    let anchorTdIndex = anchorTr.tdList.findIndex(
      td =>
        curColIndex >= td.colIndex! && curColIndex < td.colIndex! + td.colspan
    )
    if (!~anchorTdIndex) {
      anchorTdIndex = Math.min(tdIndex!, anchorTr.tdList.length - 1)
    }
    const anchorTd = anchorTr.tdList[anchorTdIndex]
    const insertColIndex = anchorTd.colIndex!

    const { defaultColMinWidth } = this.options.table
    table.colgroup!.splice(insertColIndex, 0, {
      width: defaultColMinWidth
    })

    for (let t = 0; t < table.trList!.length; t++) {
      const tr = table.trList![t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (
          td.colIndex! < insertColIndex &&
          td.colIndex! + td.colspan > insertColIndex
        ) {
          td.colspan++
        }
      }
    }

    for (let t = 0; t < table.trList!.length; t++) {
      const tr = table.trList![t]
      const crossRowspanTd = this.tableParticle
        .getTdListByRowIndex(table.trList!, t)
        .find(
          td =>
            td.rowIndex! < t &&
            td.colIndex! < insertColIndex &&
            td.colIndex! + td.colspan > insertColIndex
        )
      if (crossRowspanTd) continue
      const crossTd = tr.tdList.find(
        td =>
          td.colIndex! < insertColIndex &&
          td.colIndex! + td.colspan > insertColIndex
      )
      if (crossTd) continue
      let insertPos = tr.tdList.findIndex(td => td.colIndex! >= insertColIndex)
      if (!~insertPos) {
        insertPos = tr.tdList.length
      }
      const tdId = getUUID()
      tr.tdList.splice(insertPos, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId: table.id,
            trId: tr.id,
            tdId
          }
        ]
      })
    }

    this.adjustColWidth(table)
    table.pagingId = ''
    table.pagingIndex = undefined

    newTdIndex = anchorTdIndex + 1
    // 重新设置上下文
    const newTr = table.trList![newTrIndex]
    this.position.setPositionContext({
      isTable: true,
      index: newIndex,
      trIndex: newTrIndex,
      tdIndex: newTdIndex,
      tdId: newTr.tdList[newTdIndex].id,
      trId: newTr.id,
      tableId: newTableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public insertTableRightCol() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    this.tableParticle.computeRowColInfo(element)
    const curTr = element.trList![trIndex!]
    const curTd = curTr.tdList[tdIndex!]
    const curRowOriginalIndex = curTr.originalRowIndex ?? trIndex!
    const curColIndex = curTd.colIndex!
    let newTableId = element.id
    let newIndex = index!
    let newTrIndex = trIndex!
    let newTdIndex = tdIndex!
    let table = element
    if (element.pagingId) {
      const { combineTable, startIndex, endIndex } = this.combineTable(
        element.pagingId
      )
      table = combineTable
      newIndex = startIndex
      newTableId = combineTable.id
      this.tableParticle.computeRowColInfo(table)
      const mappedTrIndex = table.trList!.findIndex(
        tr => tr.originalRowIndex === curRowOriginalIndex
      )
      if (~mappedTrIndex) {
        newTrIndex = mappedTrIndex
      }
      originalElementList.splice(startIndex, endIndex - startIndex + 1, table)
    }

    this.tableParticle.computeRowColInfo(table)
    const anchorTr = table.trList![newTrIndex]
    let anchorTdIndex = anchorTr.tdList.findIndex(
      td =>
        curColIndex >= td.colIndex! && curColIndex < td.colIndex! + td.colspan
    )
    if (!~anchorTdIndex) {
      anchorTdIndex = Math.min(tdIndex!, anchorTr.tdList.length - 1)
    }
    const anchorTd = anchorTr.tdList[anchorTdIndex]
    const insertColIndex = anchorTd.colIndex! + anchorTd.colspan

    const { defaultColMinWidth } = this.options.table
    table.colgroup!.splice(insertColIndex, 0, {
      width: defaultColMinWidth
    })

    for (let t = 0; t < table.trList!.length; t++) {
      const tr = table.trList![t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (
          td.colIndex! < insertColIndex &&
          td.colIndex! + td.colspan > insertColIndex
        ) {
          td.colspan++
        }
      }
    }

    for (let t = 0; t < table.trList!.length; t++) {
      const tr = table.trList![t]
      const crossRowspanTd = this.tableParticle
        .getTdListByRowIndex(table.trList!, t)
        .find(
          td =>
            td.rowIndex! < t &&
            td.colIndex! < insertColIndex &&
            td.colIndex! + td.colspan > insertColIndex
        )
      if (crossRowspanTd) continue
      const crossTd = tr.tdList.find(
        td =>
          td.colIndex! < insertColIndex &&
          td.colIndex! + td.colspan > insertColIndex
      )
      if (crossTd) continue
      let insertPos = tr.tdList.findIndex(td => td.colIndex! >= insertColIndex)
      if (!~insertPos) {
        insertPos = tr.tdList.length
      }
      const tdId = getUUID()
      tr.tdList.splice(insertPos, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId: table.id,
            trId: tr.id,
            tdId
          }
        ]
      })
    }

    this.adjustColWidth(table)
    table.pagingId = ''
    table.pagingIndex = undefined

    newTdIndex = anchorTdIndex
    // 重新设置上下文
    const newTr = table.trList![newTrIndex]
    this.position.setPositionContext({
      isTable: true,
      index: newIndex,
      trIndex: newTrIndex,
      tdIndex: newTdIndex,
      tdId: newTr.tdList[newTdIndex].id,
      trId: newTr.id,
      tableId: newTableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public deleteTableRow() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tdIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const trList = element.trList!
    const curTr = trList[trIndex!]
    const curTdRowIndex = curTr.tdList[tdIndex!].rowIndex!
    // 如果是最后一行，直接删除整个表格（如果是拆分表格按照正常逻辑走）
    if (trList.length <= 1 && element.pagingIndex === 0) {
      this.deleteTable()
      return
    }
    // 之前行缩小rowspan
    for (let r = 0; r < curTdRowIndex; r++) {
      const tr = trList[r]
      const tdList = tr.tdList
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d]
        if (td.rowIndex! + td.rowspan > curTdRowIndex) {
          td.rowspan--
        }
      }
    }
    // 补跨行
    for (let d = 0; d < curTr.tdList.length; d++) {
      const td = curTr.tdList[d]
      if (td.rowspan > 1) {
        const tdId = getUUID()
        const nextTr = trList[trIndex! + 1]
        nextTr.tdList.splice(d, 0, {
          id: tdId,
          rowspan: td.rowspan - 1,
          colspan: td.colspan,
          value: [
            {
              value: ZERO,
              size: 16,
              tableId: element.id,
              trId: nextTr.id,
              tdId
            }
          ]
        })
      }
    }
    // 删除当前行
    trList.splice(trIndex!, 1)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: false
    })
    this.range.clearRange()
    // 重新渲染
    this.draw.render({
      curIndex: positionContext.index
    })
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
    // 缩小colspan或删除与当前列重叠的单元格
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (
          td.colIndex! <= curColIndex &&
          td.colIndex! + td.colspan > curColIndex
        ) {
          if (td.colspan > 1) {
            td.colspan--
          } else {
            tr.tdList.splice(d, 1)
          }
        }
      }
    }
    element.colgroup?.splice(curColIndex, 1)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({
      curIndex: positionContext.index
    })
    this.tableTool.dispose()
  }

  public deleteTable() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const originalElementList = this.draw.getOriginalElementList()
    const tableElement = originalElementList[positionContext.index!]
    // 需要删除的表格数量（拆分表格）及位置
    let deleteCount = 1
    let deleteStartIndex = positionContext.index!
    if (tableElement.pagingId) {
      // 开始删除的下标位置
      deleteStartIndex = positionContext.index! - tableElement.pagingIndex!
      // 计算删除的表格数量
      for (let i = deleteStartIndex + 1; i < originalElementList.length; i++) {
        if (originalElementList[i].pagingId === tableElement.pagingId) {
          deleteCount++
        } else {
          break
        }
      }
    }
    // 删除
    originalElementList.splice(deleteStartIndex, deleteCount)
    const curIndex = deleteStartIndex - 1
    this.position.setPositionContext({
      isTable: false,
      index: curIndex
    })
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
    this.tableTool.dispose()
  }

  public mergeTableCell() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    if (!isCrossRowCol) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    let startTd = curTrList[startTrIndex!].tdList[startTdIndex!]
    let endTd = curTrList[endTrIndex!].tdList[endTdIndex!]
    // 交换起始位置
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    // 选区行列
    const rowCol: ITd[][] = []
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdList: ITd[] = []
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const tdColIndex = td.colIndex!
        const tdRowIndex = td.rowIndex!
        if (
          tdColIndex >= startColIndex &&
          tdColIndex <= endColIndex &&
          tdRowIndex >= startRowIndex &&
          tdRowIndex <= endRowIndex
        ) {
          tdList.push(td)
        }
      }
      if (tdList.length) {
        rowCol.push(tdList)
      }
    }
    if (!rowCol.length) return
    // 是否是矩形
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
        // 存在不符合项
        if (
          startX > tdStartX ||
          startY > tdStartY ||
          endX < tdEndX ||
          endY < tdEndY
        ) {
          return
        }
      }
    }
    // 合并单元格
    const mergeTdIdList: string[] = []
    const anchorTd = rowCol[0][0]
    const anchorElement = anchorTd.value[0]
    for (let t = 0; t < rowCol.length; t++) {
      const tr = rowCol[t]
      for (let d = 0; d < tr.length; d++) {
        const td = tr[d]
        const isAnchorTd = t === 0 && d === 0
        // 缓存待删除单元id并合并单元格内容
        if (!isAnchorTd) {
          mergeTdIdList.push(td.id!)
          // 被合并单元格没内容时忽略换行符
          const startTdValueIndex = td.value.length > 1 ? 0 : 1
          // 复制表格属性后追加
          for (let d = startTdValueIndex; d < td.value.length; d++) {
            const tdElement = td.value[d]
            cloneProperty<IElement>(
              TABLE_CONTEXT_ATTR,
              anchorElement,
              tdElement
            )
            anchorTd.value.push(tdElement)
          }
        }
        // 列合并
        if (t === 0 && d !== 0) {
          anchorTd.colspan += td.colspan
        }
        // 行合并
        if (t !== 0) {
          if (anchorTd.colIndex === td.colIndex) {
            anchorTd.rowspan += td.rowspan
          }
        }
      }
    }
    // 移除多余单元格
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
    // 设置上下文信息
    this.position.setPositionContext({
      ...positionContext,
      trIndex: anchorTd.trIndex,
      tdIndex: anchorTd.tdIndex
    })
    const curIndex = anchorTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    // 重新渲染
    this.draw.render()
    this.tableTool.render()
  }

  public cancelMergeTableCell() {
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
    // 设置跨列
    if (curTd.colspan > 1) {
      for (let c = 1; c < curTd.colspan; c++) {
        const tdId = getUUID()
        curTr.tdList.splice(tdIndex! + c, 0, {
          id: tdId,
          rowspan: 1,
          colspan: 1,
          value: [
            {
              value: ZERO,
              size: 16,
              tableId: element.id,
              trId: curTr.id,
              tdId
            }
          ]
        })
      }
      curTd.colspan = 1
    }
    // 设置跨行
    if (curTd.rowspan > 1) {
      for (let r = 1; r < curTd.rowspan; r++) {
        const tr = curTrList[trIndex! + r]
        for (let c = 0; c < colspan; c++) {
          const tdId = getUUID()
          tr.tdList.splice(curTd.colIndex!, 0, {
            id: tdId,
            rowspan: 1,
            colspan: 1,
            value: [
              {
                value: ZERO,
                size: 16,
                tableId: element.id,
                trId: tr.id,
                tdId
              }
            ]
          })
        }
      }
      curTd.rowspan = 1
    }
    // 重新渲染
    const curIndex = curTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render()
    this.tableTool.render()
  }

  public splitVerticalTableCell() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    // 暂时忽略跨行列选择
    const range = this.range.getRange()
    if (range.isCrossRowCol) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]!
    const curTd = curTr.tdList[tdIndex!]
    // 增加列属性
    element.colgroup!.splice(tdIndex! + 1, 0, {
      width: this.options.table.defaultColMinWidth
    })
    // 同行增加td，非同行增加跨列数
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      let d = 0
      while (d < tr.tdList.length) {
        const td = tr.tdList[d]
        // 非同行：存在交叉时增加跨列数
        if (td.rowIndex !== curTd.rowIndex) {
          if (
            td.colIndex! <= curTd.colIndex! &&
            td.colIndex! + td.colspan > curTd.colIndex!
          ) {
            td.colspan++
          }
        } else {
          // 当前单元格：往右插入td
          if (td.id === curTd.id) {
            const tdId = getUUID()
            curTr.tdList.splice(d + curTd.colspan, 0, {
              id: tdId,
              rowspan: curTd.rowspan,
              colspan: 1,
              value: [
                {
                  value: ZERO,
                  size: 16,
                  tableId: element.id,
                  trId: tr.id,
                  tdId
                }
              ]
            })
            d++
          }
        }
        d++
      }
    }
    // 重新渲染
    this.draw.render()
    this.tableTool.render()
  }

  public splitHorizontalTableCell() {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    // 暂时忽略跨行列选择
    const range = this.range.getRange()
    if (range.isCrossRowCol) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]!
    const curTd = curTr.tdList[tdIndex!]
    // 追加的行跳出循环
    let appendTrIndex = -1
    // 交叉行增加rowspan，当前单元格往下追加一行tr
    let t = 0
    while (t < curTrList.length) {
      if (t === appendTrIndex) {
        t++
        continue
      }
      const tr = curTrList[t]
      let d = 0
      while (d < tr.tdList.length) {
        const td = tr.tdList[d]
        if (td.id === curTd.id) {
          const trId = getUUID()
          const tdId = getUUID()
          curTrList.splice(t + curTd.rowspan, 0, {
            id: trId,
            height: this.options.table.defaultTrMinHeight,
            tdList: [
              {
                id: tdId,
                rowspan: 1,
                colspan: curTd.colspan,
                value: [
                  {
                    value: ZERO,
                    size: 16,
                    tableId: element.id,
                    trId,
                    tdId
                  }
                ]
              }
            ]
          })
          appendTrIndex = t + curTd.rowspan
        } else if (
          td.rowIndex! >= curTd.rowIndex! &&
          td.rowIndex! < curTd.rowIndex! + curTd.rowspan &&
          td.rowIndex! + td.rowspan >= curTd.rowIndex! + curTd.rowspan
        ) {
          // 1. 循环td上方大于等于当前td上方 && 小于当前td的下方=>存在交叉
          // 2. 循环td下方大于或等于当前td下方
          td.rowspan++
        }
        d++
      }
      t++
    }
    // 重新渲染
    this.draw.render()
    this.tableTool.render()
  }

  public tableTdVerticalAlign(payload: VerticalAlign) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const td = row[c]
        if (
          !td ||
          td.verticalAlign === payload ||
          (!td.verticalAlign && payload === VerticalAlign.TOP)
        ) {
          continue
        }
        // 重设垂直对齐方式
        td.verticalAlign = payload
      }
    }
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableBorderType(payload: TableBorder) {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    if (
      (!element.borderType && payload === TableBorder.ALL) ||
      element.borderType === payload
    ) {
      return
    }
    element.borderType = payload
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableBorderColor(payload: string) {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    if (
      (!element.borderColor &&
        payload === this.options.table.defaultBorderColor) ||
      element.borderColor === payload
    ) {
      return
    }
    element.borderColor = payload
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex,
      isCompute: false
    })
  }

  public tableTdBorderType(payload: TdBorder) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    const tdList = rowCol.flat()
    // 存在则设置边框类型，否则取消设置
    const isSetBorderType = tdList.some(
      td => !td.borderTypes?.includes(payload)
    )
    tdList.forEach(td => {
      if (!td.borderTypes) {
        td.borderTypes = []
      }
      const borderTypeIndex = td.borderTypes.findIndex(type => type === payload)
      if (isSetBorderType) {
        if (!~borderTypeIndex) {
          td.borderTypes.push(payload)
        }
      } else {
        if (~borderTypeIndex) {
          td.borderTypes.splice(borderTypeIndex, 1)
        }
      }
      // 不存在边框设置时删除字段
      if (!td.borderTypes.length) {
        delete td.borderTypes
      }
    })
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableTdSlashType(payload: TdSlash) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    const tdList = rowCol.flat()
    // 存在则设置单元格斜线类型，否则取消设置
    const isSetTdSlashType = tdList.some(
      td => !td.slashTypes?.includes(payload)
    )
    tdList.forEach(td => {
      if (!td.slashTypes) {
        td.slashTypes = []
      }
      const slashTypeIndex = td.slashTypes.findIndex(type => type === payload)
      if (isSetTdSlashType) {
        if (!~slashTypeIndex) {
          td.slashTypes.push(payload)
        }
      } else {
        if (~slashTypeIndex) {
          td.slashTypes.splice(slashTypeIndex, 1)
        }
      }
      // 不存在斜线设置时删除字段
      if (!td.slashTypes.length) {
        delete td.slashTypes
      }
    })
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableTdBackgroundColor(payload: string) {
    const rowCol = this.tableParticle.getRangeRowCol()
    if (!rowCol) return
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const col = row[c]
        col.backgroundColor = payload
      }
    }
    const { endIndex } = this.range.getRange()
    this.range.setRange(endIndex, endIndex)
    this.draw.render({
      isCompute: false
    })
  }

  public tableSelectAll() {
    const positionContext = this.position.getPositionContext()
    const { index, tableId, isTable } = positionContext
    if (!isTable || !tableId) return
    const { startIndex, endIndex } = this.range.getRange()
    const originalElementList = this.draw.getOriginalElementList()
    const tableElement = originalElementList[index!]
    if (tableElement?.pagingId) {
      const pagingId = tableElement.pagingId
      const trList = tableElement.trList!
      const endTrIndex = trList.length - 1
      const endTdIndex = trList[endTrIndex].tdList.length - 1
      // DEBUG
      const dbgRowList = (this.draw as any).rowList || []
      const dbgPageRowList = (this.draw as any).pageRowList || []
      const dbgFoundInRowList = dbgRowList.filter((r: any) =>
        r.elementList?.some((e: any) => e.pagingId === pagingId)
      )
      const dbgFoundInPageRowList = dbgPageRowList.flatMap((page: any) =>
        (page || []).filter((r: any) =>
          r.elementList?.some((e: any) => e.pagingId === pagingId)
        )
      )
      console.log('[tableSelectAll:debug]', {
        pagingId,
        elementListPagingCount: originalElementList.filter(
          e => e.pagingId === pagingId
        ).length,
        rowListHasTarget: dbgFoundInRowList.length,
        pageRowListHasTarget: dbgFoundInPageRowList.length,
        rowListTotalRows: dbgRowList.length,
        pageRowListTotalPages: dbgPageRowList.length
      })
      this.range.replaceRange({
        startIndex,
        endIndex,
        tableId: pagingId,
        startTdIndex: 0,
        endTdIndex,
        startTrIndex: 0,
        endTrIndex
      })
      // 分页表格全选后，强制 isCrossRowCol = true
      // 否则当 endTrIndex/endTdIndex 都为 0 时（单行单列分页片段）
      // setRange 中的 !!() 判定会得到 false，导致 drawRange 直接 return
      const range = this.range.getRange()
      range.isCrossRowCol = true
      // 分页表格全选时使用 isCompute: false + isLazy: false
      // isCompute: true 会触发 combineTable + splitTable，combineTable 会清空 pagingId
      // 重新 splitTable 时会产生新 pagingId，导致 range.tableId 与 element.pagingId 不匹配
      this.draw.render({
        isSetCursor: false,
        isCompute: false,
        isSubmitHistory: false,
        isLazy: false
      })
      return
    }
    const trList = tableElement.trList!
    // 最后单元格位置
    const endTrIndex = trList.length - 1
    const endTdIndex = trList[endTrIndex].tdList.length - 1
    this.range.replaceRange({
      startIndex,
      endIndex,
      tableId,
      startTdIndex: 0,
      endTdIndex,
      startTrIndex: 0,
      endTrIndex
    })
    this.draw.render({
      isSetCursor: false,
      isCompute: false,
      isSubmitHistory: false
    })
  }
}
