import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { ICopyOption } from '../../../interface/Event'
import { ITr } from '../../../interface/table/Tr'
import { writeElementList } from '../../../utils/clipboard'
import { getTextFromElementList, zipElementList } from '../../../utils/element'
import { IOverrideResult } from '../../override/Override'
import { CanvasEvent } from '../CanvasEvent'

export function copy(host: CanvasEvent, options?: ICopyOption) {
  const draw = host.getDraw()
  // 自定义粘贴事件
  const { copy } = draw.getOverride()
  if (copy) {
    const overrideResult = copy()
    // 默认阻止默认事件
    if ((<IOverrideResult>overrideResult)?.preventDefault !== false) return
  }
  const rangeManager = draw.getRange()
  // 光标闭合时复制整行
  let copyElementList: IElement[] | null = null
  const range = rangeManager.getRange()
  if (range.isCrossRowCol) {
    // 原始表格信息
    const tableElement = rangeManager.getRangeTableElement()
    if (!tableElement) return
    // 选区行列信息
    const rowCol = draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    // 构造表格
    const copyTableElement: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [],
      trList: []
    }
    const firstRow = rowCol[0]
    const colStartIndex = firstRow[0].colIndex!
    const lastCol = firstRow[firstRow.length - 1]
    const colEndIndex = lastCol.colIndex! + lastCol.colspan - 1
    for (let c = colStartIndex; c <= colEndIndex; c++) {
      copyTableElement.colgroup!.push(tableElement.colgroup![c])
    }
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      const tr = tableElement.trList![row[0].rowIndex!]
      const coptTr: ITr = {
        tdList: [],
        height: tr.height,
        minHeight: tr.minHeight
      }
      for (let c = 0; c < row.length; c++) {
        coptTr.tdList.push(row[c])
      }
      copyTableElement.trList!.push(coptTr)
    }
    copyElementList = zipElementList([copyTableElement])
  } else {
    copyElementList = rangeManager.getIsCollapsed()
      ? rangeManager.getRangeRowElementList()
      : rangeManager.getSelectionElementList()
  }
  if (options?.isPlainText && copyElementList?.length) {
    copyElementList = [
      {
        value: getTextFromElementList(copyElementList)
      }
    ]
  }
  if (!copyElementList?.length) return
  writeElementList(copyElementList, draw.getOptions())
}
