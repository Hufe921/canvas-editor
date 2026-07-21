import { CanvasEvent } from '../CanvasEvent'

export function mouseleave(evt: MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  // 鼠标移出页面时选区禁用
  if (!draw.getOptions().pageOuterSelectionDisable) return
  // 是否还在canvas内部
  const pageContainer = draw.getPageContainer()
  const { x, y, width, height } = pageContainer.getBoundingClientRect()
  if (evt.x >= x && evt.x <= x + width && evt.y >= y && evt.y <= y + height) {
    return
  }
  host.setIsAllowSelection(false)
}
