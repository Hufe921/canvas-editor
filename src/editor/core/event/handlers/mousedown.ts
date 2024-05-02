import { ImageDisplay } from '../../../dataset/enum/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { MouseEventButton } from '../../../dataset/enum/Event'
import { deepClone } from '../../../utils'
import { isMod } from '../../../utils/hotkey'
import { CheckboxControl } from '../../draw/control/checkbox/CheckboxControl'
import { RadioControl } from '../../draw/control/radio/RadioControl'
import { CanvasEvent } from '../CanvasEvent'

export function setRangeCache(host: CanvasEvent) {
  const draw = host.getDraw()
  const position = draw.getPosition()
  const rangeManager = draw.getRange()
  // 缓存选区上下文信息
  host.isAllowDrag = true
  host.cacheRange = deepClone(rangeManager.getRange())
  host.cacheElementList = draw.getElementList()
  host.cachePositionList = position.getPositionList()
  host.cachePositionContext = position.getPositionContext()
}

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
        setRangeCache(host)
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
    isRadio,
    isImage,
    isTable,
    tdValueIndex,
    hitLineStartIndex
  } = positionResult
  // 记录选区开始位置
  host.mouseDownStartPosition = {
    ...positionResult,
    index: isTable ? tdValueIndex! : index,
    x: evt.offsetX,
    y: evt.offsetY
  }
  const elementList = draw.getElementList()
  const positionList = position.getPositionList()
  const curIndex = isTable ? tdValueIndex! : index
  const curElement = elementList[curIndex]
  // 绘制
  const isDirectHitImage = !!(isDirectHit && isImage)
  const isDirectHitCheckbox = !!(isDirectHit && isCheckbox)
  const isDirectHitRadio = !!(isDirectHit && isRadio)
  if (~index) {
    rangeManager.setRange(curIndex, curIndex)
    position.setCursorPosition(positionList[curIndex])
    // 复选框
    const isSetCheckbox = isDirectHitCheckbox && !isReadonly
    // 单选框
    const isSetRadio = isDirectHitRadio && !isReadonly
    if (isSetCheckbox) {
      const { checkbox, control } = curElement
      // 复选框不在控件内独立控制
      if (!control) {
        draw.getCheckboxParticle().setSelect(curElement)
      } else {
        const codes = control?.code?.split(',') || []
        if (checkbox?.value) {
          const codeIndex = codes.findIndex(c => c === checkbox.code)
          codes.splice(codeIndex, 1)
        } else {
          if (checkbox?.code) {
            codes.push(checkbox.code)
          }
        }
        const activeControl = draw.getControl().getActiveControl()
        if (activeControl instanceof CheckboxControl) {
          activeControl.setSelect(codes)
        }
      }
    } else if (isSetRadio) {
      const { control, radio } = curElement
      // 单选框不在控件内独立控制
      if (!control) {
        draw.getRadioParticle().setSelect(curElement)
      } else {
        const codes = radio?.code ? [radio.code] : []
        const activeControl = draw.getControl().getActiveControl()
        if (activeControl instanceof RadioControl) {
          activeControl.setSelect(codes)
        }
      }
    } else {
      draw.render({
        curIndex,
        isCompute: false,
        isSubmitHistory: false,
        isSetCursor:
          !isDirectHitImage && !isDirectHitCheckbox && !isDirectHitRadio
      })
    }
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
  if (isDirectHitImage) {
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
    // 点击图片允许拖拽调整位置
    setRangeCache(host)
    // 浮动元素创建镜像图片
    if (
      curElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
      curElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
    ) {
      draw.getImageParticle().createFloatImage(curElement)
    }
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
