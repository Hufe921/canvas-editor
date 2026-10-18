import type { IElement } from '../../interface/Element'
import type { LayoutRow } from '../../interface/LayoutRow'
import { cellLayoutState } from '../layout/CellLayoutState'

/** Activate container sidecars for the selected native frame variant. */
export function activateFrameGeometry(elements: IElement[], rows: LayoutRow[]) {
  for (const row of rows)
    for (const [index, projected] of row.elementList.entries()) {
      const model =
        elements[row.sourceIndices?.[index] ?? row.startIndex + index]
      if (!model) continue
      if (!projected.trList || !model.trList) continue
      for (const [r, tr] of projected.trList.entries())
        for (const [c, cell] of tr.tdList.entries()) {
          const target = model.trList[r]?.tdList[c]
          if (!target) continue
          cellLayoutState(target)
          Object.assign(target, {
            x: cell.x,
            y: cell.y,
            width: cell.width,
            height: cell.height,
            rowList: cell.rowList,
            positionList: cell.positionList,
            mainHeight: cell.mainHeight
          })
          activateFrameGeometry(target.value, cell.rowList || [])
        }
    }
}
