import { IColgroup } from '../interface/table/Colgroup'

export function getColgroupWidth(colgroup: IColgroup[]): number {
  return colgroup.reduce((pre, cur) => pre + cur.width, 0)
}

// 等比例压缩表格列宽至目标宽度内
// 触及最小宽度的列退出压缩，剩余列继续等比例分摊；
// 全部列到达下限仍超宽时保持原样（不再压缩）。结果幂等，可重复调用
export function shrinkColgroupToWidth(
  colgroup: IColgroup[],
  maxWidth: number,
  minWidth: number
) {
  let totalWidth = getColgroupWidth(colgroup)
  while (totalWidth > maxWidth) {
    // 仍可压缩的列（大于最小宽度）
    const activeCol = colgroup.filter(col => col.width > minWidth)
    // 全部列到达下限仍超宽则保持（不再压缩）
    if (!activeCol.length) return
    const activeTotalWidth = getColgroupWidth(activeCol)
    const targetActiveWidth = maxWidth - (totalWidth - activeTotalWidth)
    // 可压缩列全部置为下限也无法达到目标宽度时，直接置为下限
    if (targetActiveWidth <= 0) {
      activeCol.forEach(col => (col.width = minWidth))
      return
    }
    const ratio = targetActiveWidth / activeTotalWidth
    activeCol.forEach(col => {
      col.width = Math.max(minWidth, col.width * ratio)
    })
    const nextTotalWidth = getColgroupWidth(colgroup)
    // 无实际变化时退出，避免死循环
    if (nextTotalWidth >= totalWidth) return
    totalWidth = nextTotalWidth
  }
}

// 等比例缩放表格列宽至目标宽度（放大或缩小）
export function scaleColgroupToWidth(
  colgroup: IColgroup[],
  targetWidth: number
) {
  const totalWidth = getColgroupWidth(colgroup)
  if (!totalWidth || totalWidth === targetWidth) return
  const ratio = targetWidth / totalWidth
  for (let c = 0; c < colgroup.length; c++) {
    colgroup[c].width *= ratio
  }
}
