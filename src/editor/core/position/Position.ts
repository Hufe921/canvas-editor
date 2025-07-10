import { ElementType, ListStyle, RowFlex, VerticalAlign } from '../..'
import { ZERO } from '../../dataset/constant/Common'
import { ControlComponent } from '../../dataset/enum/Control'
import {
  IComputePageRowPositionPayload,
  IComputePageRowPositionResult,
  IComputeRowPositionPayload,
  IFloatPosition,
  IGetFloatPositionByXYPayload,
  ISetSurroundPositionPayload
} from '../../interface/Position'
import { IEditorOption } from '../../interface/Editor'
import { IElement, IElementPosition } from '../../interface/Element'
import {
  ICurrentPosition,
  IGetPositionByXYPayload,
  IPositionContext
} from '../../interface/Position'
import { Draw } from '../draw/Draw'
import { EditorMode, EditorZone } from '../../dataset/enum/Editor'
import { deepClone, isRectIntersect } from '../../utils'
import { ImageDisplay } from '../../dataset/enum/Common'
import { DeepRequired } from '../../interface/Common'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'
import { getIsBlockElement } from '../../utils/element'

export class Position {
  private cursorPosition: IElementPosition | null
  private positionContext: IPositionContext
  private positionList: IElementPosition[]
  private floatPositionList: IFloatPosition[]

  private draw: Draw
  private eventBus: EventBus<EventBusMap>
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.positionList = []
    this.floatPositionList = []
    this.cursorPosition = null
    this.positionContext = {
      isTable: false,
      isControl: false
    }

