import { ZERO } from '../../../../dataset/constant/Common'
import {
  AREA_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { TextDirection } from '../../../../dataset/enum/TextDirection'
import { IElement } from '../../../../interface/Element'
import { getUUID, omitObject } from '../../../../utils'
import { resolveNewContentDirection } from '../../../../utils/direction'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

function getListBoundaryAnchorIndex(
  elementList: IElement[],
  startIndex: number,
  endIndex: number,
  isCollapsed: boolean
): number {
  const endElement = elementList[endIndex]
  const preElement = elementList[endIndex - 1]
  // 光标在子列表与下一个父列表之间时，沿用前一个子列表项的上下文
  const isListBoundary =
    isCollapsed &&
    endIndex > 0 &&
    endElement?.listId &&
    endElement.value === ZERO &&
    preElement?.listId &&
    preElement.listId !== endElement.listId
  return isListBoundary ? endIndex - 1 : startIndex
}

function inheritListLevel(
  elementList: IElement[],
  targetElement: IElement,
  anchorIndex: number
) {
  if (!targetElement.listId || targetElement.listLevel !== undefined) return
  for (let i = anchorIndex; i >= 0; i--) {
    const prevElement = elementList[i]
    if (prevElement.listId !== targetElement.listId) break
    // 普通样式复制不会兜底 listLevel，这里补齐新增列表项层级
    if (prevElement.listLevel !== undefined) {
      targetElement.listLevel = prevElement.listLevel
      break
    }
  }
}

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
    if (endElement.listLevel) {
      draw.getListParticle().decreaseListLevel()
    } else {
      draw.getListParticle().unsetList()
    }
    return
  }
  // 列表块内换行
  let enterText: IElement = {
    value: ZERO
  }
  if (evt.shiftKey && startElement.listId) {
    enterText.listWrap = true
  }
  const listAnchorIndex = getListBoundaryAnchorIndex(
    elementList,
    startIndex,
    endIndex,
    isCollapsed
  )
  // 格式化上下文
  formatElementContext(elementList, [enterText], listAnchorIndex, {
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
    const copyElement = rangeManager.getRangeAnchorStyle(
      elementList,
      listAnchorIndex
    )
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
  // 无继承方向时，用当前 LTR/RTL 模式作为新行默认值（落盘，不回写旧段）。
  // 列表换行勿写入：与无 direction 的兄弟在 zip 时 attrs 不一致会拆断项合并（trailing \n）。
  // LTR 为默认，也不必落盘，避免同样破坏普通段落文本合并。
  if (enterText.direction === undefined && !enterText.listId) {
    const nextDir = resolveNewContentDirection(draw.getOptions())
    if (nextDir === TextDirection.RTL) {
      enterText.direction = nextDir
    }
  }
  inheritListLevel(elementList, enterText, listAnchorIndex)
  // 控件或文档插入换行元素
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  draw.getTraceParticle().markElementListInserted([enterText])
  let curIndex: number
  if (activeControl && control.getIsRangeWithinControl()) {
    curIndex = control.setValue([enterText])
    control.emitControlContentChange()
  } else {
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    // 列表边界：在 endIndex 前插入新元素以保持子列表连续性
    const isListBoundary = listAnchorIndex !== startIndex
    if (isCollapsed) {
      const spliceIndex = isListBoundary ? endIndex : index + 1
      draw.spliceElementList(elementList, spliceIndex, 0, [enterText])
      // 如果在标题中间回车，为换行后的元素生成新的titleId
      if (
        endElement.titleId &&
        elementList[spliceIndex + 1]?.titleId === endElement.titleId
      ) {
        const newTitleId = getUUID()
        // 循环处理换行符后面的标题元素
        let nextIndex = spliceIndex + 1
        while (
          nextIndex < elementList.length &&
          elementList[nextIndex]?.titleId === endElement.titleId
        ) {
          elementList[nextIndex].titleId = newTitleId
          nextIndex++
        }
      }
    } else {
      const start = startIndex + 1
      draw.deleteElementList(elementList, start, endIndex - startIndex)
      draw.spliceElementList(elementList, start, 0, [enterText])
    }
    curIndex = isCollapsed
      ? isListBoundary
        ? endIndex
        : index + 1
      : startIndex + 1
  }
  if (~curIndex) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  }
  evt.preventDefault()
}
