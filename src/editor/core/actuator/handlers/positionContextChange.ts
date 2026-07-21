import { nextTick } from '../../../utils'
import { IPositionContextChangePayload } from '../../../interface/Listener'
import { Draw } from '../../draw/Draw'

export function positionContextChange(
  draw: Draw,
  payload: IPositionContextChangePayload
) {
  const { value, oldValue } = payload
  // 表格工具移除
  if (oldValue.isTable && !value.isTable) {
    draw.getTableTool().dispose()
  } else if(value.isTable && value.tableId !== oldValue.tableId) {
    nextTick(() => {
      draw.getTableTool().render()
    })
  }
}
