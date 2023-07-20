import { ElementType } from '../../../dataset/enum/Element'
import { MouseEventButton } from '../../../dataset/enum/Event'
import { deepClone } from '../../../utils'
import { isMod } from '../../../utils/hotkey'
import { CheckboxControl } from '../../draw/control/checkbox/CheckboxControl'
import { CanvasEvent } from '../CanvasEvent'

export function mousedown(evt: MouseEvent, host: CanvasEvent) {
  if (evt.button === MouseEventButton.RIGHT) return
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  const rangeManager = draw.getRange()
  const position = draw.getPosition()
  // 是否是选区拖拽
  if (!host.isAllowDrag) {
    const range = rangeManager.getRange()
    if (!isReadonly && range.startIndex !== range.endIndex) {
      const isPointInRange = rangeManager.getIsPointInRange(
        evt.offsetX,
        evt.offsetY
      )
      if (isPointInRange) {
        host.isAllowDrag = true
        host.cacheRange = deepClone(range)
        host.cacheElementList = draw.getElementList()
        host.cachePositionList = position.getPositionList()
        return
      }
    }
  }
  const target = evt.target as HTMLDivElement
  const pageIndex = target.dataset.index
  // 设置pageNo
  if (pageIndex) {
    draw.setPageNo(Number(pageIndex))
  }
  host.isAllowSelection = true
  const positionResult = position.adjustPositionContext({
    x: evt.offsetX,
    y: evt.offsetY
  })
  if (!positionResult) return
  const {
    index,
    isDirectHit,
    isCheckbox,
    isImage,
    isTable,
    tdValueIndex,
    hitLineStartIndex
  } = positionResult
  // 记录选区开始位置
  host.mouseDownStartPosition = {
    ...positionResult,
    index: isTable ? tdValueIndex! : index
  }
  const elementList = draw.getElementList()
  const positionList = position.getPositionList()
  const curIndex = isTable ? tdValueIndex! : index
  const curElement = elementList[curIndex]
  // 绘制
  const isDirectHitImage = !!(isDirectHit && isImage)
  const isDirectHitCheckbox = !!(isDirectHit && isCheckbox)
  if (~index) {
    rangeManager.setRange(curIndex, curIndex)
    position.setCursorPosition(positionList[curIndex])
    // 复选框
    const isSetCheckbox = isDirectHitCheckbox && !isReadonly
    if (isSetCheckbox) {
      const { checkbox } = curElement
      if (checkbox) {
        checkbox.value = !checkbox.value
      } else {
        curElement.checkbox = {
          value: true
        }
      }
      const control = draw.getControl()
      const activeControl = control.getActiveControl()
      if (activeControl instanceof CheckboxControl) {
        activeControl.setSelect()
      }
    }
    draw.render({
      curIndex,
      isSubmitHistory: isSetCheckbox,
      isSetCursor: !isDirectHitImage && !isDirectHitCheckbox,
      isCompute: false
    })
    // 首字需定位到行首，非上一行最后一个字后
    if (hitLineStartIndex) {
      host.getDraw().getCursor().drawCursor({
        hitLineStartIndex
      })
    }
  }
  // 预览工具组件
  const previewer = draw.getPreviewer()
  previewer.clearResizer()
  if (isDirectHitImage && !isReadonly) {
    previewer.drawResizer(
      curElement,
      positionList[curIndex],
      curElement.type === ElementType.LATEX
        ? {
            mime: 'svg',
            srcKey: 'laTexSVG'
          }
        : {}
    )
    // 光标事件代理丢失，重新定位
    draw.getCursor().drawCursor({
      isShow: false
    })
  }
  // 表格工具组件
  const tableTool = draw.getTableTool()
  tableTool.dispose()
  if (isTable && !isReadonly) {
    tableTool.render()
  }
  // 超链接
  const hyperlinkParticle = draw.getHyperlinkParticle()
  hyperlinkParticle.clearHyperlinkPopup()
  if (curElement.type === ElementType.HYPERLINK) {
    if (isMod(evt)) {
      hyperlinkParticle.openHyperlink(curElement)
    } else {
      hyperlinkParticle.drawHyperlinkPopup(curElement, positionList[curIndex])
    }
  }
  // 日期控件
  const dateParticle = draw.getDateParticle()
  dateParticle.clearDatePicker()
  if (curElement.type === ElementType.DATE && !isReadonly) {
    dateParticle.renderDatePicker(curElement, positionList[curIndex])
  }
}
