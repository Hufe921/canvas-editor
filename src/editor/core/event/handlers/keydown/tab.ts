import { ZERO } from '../../../../dataset/constant/Common'
import { EDITOR_ELEMENT_STYLE_ATTR } from '../../../../dataset/constant/Element'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElement } from '../../../../interface/Element'
import { pickObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function tab(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  evt.preventDefault()
  // 在控件上下文时，tab键控制控件之间移动
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  if (activeControl && control.getIsRangeWithinControl()) {
    control.initNextControl({
      direction: evt.shiftKey ? MoveDirection.UP : MoveDirection.DOWN
    })
    return
  }
  const rangeManager = draw.getRange()
  const elementList = draw.getElementList()
  const { startIndex, endIndex } = rangeManager.getRange()
  // 列表项行首 Tab/Shift+Tab：缩进 / 反缩进
  const isCollapsed = rangeManager.getIsCollapsed()
  const endElement = elementList[endIndex]
  const preElement = elementList[endIndex - 1]
  if (
    isCollapsed &&
    endElement?.listId &&
    !endElement.listWrap &&
    (endElement.value === ZERO ||
      (preElement?.value === ZERO &&
        !preElement?.listWrap &&
        preElement.listId === endElement.listId))
  ) {
    if (evt.shiftKey) {
      draw.getListParticle().decreaseListLevel()
    } else {
      draw.getListParticle().increaseListLevel()
    }
    return
  }
  // 普通段落段首 Tab/Shift+Tab：先推进首行缩进，再次按键推进整段左缩进（不插入制表符）
  if (
    isCollapsed &&
    !endElement?.listId &&
    (endIndex === 0 ||
      endElement?.value === ZERO ||
      (preElement?.value === ZERO && !preElement?.listWrap))
  ) {
    const { defaultTabWidth } = draw.getOptions()
    const paragraphElementList = rangeManager.getRangeParagraphElementList()
    if (paragraphElementList) {
      const curIndentLeft = paragraphElementList[0]?.indentLeft || 0
      const curFirstLine = paragraphElementList[0]?.indentFirstLine || 0
      // 制表位网格步进（回退下限为0；前进上限不超过版心内格数）
      const maxIndentStep = Math.max(
        Math.floor(draw.getInnerWidth() / defaultTabWidth) - 2,
        0
      )
      const nextStep = (cur: number, direction: 1 | -1) =>
        (direction > 0
          ? Math.min(Math.floor(cur / defaultTabWidth) + 1, maxIndentStep)
          : Math.max(Math.ceil(cur / defaultTabWidth) - 1, 0)) * defaultTabWidth
      let nextIndentLeft = curIndentLeft
      let nextFirstLine = curFirstLine
      if (evt.shiftKey) {
        // 回退：先整段左缩进，归零后回退首行缩进
        if (curIndentLeft > 0) {
          nextIndentLeft = nextStep(curIndentLeft, -1)
        } else if (curFirstLine > 0) {
          nextFirstLine = nextStep(curFirstLine, -1)
        }
      } else if (curFirstLine <= 0) {
        // 第一次：首行缩进推进一个制表位（悬挂缩进先归零）
        nextFirstLine = nextStep(curFirstLine, 1)
      } else {
        // 之后：整段左缩进推进，首行缩进保持相对偏移
        nextIndentLeft = nextStep(curIndentLeft, 1)
      }
      paragraphElementList.forEach(element => {
        element.indentLeft = nextIndentLeft
        element.indentFirstLine = nextFirstLine
      })
      draw.render({ curIndex: endIndex, isSetCursor: true })
    }
    return
  }
  // 插入tab符
  const anchorStyle = rangeManager.getRangeAnchorStyle(elementList, endIndex)
  // 仅复制样式
  const copyStyle = anchorStyle
    ? pickObject(anchorStyle, EDITOR_ELEMENT_STYLE_ATTR)
    : null
  const tabElement: IElement = {
    ...copyStyle,
    type: ElementType.TAB,
    value: ''
  }
  formatElementContext(elementList, [tabElement], startIndex, {
    editorOptions: draw.getOptions()
  })
  draw.insertElementList([tabElement])
}
