import { ZERO } from '../../../../dataset/constant/Common'
import {
  AREA_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { IElement } from '../../../../interface/Element'
import { omitObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function enter(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
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
  let enterText: IElement = {
    value: ZERO
  }
  if (evt.shiftKey && startElement.listId) {
    enterText.listWrap = true
  }
  // 格式化上下文
  formatElementContext(elementList, [enterText], startIndex, {
    isBreakWhenWrap: true,
    editorOptions: draw.getOptions()
  })
  // shift长按 && 最后位置回车无需复制区域上下文
  if (
    evt.shiftKey &&
    endElement.areaId &&
    endElement.areaId !== elementList[endIndex + 1]?.areaId
  ) {
    enterText = omitObject(enterText, AREA_CONTEXT_ATTR)
  }
  // 标题结尾处回车无需格式化及样式复制
  if (
    !(
      endElement.titleId &&
      endElement.titleId !== elementList[endIndex + 1]?.titleId
    )
  ) {
    // 复制样式属性
    const copyElement = rangeManager.getRangeAnchorStyle(elementList, endIndex)
    if (copyElement) {
      const copyAttr = [...EDITOR_ROW_ATTR]
      // 不复制控件后缀样式
      if (copyElement.controlComponent !== ControlComponent.POSTFIX) {
        copyAttr.push(...EDITOR_ELEMENT_STYLE_ATTR)
      }
      copyAttr.forEach(attr => {
        const value = copyElement[attr] as never
        if (value !== undefined) {
          enterText[attr] = value
        }
      })
    }
  }
  // 控件或文档插入换行元素
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  let curIndex: number
  if (activeControl && control.getIsRangeWithinControl()) {
    curIndex = control.setValue([enterText])
    control.emitControlContentChange()
  } else {
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    if (isCollapsed) {
      draw.spliceElementList(elementList, index + 1, 0, [enterText])
    } else {
      draw.spliceElementList(
        elementList,
        startIndex + 1,
        endIndex - startIndex,
        [enterText]
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
