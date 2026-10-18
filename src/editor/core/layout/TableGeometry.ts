import type { IElement } from '../../interface/Element'
import type { ITd } from '../../interface/table/Td'
import type { ITr } from '../../interface/table/Tr'
import { deepClone } from '../../utils'
import { cellLayoutState } from './CellLayoutState'

export function getTrListGroupByCol(payload: ITr[]) {
  const trList = payload.map(row => ({
    ...deepClone(row),
    tdList: row.tdList.map(cell => ({
      ...deepClone(cell),
      ...cellLayoutState(cell)
    }))
  }))
  for (let t = 0; t < payload.length; t++) {
    const tr = trList[t]
    for (let d = tr.tdList.length - 1; d >= 0; d--) {
      const td = tr.tdList[d]
      const { rowspan, rowIndex, colIndex } = td
      const curRowIndex = rowIndex! + rowspan - 1
      if (curRowIndex !== t) {
        const changeTd = tr.tdList.splice(d, 1)[0]
        trList[curRowIndex]?.tdList.splice(colIndex!, 0, changeTd)
      }
    }
  }
  return trList
}

export function getTableWidth(element: IElement) {
  return element.colgroup!.reduce((pre, cur) => pre + cur.width, 0)
}

export function getTableHeight(element: IElement) {
  const trList = element.trList
  if (!trList?.length) return 0
  return getTdListByColIndex(trList, 0).reduce(
    (pre, cur) => pre + cur.height!,
    0
  )
}

export function getRowCountByColIndex(trList: ITr[], colIndex: number) {
  return getTdListByColIndex(trList, colIndex).reduce(
    (pre, cur) => pre + cur.rowspan,
    0
  )
}

export function getTdListByColIndex(trList: ITr[], colIndex: number) {
  const data: ITd[] = []
  for (let r = 0; r < trList.length; r++) {
    const tdList = trList[r].tdList
    for (let d = 0; d < tdList.length; d++) {
      const td = tdList[d]
      const min = td.colIndex!
      const max = min + td.colspan - 1
      if (colIndex >= min && colIndex <= max) {
        data.push(td)
      }
    }
  }
  return data
}

export function getTdListByRowIndex(trList: ITr[], rowIndex: number) {
  const data: ITd[] = []
  for (let r = 0; r < trList.length; r++) {
    const tdList = trList[r].tdList
    for (let d = 0; d < tdList.length; d++) {
      const td = tdList[d]
      const min = td.rowIndex!
      const max = min + td.rowspan - 1
      if (rowIndex >= min && rowIndex <= max) {
        data.push(td)
      }
    }
  }
  return data
}

export function computeRowColInfo(element: IElement, mirrored: boolean) {
  const { colgroup, trList } = element
  if (!colgroup || !trList) return
  let preX = 0
  for (let t = 0; t < trList.length; t++) {
    const tr = trList[t]
    // 表格最后一行
    const isLastTr = trList.length - 1 === t
    // 当前行最小高度
    let rowMinHeight = 0
    for (let d = 0; d < tr.tdList.length; d++) {
      const td = tr.tdList[d]
      // 计算当前td所属列索引
      let colIndex = 0
      // 第一行td位置为当前列索引+上一个单元格colspan，否则从第一行开始计算列偏移量
      if (trList.length > 1 && t !== 0) {
        // 当前列起始索引：以之前单元格为起始点
        const preTd = tr.tdList[d - 1]
        const start = preTd ? preTd.colIndex! + preTd.colspan : d
        for (let c = start; c < colgroup.length; c++) {
          // 查找相同索引列之前行数，相加判断是否位置被挤占
          const rowCount = getRowCountByColIndex(trList.slice(0, t), c)
          // 不存在挤占则默认当前单元格可以存在该位置
          if (rowCount === t) {
            colIndex = c
            // 重置单元格起始位置坐标
            let preColWidth = 0
            for (let preC = 0; preC < c; preC++) {
              preColWidth += colgroup[preC].width
            }
            preX = preColWidth
            break
          }
        }
      } else {
        const preTd = tr.tdList[d - 1]
        if (preTd) {
          colIndex = preTd.colIndex! + preTd.colspan
        }
      }
      // 计算格宽高
      let width = 0
      for (let col = 0; col < td.colspan; col++) {
        width += colgroup[col + colIndex].width
      }
      let height = 0
      for (let row = 0; row < td.rowspan; row++) {
        const curTr = trList[row + t] || trList[t]
        height += curTr.height
      }
      // y偏移量
      if (rowMinHeight === 0 || rowMinHeight > height) {
        rowMinHeight = height
      }
      // 当前行最后一个td
      const isLastRowTd = tr.tdList.length - 1 === d
      // 当前列最后一个td
      let isLastColTd = isLastTr
      if (!isLastColTd) {
        if (td.rowspan > 1) {
          const nextTrLength = trList.length - 1 - t
          isLastColTd = td.rowspan - 1 === nextTrLength
        }
      }
      // 当前表格最后一个td
      const isLastTd = isLastTr && isLastRowTd
      td.isLastRowTd = isLastRowTd
      td.isLastColTd = isLastColTd
      td.isLastTd = isLastTd
      // 修改当前格clientBox
      td.x = preX
      // 之前行相同列的高度
      let preY = 0
      for (let preR = 0; preR < t; preR++) {
        const preTdList = trList[preR].tdList
        for (let preD = 0; preD < preTdList.length; preD++) {
          const td = preTdList[preD]
          if (
            colIndex >= td.colIndex! &&
            colIndex < td.colIndex! + td.colspan
          ) {
            preY += td.height!
            break
          }
        }
      }
      td.y = preY
      td.width = width
      td.height = height
      td.rowIndex = t
      td.colIndex = colIndex
      td.trIndex = t
      td.tdIndex = d
      // 当前列x轴累加
      preX += width
      // 一行中的最后td
      if (isLastRowTd && !isLastTd) {
        preX = 0
      }
    }
  }
  // UI/表 RTL：镜像列几何（colIndex 逻辑序不变，仅翻 td.x）
  if (mirrored) {
    const tableWidth = colgroup.reduce((sum, col) => sum + col.width, 0)
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        td.x = tableWidth - (td.x || 0) - (td.width || 0)
      }
    }
  }
}
