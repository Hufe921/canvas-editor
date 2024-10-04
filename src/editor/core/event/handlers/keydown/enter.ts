import { ZERO } from '../../../../dataset/constant/Common'
import {
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import { IElement } from '../../../../interface/Element'
import {
  formatElementContext,
  getAnchorElement
} from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function enter(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  const elementList = draw.getElementList()
  const options = draw.getOptions()
  const rowList = draw.getRowList()
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
  // 格式化上下文
  formatElementContext(elementList, [enterText], startIndex, {
    isBreakWhenWrap: true,
    editorOptions: draw.getOptions()
  })
  // 标题结尾处回车无需格式化及样式复制
  if (!(endElement.titleId && endElement.titleId !== elementList[endIndex + 1]?.titleId)) {
    // 复制样式属性
    const copyElement = getAnchorElement(elementList, endIndex)
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
  rowList.forEach(el => el.endIndex = (el.startIndex + (el.elementList.length - 1)))
  const currentRow = rowList.find(el => {
    return startIndex >= el.startIndex && endIndex <= el.endIndex
  })
  let tabsToInsert = []
  if (currentRow) {
    const nextRow = rowList[currentRow.rowIndex + 1]
    const countTabCurRow = draw.getTabWidth(currentRow.elementList || [])
    const countTabNextRow = draw.getTabWidth(nextRow?.elementList || [])
    const { defaultTabWidth } = options

    let tabsToInsertCount = 0
    // If the cursor position is at the end of the line or any position above the beginning of the line
    if (startIndex === currentRow.endIndex || (currentRow && startIndex > currentRow.startIndex)) {
      // if the current line has more tabs than the next line, take the tabs from the current line
      // if not, get the tabs from the next line
      tabsToInsertCount = countTabCurRow > countTabNextRow ? (countTabCurRow / defaultTabWidth) : (countTabNextRow / defaultTabWidth)
    } else {
      // if it is at the beginning
      tabsToInsertCount = countTabCurRow / defaultTabWidth
    }

    // Create the TAB elements that will be inserted in the new line
    tabsToInsert = Array(tabsToInsertCount).fill({
      value: '',
      type: ElementType.TAB,
      listId: enterText.listId,
      listStyle: enterText.listStyle,
      listType: enterText.listType
    })
  }


  // Insert the new element and calculated tabs on the new line
  if (isCollapsed) {
    draw.spliceElementList(elementList, startIndex + 1, 0, enterText)
    if (tabsToInsert.length > 0) {
      draw.spliceElementList(elementList, startIndex + 2, 0, ...tabsToInsert)
    }
  } else {
    draw.spliceElementList(
      elementList,
      startIndex + 1,
      endIndex - startIndex,
      enterText
    )
    if (tabsToInsert.length > 0) {
      draw.spliceElementList(elementList, startIndex + 2, 0, ...tabsToInsert)
    }
  }

  // Check if it is on the last line and adjust the index accordingly
  let curIndex
  if (startIndex === elementList.length - 2) {
    // If it is the last line, move the cursor to the new line directly
    curIndex = startIndex + 1
  } else {
    curIndex = startIndex + tabsToInsert.length + 1
  }
  if (~curIndex) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  }
  evt.preventDefault()
}

