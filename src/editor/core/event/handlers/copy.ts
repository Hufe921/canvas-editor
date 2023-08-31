import { writeElementList } from '../../../utils/clipboard'
import { CanvasEvent } from '../CanvasEvent'

export function copy(host: CanvasEvent) {
  const draw = host.getDraw()
  const rangeManager = draw.getRange()
  // 光标闭合时复制整行
  const copyElementList = rangeManager.getIsCollapsed()
    ? rangeManager.getRangeRowElementList()
    : rangeManager.getSelectionElementList()
  if (!copyElementList?.length) return
  writeElementList(copyElementList, draw.getOptions())
}