    this.draw = draw
    this.eventBus = draw.getEventBus()
    this.options = draw.getOptions()
  }

  public getFloatPositionList(): IFloatPosition[] {
    return this.floatPositionList
  }

  public getTablePositionList(
    sourceElementList: IElement[]
  ): IElementPosition[] {
    const { index, trIndex, tdIndex } = this.positionContext
    return (
      sourceElementList[index!].trList![trIndex!].tdList[tdIndex!]
        .positionList || []
    )
  }

  public getPositionList(): IElementPosition[] {
    return this.positionContext.isTable
      ? this.getTablePositionList(this.draw.getOriginalElementList())
      : this.getOriginalPositionList()
  }

  public getMainPositionList(): IElementPosition[] {
    return this.positionContext.isTable
      ? this.getTablePositionList(this.draw.getOriginalMainElementList())
      : this.positionList
  }

  public getOriginalPositionList(): IElementPosition[] {
    const zoneManager = this.draw.getZone()
    if (zoneManager.isHeaderActive()) {
      const header = this.draw.getHeader()
      return header.getPositionList()
    }
    if (zoneManager.isFooterActive()) {
      const footer = this.draw.getFooter()
      return footer.getPositionList()
    }
    return this.positionList
  }

  public getOriginalMainPositionList(): IElementPosition[] {
    return this.positionList
  }

  public getSelectionPositionList(): IElementPosition[] | null {
    const { startIndex, endIndex } = this.draw.getRange().getRange()
    if (startIndex === endIndex) return null
    const positionList = this.getPositionList()
    return positionList.slice(startIndex + 1, endIndex + 1)
  }

  public setPositionList(payload: IElementPosition[]) {
    this.positionList = payload
  }

  public setFloatPositionList(payload: IFloatPosition[]) {
    this.floatPositionList = payload
  }

  public computePageRowPosition(
    payload: IComputePageRowPositionPayload
  ): IComputePageRowPositionResult {
    const {
      positionList,
      rowList,
      pageNo,
      startX,
      startY,
      startRowIndex,
      startIndex,
      innerWidth,
      zone
    } = payload
    const {
      scale,
      table: { tdPadding }
    } = this.options
    let x = startX
    let y = startY
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 行存在环绕的可能性均不设置行布局
      if (!curRow.isSurround) {
        // 计算行偏移量（行居中、居右）
        const curRowWidth = curRow.width + (curRow.offsetX || 0)
        if (curRow.rowFlex === RowFlex.CENTER) {
          x += (innerWidth - curRowWidth) / 2
        } else if (curRow.rowFlex === RowFlex.RIGHT) {
          x += innerWidth - curRowWidth
        }
      }
      // 当前行X/Y轴偏移量
      x += curRow.offsetX || 0
      y += curRow.offsetY || 0
      // 当前td所在位置
      const tablePreX = x
      const tablePreY = y
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const metrics = element.metrics
        const offsetY =
          (element.imgDisplay !== ImageDisplay.INLINE &&
            element.type === ElementType.IMAGE) ||
          element.type === ElementType.LATEX
            ? curRow.ascent - metrics.height
            : curRow.ascent
        // 偏移量
        if (element.left) {
          x += element.left
        }
        const positionItem: IElementPosition = {
          pageNo,
          index,
          value: element.value,
          rowIndex: startRowIndex + i,
          rowNo: i,
          metrics,
          left: element.left || 0,
          ascent: offsetY,
          lineHeight: curRow.height,
          isFirstLetter: j === 0,
          isLastLetter: j === curRow.elementList.length - 1,
          coordinate: {
            leftTop: [x, y],
            leftBottom: [x, y + curRow.height],
            rightTop: [x + metrics.width, y],
            rightBottom: [x + metrics.width, y + curRow.height]
          }
        }
        // 缓存浮动元素信息
        if (
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
        ) {
          // 浮动元素使用上一位置信息
          const prePosition = positionList[positionList.length - 1]
          if (prePosition) {
            positionItem.metrics = prePosition.metrics
            positionItem.coordinate = prePosition.coordinate
          }
          // 兼容浮动元素初始坐标为空的情况-默认使用左上坐标
          if (!element.imgFloatPosition) {
            element.imgFloatPosition = {
              x,
              y,
              pageNo
            }
          }
          this.floatPositionList.push({
            pageNo,
            element,
            position: positionItem,
            isTable: payload.isTable,
            index: payload.index,
            tdIndex: payload.tdIndex,
            trIndex: payload.trIndex,
            tdValueIndex: index,
            zone
          })
        }
        positionList.push(positionItem)
        index++
        x += metrics.width
        // 计算表格内元素位置
        if (element.type === ElementType.TABLE) {
          const tdPaddingWidth = tdPadding[1] + tdPadding[3]
          const tdPaddingHeight = tdPadding[0] + tdPadding[2]
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList!.length; d++) {
              const td = tr.tdList[d]
              td.positionList = []
              const rowList = td.rowList!
              const drawRowResult = this.computePageRowPosition({
                positionList: td.positionList,
                rowList,
                pageNo,
                startRowIndex: 0,
                startIndex: 0,
                startX: (td.x! + tdPadding[3]) * scale + tablePreX,
                startY: (td.y! + tdPadding[0]) * scale + tablePreY,
                innerWidth: (td.width! - tdPaddingWidth) * scale,
                isTable: true,
                index: index - 1,
                tdIndex: d,
                trIndex: t,
                zone
              })
              // 垂直对齐方式
              if (
                td.verticalAlign === VerticalAlign.MIDDLE ||
                td.verticalAlign === VerticalAlign.BOTTOM
              ) {
                const rowsHeight = rowList.reduce(
                  (pre, cur) => pre + cur.height,
                  0
                )
                const blankHeight =
                  (td.height! - tdPaddingHeight) * scale - rowsHeight
                const offsetHeight =
                  td.verticalAlign === VerticalAlign.MIDDLE
                    ? blankHeight / 2
                    : blankHeight
                if (Math.floor(offsetHeight) > 0) {
                  td.positionList.forEach(tdPosition => {
                    const {
                      coordinate: { leftTop, leftBottom, rightBottom, rightTop }
                    } = tdPosition
                    leftTop[1] += offsetHeight
                    leftBottom[1] += offsetHeight
                    rightBottom[1] += offsetHeight
                    rightTop[1] += offsetHeight
                  })
                }
              }
              x = drawRowResult.x
              y = drawRowResult.y
            }
          }
          // 恢复初始x、y
          x = tablePreX
          y = tablePreY
        }
      }
      x = startX
      y += curRow.height
    }
    return { x, y, index }
  }

  public computePositionList() {
    // 置空原位置信息
    this.positionList = []
    // 按每页行计算
    const innerWidth = this.draw.getInnerWidth()
    const pageRowList = this.draw.getPageRowList()
    const margins = this.draw.getMargins()
    const startX = margins[3]
    // 起始位置受页眉影响
    const header = this.draw.getHeader()
    const extraHeight = header.getExtraHeight()
    const startY = margins[0] + extraHeight
    let startRowIndex = 0
    for (let i = 0; i < pageRowList.length; i++) {
      const rowList = pageRowList[i]
      const startIndex = rowList[0]?.startIndex
      this.computePageRowPosition({
        positionList: this.positionList,
        rowList,
        pageNo: i,
        startRowIndex,
        startIndex,
        startX,
        startY,
        innerWidth
      })
      startRowIndex += rowList.length
    }
  }

  public computeRowPosition(
    payload: IComputeRowPositionPayload
  ): IElementPosition[] {
    const { row, innerWidth } = payload
    const positionList: IElementPosition[] = []
    this.computePageRowPosition({
      positionList,
      innerWidth,
      rowList: [deepClone(row)],
      pageNo: 0,
      startX: 0,
      startY: 0,
      startIndex: 0,
      startRowIndex: 0
    })
    return positionList
  }

  public setCursorPosition(position: IElementPosition | null) {
    this.cursorPosition = position
  }

  public getCursorPosition(): IElementPosition | null {
    return this.cursorPosition
  }

  public getPositionContext(): IPositionContext {
    return this.positionContext
  }

  public setPositionContext(payload: IPositionContext) {
    this.eventBus.emit('positionContextChange', {
      value: payload,
      oldValue: this.positionContext
    })
    this.positionContext = payload
  }

  public getPositionByXY(payload: IGetPositionByXYPayload): ICurrentPosition {
    const { x, y, isTable } = payload
    let { elementList, positionList } = payload
    if (!elementList) {
      elementList = this.draw.getOriginalElementList()
    }
    if (!positionList) {
      positionList = this.getOriginalPositionList()
    }
    const zoneManager = this.draw.getZone()
    const curPageNo = payload.pageNo ?? this.draw.getPageNo()
    const isMainActive = zoneManager.isMainActive()
    const positionNo = isMainActive ? curPageNo : 0
    // 验证浮于文字上方元素
    if (!isTable) {
      const floatTopPosition = this.getFloatPositionByXY({
        ...payload,
        imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
      })
      if (floatTopPosition) return floatTopPosition
    }
    // 普通元素
    for (let j = 0; j < positionList.length; j++) {
      const {
        index,
        pageNo,
        left,
        isFirstLetter,
        coordinate: { leftTop, rightTop, leftBottom }
      } = positionList[j]
      if (positionNo !== pageNo) continue
      if (pageNo > positionNo) break
      // 命中元素
      if (
        leftTop[0] - left <= x &&
        rightTop[0] >= x &&
        leftTop[1] <= y &&
        leftBottom[1] >= y
      ) {
        let curPositionIndex = j
        const element = elementList[j]
        // 表格被命中
        if (element.type === ElementType.TABLE) {
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              const tablePosition = this.getPositionByXY({
                x,
                y,
                td,
                pageNo: curPageNo,
                tablePosition: positionList[j],
                isTable: true,
                elementList: td.value,
                positionList: td.positionList
              })
              if (~tablePosition.index) {
                const { index: tdValueIndex, hitLineStartIndex } = tablePosition
                const tdValueElement = td.value[tdValueIndex]
                return {
                  index,
                  isCheckbox:
                    tablePosition.isCheckbox ||
                    tdValueElement.type === ElementType.CHECKBOX ||
                    tdValueElement.controlComponent ===
                      ControlComponent.CHECKBOX,
                  isRadio:
                    tdValueElement.type === ElementType.RADIO ||
                    tdValueElement.controlComponent === ControlComponent.RADIO,
                  isControl: !!tdValueElement.controlId,
                  isImage: tablePosition.isImage,
                  isDirectHit: tablePosition.isDirectHit,
                  isTable: true,
                  tdIndex: d,
                  trIndex: t,
                  tdValueIndex,
                  tdId: td.id,
                  trId: tr.id,
                  tableId: element.id,
                  hitLineStartIndex
                }
              }
            }
          }
        }
        // 图片区域均为命中
        if (
          element.type === ElementType.IMAGE ||
          element.type === ElementType.LATEX
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isImage: true
          }
        }
        if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isCheckbox: true
          }
        }
        if (
          element.type === ElementType.TAB &&
          element.listStyle === ListStyle.CHECKBOX
        ) {
          // 向前找checkbox元素
          let index = curPositionIndex - 1
          while (index > 0) {
            const element = elementList[index]
            if (
              element.value === ZERO &&
              element.listStyle === ListStyle.CHECKBOX
            ) {
              break
            }
            index--
          }
          return {
            index,
            isDirectHit: true,
            isCheckbox: true
          }
        }
        if (
          element.type === ElementType.RADIO ||
          element.controlComponent === ControlComponent.RADIO
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isRadio: true
          }
        }
        let hitLineStartIndex: number | undefined
        // 判断是否在文字中间前后
        if (elementList[index].value !== ZERO) {
          const valueWidth = rightTop[0] - leftTop[0]
          if (x < leftTop[0] + valueWidth / 2) {
            curPositionIndex = j - 1
            if (isFirstLetter) {
              hitLineStartIndex = j
            }
          }
        }
        return {
          isDirectHit: true,
          hitLineStartIndex,
          index: curPositionIndex,
          isControl: !!element.controlId
        }
      }
    }
    // 验证衬于文字下方元素
    if (!isTable) {
      const floatBottomPosition = this.getFloatPositionByXY({
        ...payload,
        imgDisplays: [ImageDisplay.FLOAT_BOTTOM]
      })
      if (floatBottomPosition) return floatBottomPosition
    }
    // 非命中区域
    let isLastArea = false
    let curPositionIndex = -1
    let hitLineStartIndex: number | undefined
    // 判断是否在表格内
    if (isTable) {
      const { scale } = this.options
      const { td, tablePosition } = payload
      if (td && tablePosition) {
        const { leftTop } = tablePosition.coordinate
        const tdX = td.x! * scale + leftTop[0]
        const tdY = td.y! * scale + leftTop[1]
        const tdWidth = td.width! * scale
        const tdHeight = td.height! * scale
        if (!(tdX < x && x < tdX + tdWidth && tdY < y && y < tdY + tdHeight)) {
          return {
            index: curPositionIndex
          }
        }
      }
    }
    // 判断所属行是否存在元素
    const lastLetterList = positionList.filter(
      p => p.isLastLetter && p.pageNo === positionNo
    )
    for (let j = 0; j < lastLetterList.length; j++) {
      const {
        index,
        rowNo,
        coordinate: { leftTop, leftBottom }
      } = lastLetterList[j]
      if (y > leftTop[1] && y <= leftBottom[1]) {
        const headIndex = positionList.findIndex(
          p => p.pageNo === positionNo && p.rowNo === rowNo
        )
        const headElement = elementList[headIndex]
        const headPosition = positionList[headIndex]
        // 是否在头部
        const headStartX =
          headElement.listStyle === ListStyle.CHECKBOX
            ? this.draw.getMargins()[3]
            : headPosition.coordinate.leftTop[0]
        if (x < headStartX) {
          // 头部元素为空元素时无需选中
          if (~headIndex) {
            if (headPosition.value === ZERO) {
              curPositionIndex = headIndex
            } else {
              curPositionIndex = headIndex - 1
              hitLineStartIndex = headIndex
            }
          } else {
            curPositionIndex = index
          }
        } else {
          // 是否是复选框列表
          if (headElement.listStyle === ListStyle.CHECKBOX && x < leftTop[0]) {
            return {
              index: headIndex,
              isDirectHit: true,
              isCheckbox: true
            }
          }
          curPositionIndex = index
        }
        isLastArea = true
        break
      }
    }
    if (!isLastArea) {
      // 页眉底部距离页面顶部距离
      const header = this.draw.getHeader()
      const headerHeight = header.getHeight()
      const headerBottomY = header.getHeaderTop() + headerHeight
      // 页脚上部距离页面顶部距离
      const footer = this.draw.getFooter()
      const pageHeight = this.draw.getHeight()
      const footerTopY =
        pageHeight - (footer.getFooterBottom() + footer.getHeight())
      // 判断所属位置是否属于页眉页脚区域
      if (isMainActive) {
        // 页眉：当前位置小于页眉底部位置
        if (y < headerBottomY) {
          return {
            index: -1,
            zone: EditorZone.HEADER
          }
        }
        // 页脚：当前位置大于页脚顶部位置
        if (y > footerTopY) {
          return {
            index: -1,
            zone: EditorZone.FOOTER
          }
        }
      } else {
        // main区域：当前位置小于页眉底部位置 && 大于页脚顶部位置
        if (y <= footerTopY && y >= headerBottomY) {
          return {
            index: -1,
            zone: EditorZone.MAIN
          }
        }
      }
      // 正文上-循环首行
      const margins = this.draw.getMargins()
      if (y <= margins[0]) {
        for (let p = 0; p < positionList.length; p++) {
          const position = positionList[p]
          if (position.pageNo !== positionNo || position.rowNo !== 0) continue
          const { leftTop, rightTop } = position.coordinate
          // 小于左页边距 || 命中文字 || 首行最后元素
          if (
            x <= margins[3] ||
            (x >= leftTop[0] && x <= rightTop[0]) ||
            positionList[p + 1]?.rowNo !== 0
          ) {
            return {
              index: position.index
            }
          }
        }
      } else {
        // 正文下-循环尾行
        const lastLetter = lastLetterList[lastLetterList.length - 1]
        if (lastLetter) {
          const lastRowNo = lastLetter.rowNo
          for (let p = 0; p < positionList.length; p++) {
            const position = positionList[p]
            if (
              position.pageNo !== positionNo ||
              position.rowNo !== lastRowNo
            ) {
              continue
            }
            const { leftTop, rightTop } = position.coordinate
            // 小于左页边距 || 命中文字 || 尾行最后元素
            if (
              x <= margins[3] ||
              (x >= leftTop[0] && x <= rightTop[0]) ||
              positionList[p + 1]?.rowNo !== lastRowNo
            ) {
              return {
                index: position.index
              }
            }
          }
        }
      }
      // 当前页最后一行
      return {
        index:
          lastLetterList[lastLetterList.length - 1]?.index ||
          positionList.length - 1
      }
    }
    return {
      hitLineStartIndex,
      index: curPositionIndex,
      isControl: !!elementList[curPositionIndex]?.controlId
    }
  }

  public getFloatPositionByXY(
    payload: IGetFloatPositionByXYPayload
  ): ICurrentPosition | void {
    const { x, y } = payload
    const currentPageNo = payload.pageNo ?? this.draw.getPageNo()
    const currentZone = this.draw.getZone().getZone()
    const { scale } = this.options
    for (let f = 0; f < this.floatPositionList.length; f++) {
      const {
        position,
        element,
        isTable,
        index,
        trIndex,
        tdIndex,
        tdValueIndex,
        zone: floatElementZone,
        pageNo
      } = this.floatPositionList[f]
      if (
        currentPageNo === pageNo &&
        element.type === ElementType.IMAGE &&
        element.imgDisplay &&
        payload.imgDisplays.includes(element.imgDisplay) &&
        (!floatElementZone || floatElementZone === currentZone)
      ) {
        const imgFloatPosition = element.imgFloatPosition!
        const imgFloatPositionX = imgFloatPosition.x * scale
        const imgFloatPositionY = imgFloatPosition.y * scale
        const elementWidth = element.width! * scale
        const elementHeight = element.height! * scale
        if (
          x >= imgFloatPositionX &&
          x <= imgFloatPositionX + elementWidth &&
          y >= imgFloatPositionY &&
          y <= imgFloatPositionY + elementHeight
        ) {
          if (isTable) {
            return {
              index: index!,
              isDirectHit: true,
              isImage: true,
              isTable,
              trIndex,
              tdIndex,
              tdValueIndex,
              tdId: element.tdId,
              trId: element.trId,
              tableId: element.tableId
            }
          }
          return {
            index: position.index,
            isDirectHit: true,
            isImage: true
          }
        }
      }
    }
  }

  public adjustPositionContext(
    payload: IGetPositionByXYPayload
  ): ICurrentPosition | null {
    const positionResult = this.getPositionByXY(payload)
    if (!~positionResult.index) return null
    // 移动控件内光标
    if (
      positionResult.isControl &&
      this.draw.getMode() !== EditorMode.READONLY
    ) {
      const { index, isTable, trIndex, tdIndex, tdValueIndex } = positionResult
      const control = this.draw.getControl()
      const { newIndex } = control.moveCursor({
        index,
        isTable,
        trIndex,
        tdIndex,
        tdValueIndex
      })
      if (isTable) {
        positionResult.tdValueIndex = newIndex
      } else {
        positionResult.index = newIndex
      }
    }
    const {
      index,
      isCheckbox,
      isRadio,
      isControl,
      isImage,
      isDirectHit,
      isTable,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId
    } = positionResult
    // 设置位置上下文
    this.setPositionContext({
      isTable: isTable || false,
      isCheckbox: isCheckbox || false,
      isRadio: isRadio || false,
      isControl: isControl || false,
      isImage: isImage || false,
      isDirectHit: isDirectHit || false,
      index,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId
    })
    return positionResult
  }

  public setSurroundPosition(payload: ISetSurroundPositionPayload) {
    const {
      pageNo,
      row,
      rowElement,
      rowElementRect,
      surroundElementList,
      availableWidth
    } = payload
    let x = rowElementRect.x
    let rowIncreaseWidth = 0
    if (
      surroundElementList.length &&
      !getIsBlockElement(rowElement) &&
      !rowElement.control?.minWidth
    ) {
      for (let s = 0; s < surroundElementList.length; s++) {
        const surroundElement = surroundElementList[s]
        const floatPosition = surroundElement.imgFloatPosition!
        if (floatPosition.pageNo !== pageNo) continue
        const surroundRect = {
          ...floatPosition,
          width: surroundElement.width!,
          height: surroundElement.height!
        }
        if (isRectIntersect(rowElementRect, surroundRect)) {
          row.isSurround = true
          // 需向左移动距离：浮动元素宽度 + 浮动元素左上坐标 - 元素左上坐标
          const translateX =
            surroundRect.width + surroundRect.x - rowElementRect.x
          rowElement.left = translateX
          // 增加行宽
          row.width += translateX
          rowIncreaseWidth += translateX
          // 下个元素起始位置：浮动元素右坐标 - 元素宽度
          x = surroundRect.x + surroundRect.width
          // 检测宽度是否足够，不够则移动到下一行，并还原状态
          if (row.width + rowElement.metrics.width > availableWidth) {
            rowElement.left = 0
            row.width -= rowIncreaseWidth
            break
          }
        }
      }
    }
    return { x, rowIncreaseWidth }
  }
}
