import { writeElementList } from '../../../utils/clipboard'
import { CanvasEvent } from '../CanvasEvent'

export function copy(host: CanvasEvent) {
  const draw = host.getDraw()
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  if (startIndex !== endIndex) {
    const options = draw.getOptions()
    const elementList = draw.getElementList()
    writeElementList(elementList.slice(startIndex + 1, endIndex + 1), options)
  }
}