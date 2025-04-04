import { ImageDisplay } from '../../../dataset/enum/Common'
import { EditorMode } from '../../../dataset/enum/Editor'
import { ElementType } from '../../../dataset/enum/Element'
import { MouseEventButton } from '../../../dataset/enum/Event'
import { ControlComponent } from '../../../dataset/enum/Control'
import { ControlType } from '../../../dataset/enum/Control'
import { IPreviewerDrawOption } from '../../../interface/Previewer'
import { deepClone } from '../../../utils'
import { isMod } from '../../../utils/hotkey'
import { CheckboxControl } from '../../draw/control/checkbox/CheckboxControl'
import { RadioControl } from '../../draw/control/radio/RadioControl'
import { CanvasEvent } from '../CanvasEvent'
import { IElement } from '../../../interface/Element'
import { Draw } from '../../draw/Draw'

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

export function hitCheckbox(element: IElement, draw: Draw) {
  const { checkbox, control } = element
  // 复选框不在控件内独立控制
  if (!control) {
    draw.getCheckboxParticle().setSelect(element)
  } else {
    const codes = control?.code ? control.code.split(',') : []
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
}

export function hitRadio(element: IElement, draw: Draw) {
  const { radio, control } = element
  // 单选框不在控件内独立控制
  if (!control) {
    draw.getRadioParticle().setSelect(element)
  } else {
    const codes = radio?.code ? [radio.code] : []
    const activeControl = draw.getControl().getActiveControl()
    if (activeControl instanceof RadioControl) {
      activeControl.setSelect(codes)
    }
  }
}

export function mousedown(evt: MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  const rangeManager = draw.getRange()
  const position = draw.getPosition()
  // 存在选区时忽略右键点击
  const range = rangeManager.getRange()
  if (
    evt.button === MouseEventButton.RIGHT &&
    (range.isCrossRowCol || !rangeManager.getIsCollapsed())
  ) {
    return
  }
  // 是否是选区拖拽
  if (!host.isAllowDrag) {
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
  // 缓存旧上下文信息
  const oldPositionContext = deepClone(position.getPositionContext())
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
    let startIndex = curIndex
    let endIndex = curIndex
    // shift激活时进行选区处理
    if (evt.shiftKey) {
      const { startIndex: oldStartIndex } = rangeManager.getRange()
      if (~oldStartIndex) {
        const newPositionContext = position.getPositionContext()
        if (newPositionContext.tdId === oldPositionContext.tdId) {
          if (curIndex > oldStartIndex) {
            startIndex = oldStartIndex
          } else {
            endIndex = oldStartIndex
          }
        }
      }
    }
    rangeManager.setRange(startIndex, endIndex)
    position.setCursorPosition(positionList[curIndex])
    // 复选框
    if (isDirectHitCheckbox && !isReadonly) {
      hitCheckbox(curElement, draw)
    } else if (isDirectHitRadio && !isReadonly) {
      hitRadio(curElement, draw)
    } else if (
      curElement.controlComponent === ControlComponent.VALUE &&
      (curElement.control?.type === ControlType.CHECKBOX ||
        curElement.control?.type === ControlType.RADIO)
    ) {
      // 向左查找
      let preIndex = curIndex
      while (preIndex > 0) {
        const preElement = elementList[preIndex]
        if (preElement.controlComponent === ControlComponent.CHECKBOX) {
          hitCheckbox(preElement, draw)
          break
        } else if (preElement.controlComponent === ControlComponent.RADIO) {
          hitRadio(preElement, draw)
          break
        }
        preIndex--
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
    const previewerDrawOption: IPreviewerDrawOption = {
      // 只读或控件外表单模式禁用拖拽
      dragDisable:
        isReadonly ||
        (!curElement.controlId && draw.getMode() === EditorMode.FORM)
    }
    if (curElement.type === ElementType.LATEX) {
      previewerDrawOption.mime = 'svg'
      previewerDrawOption.srcKey = 'laTexSVG'
    }
    previewer.drawResizer(
      curElement,
      positionList[curIndex],
      previewerDrawOption
    )
    // 光标事件代理丢失，重新定位
    draw.getCursor().drawCursor({
      isShow: false
    })
    // 点击图片允许拖拽调整位置
    setRangeCache(host)
    // 浮动元素创建镜像图片
    if (
      curElement.imgDisplay === ImageDisplay.SURROUND ||
      curElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
      curElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
    ) {
      draw.getImageParticle().createFloatImage(curElement)
    }
  }
  // 表格工具组件
  const tableTool = draw.getTableTool()
  tableTool.dispose()
  if (isTable && !isReadonly && draw.getMode() !== EditorMode.FORM) {
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
