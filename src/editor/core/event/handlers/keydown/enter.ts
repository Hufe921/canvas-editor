import { ZERO } from '../../../../dataset/constant/Common'
import {
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { IElement } from '../../../../interface/Element'
import {
  formatElementContext,
  getAnchorElement
} from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function enter(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  const control = draw.getControl()
  if (isReadonly || control.isPartRangeInControlOutside()) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  const elementList = draw.getElementList()
  const startElement = elementList[startIndex]
  const endElement = elementList[endIndex]
  // 最后一个列表项行首回车取消列表设置
  if (
    isCollapsed &&
    endElement.listId &&
    endElement.value === ZERO &&
    elementList[endIndex + 1]?.listId !== endElement.listId
  ) {
    draw.getListParticle().unsetList()
    return
  }
  // 列表块内换行
  const enterText: IElement = {
    value: ZERO
  }
  if (evt.shiftKey && startElement.listId) {
    enterText.listWrap = true
  }
  // 标题结尾处回车无需格式化
  if (
    !(
      endElement.titleId &&
      endElement.titleId !== elementList[endIndex + 1]?.titleId
    )
  ) {
    formatElementContext(elementList, [enterText], startIndex)
  }
  // 复制样式属性
  const copyElement = getAnchorElement(elementList, endIndex)
  if (copyElement) {
    const copyAttr = [...EDITOR_ELEMENT_STYLE_ATTR, ...EDITOR_ROW_ATTR]
    copyAttr.forEach(attr => {
      const value = copyElement[attr] as never
      if (value !== undefined) {
        enterText[attr] = value
      }
    })
  }
  // 控件或文档插入换行元素
  const activeControl = control.getActiveControl()
  let curIndex: number
  if (activeControl && !control.isRangInPostfix()) {
    curIndex = control.setValue([enterText])
  } else {
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    if (isCollapsed) {
      draw.spliceElementList(elementList, index + 1, 0, enterText)
    } else {
      draw.spliceElementList(
        elementList,
        startIndex + 1,
        endIndex - startIndex,
        enterText
      )
    }
    curIndex = index + 1
  }
  if (~curIndex) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  }
  evt.preventDefault()
}
