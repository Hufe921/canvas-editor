import { ZERO } from '../../../../dataset/constant/Common'
import {
  AREA_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { IElement } from '../../../../interface/Element'
import { getUUID, omitObject } from '../../../../utils'
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
  // 标题开始 && 标题结尾处回车 => 无需格式化及样式复制
  if (
    !(
      elementList[startIndex + 1]?.titleId &&
      (!startElement.titleId ||
        startElement.titleId !== elementList[startIndex + 1]?.titleId)
    ) &&
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
      // 如果在标题中间回车，为换行后的元素生成新的titleId
      if (
        endElement.titleId &&
        elementList[index + 2]?.titleId === endElement.titleId
      ) {
        const newTitleId = getUUID()
        // 循环处理换行符后面的标题元素
        let nextIndex = index + 2
        while (
          nextIndex < elementList.length &&
          elementList[nextIndex]?.titleId === endElement.titleId
        ) {
          elementList[nextIndex].titleId = newTitleId
          nextIndex++
        }
      }
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
