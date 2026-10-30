import { ZERO } from '../../dataset/constant/Common'
import { FlexDirection, ImageDisplay } from '../../dataset/enum/Common'
import {
  ControlComponent,
  ControlIndentation
} from '../../dataset/enum/Control'
import { ElementType } from '../../dataset/enum/Element'
import { PageMode, PaperDirection, WordBreak } from '../../dataset/enum/Editor'
import { RowFlex } from '../../dataset/enum/Row'
import { IComputeRowListPayload } from '../../interface/Draw'
import { IElement, IElementMetrics } from '../../interface/Element'
import { IRow, IRowComputeState, IRowElement } from '../../interface/Row'
import {
  deleteSurroundElementList,
  getIsBlockElement
} from '../../utils/element'
import { shrinkColgroupToWidth } from '../../utils/table'
import type { Draw } from '../draw/Draw'

// 段首换行符可能携带上一段落属性（尾随\n风格数据/格式克隆），
// 段落首行缩进属性优先读段内第一个内容元素，空段落退回换行符自身
function getFirstLineIndentElement(
  elementList: IElement[],
  zeroIndex: number
): IElement | undefined {
  const next = elementList[zeroIndex + 1]
  if (next && next.value !== ZERO && !next.listWrap) return next
  return elementList[zeroIndex]
}

export interface IComputePageListPayload {
  rowList: IRow[]
  elementList: IElement[]
  pageMode: PageMode
  paperDirection: PaperDirection
  maxPageNo?: number | null
}

export interface IComputePageListResult {
  pageRowList: IRow[][]
  pageDirectionList: PaperDirection[]
  elementList: IElement[]
  isElementListTruncated: boolean
}

export class LayoutEngine {
  private draw: Draw
  private controlMinWidthPlaceholderElementListSet = new WeakSet<IElement[]>()

  constructor(draw: Draw) {
    this.draw = draw
  }

  public consumeControlMinWidthPlaceholders(elementList: IElement[]): void {
    if (!this.controlMinWidthPlaceholderElementListSet.has(elementList)) return
    for (let i = elementList.length - 1; i >= 0; i--) {
      if (elementList[i].isControlMinWidthPlaceholder) {
        elementList.splice(i, 1)
      }
    }
    this.controlMinWidthPlaceholderElementListSet.delete(elementList)
  }

  public markControlMinWidthPlaceholders(elementList: IElement[]): void {
    this.controlMinWidthPlaceholderElementListSet.add(elementList)
  }

  public getIsControlMinWidthPlaceholder(elementList: IElement[]): boolean {
    return this.controlMinWidthPlaceholderElementListSet.has(elementList)
  }

  public computeRowList(payload: IComputeRowListPayload): IRow[] {
    const draw = this.draw
    const {
      innerWidth,
      elementList,
      isPagingMode = false,
      isFromTable = false,
      startX = 0,
      startY = 0,
      pageHeight = 0,
      surroundElementList = []
    } = payload
    const options = draw.getOptions()
    const {
      defaultSize,
      scale,
      imgCaption,
      table: { tdPadding, defaultColMinWidth, overflow },
      defaultTabWidth
    } = options
    const defaultBasicRowMarginHeight = draw.getDefaultBasicRowMarginHeight()
    const ctx = document
      .createElement('canvas')
      .getContext('2d') as CanvasRenderingContext2D
    const textParticle = draw.getTextParticle()
    const listParticle = draw.getListParticle()
    // 还原最小宽度控件占位
    this.consumeControlMinWidthPlaceholders(elementList)
    // 计算列表偏移宽度
    const listStyleMap = listParticle.computeListStyle(ctx, elementList)
    const resumeStartIndex = payload.resume?.startIndex ?? 0
    // 段首tab悬挂宽度：段首连续tab元素宽度决定续行悬挂偏移（换行后续行对齐tab列）
    const tabWidth = defaultTabWidth * scale
    // 种子为段内续行时，从段头正向累计段首连续tab宽度（首个内容元素截止）
    const seedElement = elementList[resumeStartIndex]
    let paragraphLeadingTabWidth = 0
    let isLeadingTabRunOpen = true
    // 全量计算时首行即段落首行；续算时行首换行符为段落首行
    const isSeedParagraphFirst = payload.resume
      ? seedElement?.value === ZERO && !seedElement?.listWrap
      : true
    if (!isSeedParagraphFirst) {
      // 种子为段内续行：回扫段头后正向累计段首连续tab宽度（首个内容元素截止）
      let paragraphStartIndex = 0
      for (let i = resumeStartIndex - 1; i >= 0; i--) {
        const el = elementList[i]
        if (el.value === ZERO && !el.listWrap) {
          paragraphStartIndex = i
          break
        }
      }
      const contentScanStart =
        elementList[paragraphStartIndex]?.value === ZERO &&
        !elementList[paragraphStartIndex].listWrap
          ? paragraphStartIndex + 1
          : paragraphStartIndex
      for (let i = contentScanStart; i < resumeStartIndex; i++) {
        const el = elementList[i]
        if (el.type === ElementType.TAB) {
          paragraphLeadingTabWidth += tabWidth
        } else if (el.value !== ZERO) {
          break
        }
      }
    }
    // 种子行段落缩进兜底：换行诞生的新行在出生时写入offsetX，种子行无出生时机需在此计算
    const seedFirstLineElement = getFirstLineIndentElement(
      elementList,
      resumeStartIndex
    )
    const seedIndentLeft = isSeedParagraphFirst
      ? (seedFirstLineElement?.indentLeft ?? 0) +
        (seedFirstLineElement?.indentFirstLine ?? 0)
      : (seedElement?.indentLeft ?? 0)
    const seedIndentOffsetX =
      Math.max(seedIndentLeft, 0) * scale +
      (isSeedParagraphFirst ? 0 : paragraphLeadingTabWidth)
    const rowList: IRow[] = []
    let layout = isPagingMode && !isFromTable ? draw.getColumnLayout() : null
    let isColumnEnabled = !!layout && layout.count > 1
    // 断点续算：种子行从恢复点重新参与断行（行首换行符将独立成行，空种子行随后被丢弃）
    if (elementList.length) {
      const seedRow: IRow = {
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        startIndex: resumeStartIndex,
        rowIndex: payload.resume?.state.rowIndex ?? 0,
        rowFlex:
          elementList[resumeStartIndex]?.rowFlex ||
          elementList[resumeStartIndex + 1]?.rowFlex,
        ...(isColumnEnabled ? { columnIndex: 0 } : {})
      }
      // 种子行无行出生时机，段落缩进直接写入（渲染与可用宽度均消费offsetX）
      if (seedIndentOffsetX > 0) {
        seedRow.offsetX = seedIndentOffsetX
      }
      rowList.push(seedRow)
    }
    // 起始位置及页码计算
    let x = startX
    let y = startY
    let pageNo = 0
    // 混排横竖版：跟随分页符上的 paperDirection 切换当前节的排版方向
    let currentDirection = options.paperDirection
    let currentMargins = draw.getMargins(currentDirection)
    let currentInnerWidth = innerWidth
    let currentStartX = startX
    let currentPageHeight = pageHeight
    // 分页模式下按页计算起始 Y（页眉/页脚禁用时该页起始位置上移）
    let pageStartY = startY
    if (isPagingMode && !isFromTable) {
      pageStartY = currentMargins[0] + draw.getHeader().getExtraHeight(0)
      y = pageStartY
    }
    // 列表位置
    // 不同 listId 独立计数，避免父列表与子列表序号互相影响
    const listIndexMap: Map<string, number> = new Map()
    // 控件最小宽度
    let controlRealWidth = 0
    // 分栏游标
    let currentColumn = 0
    // 断点续算：恢复快照时刻的跨行状态
    if (payload.resume) {
      const state = payload.resume.state
      x = state.x
      y = state.y
      pageNo = state.pageNo
      pageStartY = state.pageStartY
      currentDirection = state.direction
      currentMargins = state.margins
      currentInnerWidth = state.innerWidth
      currentStartX = state.startX
      currentPageHeight = state.pageHeight
      currentColumn = state.column
      controlRealWidth = state.controlRealWidth
      for (const [listId, count] of state.listIndexMap) {
        listIndexMap.set(listId, count)
      }
      layout = draw.getColumnLayout(currentDirection)
      isColumnEnabled = !!layout && layout.count > 1
    }
    // 行快照：仅主文档且开启行级增量时记录（未开启时无额外开销）。
    // 闭包捕获的是调用时刻的跨行状态，两个记录点（首行/换行诞生新行）共用
    const isRecordRowSnapshot =
      options.lab.incrementalCompute &&
      !isFromTable &&
      draw.isMainElementList(elementList)
    const buildRowComputeState = (
      rowIndex: number,
      x: number,
      controlWidth: number
    ): IRowComputeState => ({
      rowIndex,
      x,
      y,
      pageNo,
      pageStartY,
      direction: currentDirection,
      margins: currentMargins,
      innerWidth: currentInnerWidth,
      startX: currentStartX,
      pageHeight: currentPageHeight,
      column: currentColumn,
      controlRealWidth: controlWidth,
      listIndexMap: new Map(listIndexMap)
    })
    if (isRecordRowSnapshot && rowList.length) {
      draw
        .getIncrementalRowComputer()
        .recordSnapshot(
          rowList[0],
          buildRowComputeState(rowList[0].rowIndex, x, controlRealWidth)
        )
    }
    for (let i = resumeStartIndex; i < elementList.length; i++) {
      const curRow: IRow = rowList[rowList.length - 1]
      const element = elementList[i]
      // 断点续算：复杂结构元素不参与增量，由调用方退化为全量计算
      if (payload.resume?.shouldAbort?.(element, i)) break
      // 段首tab悬挂累计：换行符开启新段落累计窗口，首个内容元素后关闭
      if (isLeadingTabRunOpen) {
        if (element.type === ElementType.TAB) {
          paragraphLeadingTabWidth += tabWidth
        } else if (element.value !== ZERO) {
          isLeadingTabRunOpen = false
        }
      }
      // 元素参与计算前的控件最小宽度累计（行快照需要描述行首元素消费前的状态）
      const preControlRealWidth = controlRealWidth
      const rowMargin = draw.getElementRowMargin(element)
      const metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      // 实际可用宽度（列表/控件/段落缩进偏移在行出生或种子行创建时写入offsetX）
      const offsetX =
        curRow.offsetX ||
        (element.listId &&
          (listStyleMap.get(element.listId) || 0) +
            (element.listLevel
              ? draw.getListParticle().LIST_INDENT_WIDTH *
                element.listLevel *
                scale
              : 0)) ||
        0
      const rowMaxWidth =
        isColumnEnabled && layout ? layout.width : currentInnerWidth
      // 右缩进仅收窄可用宽度，不影响行起始位置
      const availableWidth =
        rowMaxWidth - offsetX - (element.indentRight || 0) * scale
      // 增加起始位置坐标偏移量
      const isStartElement = curRow.elementList.length === 1
      x += isStartElement ? offsetX : 0
      y += isStartElement ? curRow.offsetY || 0 : 0
      if (
        (element.hide ||
          element.control?.hide ||
          (element.area?.hide && !draw.isAreaHideDisabled()) ||
          draw.getTraceParticle().isTraceHidden(element)) &&
        !draw.isDesignMode()
      ) {
        // 断点续算：行首隐藏元素的高度继承自上一行末元素（续算点上一行由调用方传入）
        const preElement =
          curRow.elementList[curRow.elementList.length - 1] ||
          (i === resumeStartIndex
            ? payload.resume?.preRowLastElement
            : undefined)
        metrics.height = preElement?.metrics.height || defaultSize * scale
        metrics.boundingBoxAscent = preElement?.metrics.boundingBoxAscent || 0
        metrics.boundingBoxDescent = preElement?.metrics.boundingBoxDescent || 0
      } else if (
        element.type === ElementType.IMAGE ||
        element.type === ElementType.LATEX
      ) {
        // 浮动图片无需计算数据
        if (
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
        ) {
          metrics.width = 0
          metrics.height = 0
          metrics.boundingBoxDescent = 0
        } else {
          const elementWidth = element.width! * scale
          const elementHeight = element.height! * scale
          // 图片超出尺寸后自适应（图片大小大于可用宽度时）
          if (elementWidth > availableWidth) {
            const adaptiveHeight =
              (elementHeight * availableWidth) / elementWidth
            element.width = availableWidth / scale
            element.height = adaptiveHeight / scale
            metrics.width = availableWidth
            metrics.height = adaptiveHeight
            metrics.boundingBoxDescent = adaptiveHeight
          } else {
            metrics.width = elementWidth
            metrics.height = elementHeight
            metrics.boundingBoxDescent = elementHeight
          }
          // 增加题注高度
          if (element.imgCaption?.value) {
            const fontSize = element.imgCaption.size || imgCaption.size
            const captionTop = element.imgCaption.top ?? imgCaption.top
            const captionHeight = (fontSize + captionTop) * scale
            metrics.boundingBoxAscent += captionHeight
          }
        }
      } else if (element.type === ElementType.TABLE) {
        const tdPaddingWidth = tdPadding[1] + tdPadding[3]
        const tdPaddingHeight = tdPadding[0] + tdPadding[2]
        // 表格跨页在渲染层拆分行（数据层保持单一表格）
        const trList = element.trList!
        // 重置tr高度：行高不可低于一个单元格最小高度
        const tdMinHeight =
          tdPaddingHeight + defaultSize + (rowMargin * 2) / scale
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          // 行高默认当前最小高度，后续根据内容自适应
          tr.height = Math.max(tdMinHeight, tr.minHeight || 0)
          tr.minHeight = tr.height
        }
        // 表格不允许超出正文区域时：等比例压缩列宽至内容区内，并清除横向偏移
        if (!overflow) {
          shrinkColgroupToWidth(
            element.colgroup!,
            draw.getOriginalInnerWidth(),
            defaultColMinWidth
          )
          element.translateX = 0
        }
        // 计算表格行列
        draw.getTableParticle().computeRowColInfo(element)
        // 计算表格内元素信息
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const rowList = this.computeRowList({
              innerWidth: (td.width! - tdPaddingWidth) * scale,
              elementList: td.value,
              isFromTable: true,
              isPagingMode
            })
            const rowHeight = rowList.reduce((pre, cur) => pre + cur.height, 0)
            td.rowList = rowList
            // 移除缩放导致的行高变化-渲染时会进行缩放调整
            const curTdHeight = rowHeight / scale + tdPaddingHeight
            // 内容高度大于当前单元格高度需增加
            if (td.height! < curTdHeight) {
              const extraHeight = curTdHeight - td.height!
              const changeTr = trList[t + td.rowspan - 1]
              changeTr.height += extraHeight
              changeTr.tdList.forEach(changeTd => {
                changeTd.height! += extraHeight
                if (!changeTd.realHeight) {
                  changeTd.realHeight = changeTd.height!
                } else {
                  changeTd.realHeight! += extraHeight
                }
              })
            }
            // 当前单元格最小高度及真实高度（包含跨列）
            let curTdMinHeight = 0
            let curTdRealHeight = 0
            let i = 0
            while (i < td.rowspan) {
              const curTr = trList[i + t] || trList[t]
              curTdMinHeight += curTr.minHeight!
              curTdRealHeight += curTr.height!
              i++
            }
            td.realMinHeight = curTdMinHeight
            td.realHeight = curTdRealHeight
            td.mainHeight = curTdHeight
          }
        }
        // 单元格高度大于实际内容高度需减少
        const reduceTrList = draw.getTableParticle().getTrListGroupByCol(trList)
        for (let t = 0; t < reduceTrList.length; t++) {
          const tr = reduceTrList[t]
          let reduceHeight = -1
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const curTdRealHeight = td.realHeight!
            const curTdHeight = td.mainHeight!
            const curTdMinHeight = td.realMinHeight!
            // 获取最大可减少高度
            const curReduceHeight =
              curTdHeight < curTdMinHeight
                ? curTdRealHeight - curTdMinHeight
                : curTdRealHeight - curTdHeight
            if (!~reduceHeight || curReduceHeight < reduceHeight) {
              reduceHeight = curReduceHeight
            }
          }
          if (reduceHeight > 0) {
            const changeTr = trList[t]
            changeTr.height -= reduceHeight
            changeTr.tdList.forEach(changeTd => {
              changeTd.height! -= reduceHeight
              changeTd.realHeight! -= reduceHeight
            })
          }
        }
        // 需要重新计算表格内值
        draw.getTableParticle().computeRowColInfo(element)
        // 计算出表格高度
        const tableHeight = draw.getTableParticle().getTableHeight(element)
        const tableWidth = draw.getTableParticle().getTableWidth(element)
        element.width = tableWidth
        element.height = tableHeight
        const elementWidth = tableWidth * scale
        const elementHeight = tableHeight * scale
        metrics.width = elementWidth
        metrics.height = elementHeight
        metrics.boundingBoxDescent = elementHeight
        metrics.boundingBoxAscent = -rowMargin
        // 后一个元素也是表格则移除行间距
        if (elementList[i + 1]?.type === ElementType.TABLE) {
          metrics.boundingBoxAscent -= rowMargin
        }
      } else if (element.type === ElementType.SEPARATOR) {
        const {
          separator: { lineWidth: defaultLineWidth }
        } = options
        const lineWidth = element.lineWidth || defaultLineWidth
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = lineWidth * scale
        metrics.boundingBoxAscent = -rowMargin
        metrics.boundingBoxDescent = -rowMargin + metrics.height
      } else if (element.type === ElementType.PAGE_BREAK) {
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = defaultSize
      } else if (
        element.type === ElementType.RADIO ||
        element.controlComponent === ControlComponent.RADIO
      ) {
        const { width, height, gap } = options.radio
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (
        element.type === ElementType.CHECKBOX ||
        element.controlComponent === ControlComponent.CHECKBOX
      ) {
        const { width, height, gap } = options.checkbox
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (element.type === ElementType.TAB) {
        metrics.width = defaultTabWidth * scale
        metrics.height = defaultSize * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent = textParticle.getBasisWordBoundingBoxAscent(
          ctx,
          ctx.font
        )
      } else if (element.isControlMinWidthPlaceholder) {
        metrics.width = (element.width || 0) * scale
        metrics.height = defaultSize * scale
        ctx.font = draw.getElementFont(element)
        const basisMetrics = textParticle.measureBasisWord(ctx, element.font!)
        metrics.boundingBoxAscent = basisMetrics.actualBoundingBoxAscent * scale
        metrics.boundingBoxDescent =
          basisMetrics.actualBoundingBoxDescent * scale
      } else if (element.type === ElementType.BLOCK) {
        if (!element.width) {
          metrics.width = availableWidth
        } else {
          const elementWidth = element.width * scale
          metrics.width = Math.min(elementWidth, availableWidth)
        }
        metrics.height = element.height! * scale
        metrics.boundingBoxDescent = metrics.height
        metrics.boundingBoxAscent = 0
      } else if (element.type === ElementType.LABEL) {
        const {
          defaultSize,
          label: { defaultPadding }
        } = options
        ctx.font = draw.getElementFont(element)
        const fontMetrics = textParticle.measureText(ctx, element)
        metrics.width =
          (fontMetrics.width + defaultPadding[1] + defaultPadding[3]) * scale
        metrics.height = (element.size || defaultSize) * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent =
          (defaultPadding[0] + fontMetrics.actualBoundingBoxAscent) * scale
      } else {
        // 设置上下标真实字体尺寸
        const size = element.size || defaultSize
        if (
          element.type === ElementType.SUPERSCRIPT ||
          element.type === ElementType.SUBSCRIPT
        ) {
          element.actualSize = Math.ceil(size * 0.6)
        }
        metrics.height = (element.actualSize || size) * scale
        ctx.font = draw.getElementFont(element)
        const fontMetrics = textParticle.measureText(ctx, element)
        metrics.width = fontMetrics.width * scale
        if (element.letterSpacing) {
          metrics.width += element.letterSpacing * scale
        }
        // 使用基于字体的基准度量以确保一致的行高，避免字符特定度量导致的布局跳动
        const basisMetrics = textParticle.measureBasisWord(ctx, element.font!)
        metrics.boundingBoxAscent = basisMetrics.actualBoundingBoxAscent * scale
        metrics.boundingBoxDescent =
          basisMetrics.actualBoundingBoxDescent * scale
        if (element.type === ElementType.SUPERSCRIPT) {
          metrics.boundingBoxAscent += metrics.height / 2
        } else if (element.type === ElementType.SUBSCRIPT) {
          metrics.boundingBoxDescent += metrics.height / 2
        }
      }
      const ascent =
        !element.hide &&
        !draw.getTraceParticle().isTraceHidden(element) &&
        ((element.imgDisplay !== ImageDisplay.INLINE &&
          element.type === ElementType.IMAGE) ||
          element.type === ElementType.LATEX)
          ? metrics.height + rowMargin
          : metrics.boundingBoxAscent + rowMargin
      const height =
        rowMargin +
        metrics.boundingBoxAscent +
        metrics.boundingBoxDescent +
        rowMargin
      const rowElement: IRowElement = Object.assign(element, {
        metrics,
        left: 0,
        style: draw.getElementFont(element, scale)
      })
      // 控件开始时统计宽度，结束时消费最小宽度并补充跨行占位
      if (
        rowElement.control?.minWidth &&
        !rowElement.isControlMinWidthPlaceholder &&
        !draw.getTraceParticle().isTraceHidden(rowElement)
      ) {
        if (rowElement.controlComponent) {
          controlRealWidth += metrics.width
        }
        if (rowElement.controlComponent === ControlComponent.POSTFIX) {
          const controlMinWidth = rowElement.control.minWidth * scale
          const extraWidth = controlMinWidth - controlRealWidth
          const rowRemainingWidth = Math.max(
            availableWidth - curRow.width - rowElement.metrics.width,
            0
          )
          // 设置最小宽度控件属性（字符偏移量）
          draw.getControl().setMinWidthControlInfo({
            row: curRow,
            rowElement,
            availableWidth,
            controlRealWidth
          })
          let placeholderWidth = extraWidth - rowRemainingWidth
          const placeholderList: IElement[] = []
          while (placeholderWidth > 0) {
            const width = Math.min(placeholderWidth, availableWidth)
            placeholderList.push({
              ...rowElement,
              value: '',
              width: width / scale,
              left: 0,
              isControlMinWidthPlaceholder: true
            } as IElement)
            placeholderWidth -= width
          }
          if (placeholderList.length) {
            elementList.splice(i + 1, 0, ...placeholderList)
            this.markControlMinWidthPlaceholders(elementList)
          }
          controlRealWidth = 0
        }
      }
      // 超过限定宽度
      const preElement = elementList[i - 1]
      let nextElement = elementList[i + 1]
      // 累计行宽 + 当前元素宽度 + 排版宽度(英文单词整体宽度 + 后面标点符号宽度)
      let curRowWidth = curRow.width + metrics.width
      if (options.wordBreak === WordBreak.BREAK_WORD) {
        if (
          (!preElement?.type || preElement?.type === ElementType.TEXT) &&
          (!element.type || element.type === ElementType.TEXT)
        ) {
          // 英文单词
          const word = `${preElement?.value || ''}${element.value}`
          if (draw.isWordLike(word)) {
            const { width, endElement } = textParticle.measureWord(
              ctx,
              elementList,
              i
            )
            // 后面存在元素 && 单词宽度大于行可用宽度，无需折行
            const wordWidth = width * scale
            if (endElement && wordWidth <= availableWidth) {
              curRowWidth += wordWidth
              nextElement = endElement
            }
          }
          // 标点符号
          const punctuationWidth = textParticle.measurePunctuationWidth(
            ctx,
            nextElement
          )
          curRowWidth += punctuationWidth * scale
        }
      }
      // 列表信息
      if (element.listId && element.value === ZERO && !element.listWrap) {
        if (listIndexMap.has(element.listId)) {
          listIndexMap.set(
            element.listId,
            (listIndexMap.get(element.listId) ?? 0) + 1
          )
        } else {
          listIndexMap.set(element.listId, 0)
        }
      }
      // 计算四周环绕导致的元素偏移量
      const surroundPosition = draw.getPosition().setSurroundPosition({
        pageNo,
        rowElement,
        row: curRow,
        rowElementRect: {
          x,
          y,
          height,
          width: metrics.width
        },
        availableWidth,
        surroundElementList
      })
      x = surroundPosition.x
      curRowWidth += surroundPosition.rowIncreaseWidth
      x += metrics.width
      // 是否强制换行
      const isForceBreak =
        element.type === ElementType.SEPARATOR ||
        element.type === ElementType.TABLE ||
        preElement?.type === ElementType.TABLE ||
        preElement?.type === ElementType.BLOCK ||
        element.type === ElementType.BLOCK ||
        preElement?.type === ElementType.PAGE_BREAK ||
        preElement?.imgDisplay === ImageDisplay.INLINE ||
        element.imgDisplay === ImageDisplay.INLINE ||
        preElement?.listId !== element.listId ||
        (preElement?.areaId !== element.areaId &&
          !(element.area?.hide && !draw.isAreaHideDisabled())) ||
        (element.control?.flexDirection === FlexDirection.COLUMN &&
          (element.controlComponent === ControlComponent.CHECKBOX ||
            element.controlComponent === ControlComponent.RADIO) &&
          preElement?.controlComponent === ControlComponent.VALUE) ||
        (i !== 0 &&
          element.value === ZERO &&
          !(element.area?.hide && !draw.isAreaHideDisabled()))
      // 是否宽度不足导致换行
      const isWidthNotEnough = curRowWidth > availableWidth
      const isWrap = isForceBreak || isWidthNotEnough
      // 新行数据处理
      if (isWrap) {
        const row: IRow = {
          width: metrics.width,
          height,
          startIndex: i,
          elementList: [rowElement],
          ascent,
          rowIndex: curRow.rowIndex + 1,
          rowFlex: elementList[i]?.rowFlex || elementList[i + 1]?.rowFlex,
          isPageBreak: element.type === ElementType.PAGE_BREAK,
          ...(isColumnEnabled ? { columnIndex: currentColumn } : {})
        }
        if (row.isPageBreak && element.paperDirection) {
          row.paperDirection = element.paperDirection
        }
        // 控件缩进
        let isControlIndentation = false
        if (
          rowElement.controlComponent !== ControlComponent.PREFIX &&
          rowElement.control?.indentation === ControlIndentation.VALUE_START
        ) {
          // 查找到非前缀的第一个元素位置
          const preStartIndex = curRow.elementList.findIndex(
            el =>
              el.controlId === rowElement.controlId &&
              el.controlComponent !== ControlComponent.PREFIX
          )
          if (~preStartIndex) {
            const preRowPositionList = draw.getPosition().computeRowPosition({
              row: curRow,
              innerWidth: currentInnerWidth
            })
            const valueStartPosition = preRowPositionList[preStartIndex]
            if (valueStartPosition) {
              row.offsetX = valueStartPosition.coordinate.leftTop[0]
              isControlIndentation = true
            }
          }
        }
        // 列表缩进（与段落缩进叠加）
        if (element.listId) {
          row.isList = true
          row.offsetX =
            (row.offsetX || 0) +
            (listStyleMap.get(element.listId!) || 0) +
            (element.listLevel
              ? draw.getListParticle().LIST_INDENT_WIDTH *
                element.listLevel *
                scale
              : 0)
          row.listIndex = listIndexMap.get(element.listId!) ?? 0
        }
        // 段落缩进：首行 = 左缩进 + 首行缩进；续行 = 左缩进 + 段首tab悬挂宽度
        const isNewParagraph = element.value === ZERO && !element.listWrap
        if (isNewParagraph) {
          paragraphLeadingTabWidth = 0
          isLeadingTabRunOpen = true
        }
        // 控件缩进为绝对坐标，不与段落缩进叠加
        if (!isControlIndentation) {
          const firstLineElement = getFirstLineIndentElement(elementList, i)
          const indentLeft = isNewParagraph
            ? firstLineElement?.indentLeft
            : element.indentLeft
          const firstLineIndent = isNewParagraph
            ? firstLineElement?.indentFirstLine
            : 0
          const hangingTabWidth = isNewParagraph ? 0 : paragraphLeadingTabWidth
          const indentOffsetX =
            Math.max((indentLeft || 0) + (firstLineIndent || 0), 0) * scale +
            hangingTabWidth
          if (indentOffsetX > 0) {
            row.offsetX = (row.offsetX || 0) + indentOffsetX
          }
        }
        // Y轴偏移量
        row.offsetY =
          !isFromTable &&
          element.area?.top &&
          element.areaId !== elementList[i - 1]?.areaId
            ? element.area.top * scale
            : 0
        // 段前间距：换行符引领的行为新段落首行
        // 换行符归属于新段落元素集合，优先从换行符自身读取
        if (element.value === ZERO && !element.listWrap) {
          row.offsetY +=
            (element.spacingBefore || elementList[i + 1]?.spacingBefore || 0) *
            scale
        }
        rowList.push(row)
      } else {
        // 断点续算：种子行吸收行首元素时补齐行出生属性（列表缩进/序号、区域偏移），
        // 与换行分支诞生新行时的赋值保持一致（文档首行与全量计算一致不补齐）
        if (payload.resume && curRow.elementList.length === 0 && i !== 0) {
          if (element.listId) {
            curRow.isList = true
            curRow.offsetX =
              (listStyleMap.get(element.listId) || 0) +
              (element.listLevel
                ? draw.getListParticle().LIST_INDENT_WIDTH *
                  element.listLevel *
                  scale
                : 0)
            curRow.listIndex = listIndexMap.get(element.listId) ?? 0
          }
          // 段落缩进已在种子行创建时写入offsetX，此处不重复叠加
          curRow.offsetY =
            !isFromTable &&
            element.area?.top &&
            element.areaId !== elementList[i - 1]?.areaId
              ? element.area.top * scale
              : 0
        }
        curRow.width += metrics.width
        // 减小块元素前第一行空行行高
        if (
          i === 0 &&
          (getIsBlockElement(elementList[1]) || !!elementList[1]?.areaId)
        ) {
          curRow.height = defaultBasicRowMarginHeight
          curRow.ascent = defaultBasicRowMarginHeight
        } else if (curRow.height < height) {
          curRow.height = height
          curRow.ascent = ascent
        }
        curRow.elementList.push(rowElement)
      }
      // 行结束时逻辑
      if (isWrap || i === elementList.length - 1) {
        // 段后间距：段落末行增加高度
        // 换行符归属于下一段落元素集合，需从当前段落末尾元素读取
        if (isWrap && element.value === ZERO && !element.listWrap) {
          const spacingAfter = (elementList[i - 1]?.spacingAfter || 0) * scale
          if (spacingAfter) {
            curRow.spacingAfter = spacingAfter
            curRow.height += spacingAfter
          }
        }
        // 行内全部为隐藏元素时 => 行高折叠（仅当行内不止换行符一个元素时）
        if (!draw.isDesignMode() && curRow.height > 0) {
          const visibleElements = curRow.elementList.filter(
            el => el.value !== ZERO
          )
          const isAllHidden =
            visibleElements.length > 0 &&
            visibleElements.every(
              el =>
                el.hide ||
                el.control?.hide ||
                (el.area?.hide && !draw.isAreaHideDisabled()) ||
                draw.getTraceParticle().isTraceHidden(el)
            )
          if (isAllHidden) {
            curRow.height = 0
          }
        }
        // 换行原因：宽度不足
        curRow.isWidthNotEnough = isWidthNotEnough && !isForceBreak
        // 两端对齐、分散对齐
        if (
          !curRow.isSurround &&
          (preElement?.rowFlex === RowFlex.JUSTIFY ||
            (preElement?.rowFlex === RowFlex.ALIGNMENT &&
              curRow.isWidthNotEnough))
        ) {
          // 忽略换行符及尾部元素间隔设置
          const rowElementList =
            curRow.elementList[0]?.value === ZERO
              ? curRow.elementList.slice(1)
              : curRow.elementList
          const gap =
            (availableWidth - curRow.width) / (rowElementList.length - 1)
          for (let e = 0; e < rowElementList.length - 1; e++) {
            const el = rowElementList[e]
            el.metrics.width += gap
          }
          curRow.width = availableWidth
        }
      }
      // 重新计算坐标、页码、下一行首行元素环绕交叉
      if (isWrap) {
        const columnOffset = !layout ? 0 : layout.offsets[currentColumn] || 0
        x = currentStartX + columnOffset
        y += curRow.height
        if (isPagingMode && !isFromTable && currentPageHeight) {
          const isPageBreakElement = element.type === ElementType.PAGE_BREAK
          const nextDirection = element.paperDirection || options.paperDirection
          if (isPageBreakElement && nextDirection !== currentDirection) {
            // 分页符切换后续节方向，未指定时回到全局方向
            currentDirection = nextDirection
            currentMargins = draw.getMargins(currentDirection)
            currentInnerWidth =
              draw.getWidth(currentDirection) -
              currentMargins[1] -
              currentMargins[3]
            currentStartX = currentMargins[3]
            currentPageHeight = draw.getHeight(currentDirection)
            // 分栏布局随节方向切换
            layout = draw.getColumnLayout(currentDirection)
            isColumnEnabled = !!layout && layout.count > 1
          }
          const curMainOuterHeight = draw.getMainOuterHeight(
            pageNo,
            currentDirection
          )
          const isOverflow =
            y - pageStartY + curMainOuterHeight + height > currentPageHeight
          if (isOverflow || isPageBreakElement) {
            if (
              !isPageBreakElement &&
              isColumnEnabled &&
              layout &&
              currentColumn < layout.count - 1
            ) {
              currentColumn += 1
              y = pageStartY
              x = currentStartX + (layout.offsets[currentColumn] || 0)
            } else {
              // 删除多余四周环绕型元素
              deleteSurroundElementList(surroundElementList, pageNo)
              pageNo += 1
              currentColumn = 0
              pageStartY =
                currentMargins[0] + draw.getHeader().getExtraHeight(pageNo)
              y = pageStartY
              x = currentStartX + (layout ? layout.offsets[0] || 0 : 0)
            }
          }
        }
        // 同步新行的栏索引（栏游标可能在翻栏/翻页逻辑中变化）
        const nextRow = rowList[rowList.length - 1]
        if (nextRow && isColumnEnabled && nextRow.columnIndex !== undefined) {
          nextRow.columnIndex = currentColumn
        }
        // 计算下一行第一个元素是否存在环绕交叉
        rowElement.left = 0
        const surroundPosition = draw.getPosition().setSurroundPosition({
          pageNo,
          rowElement,
          row: nextRow,
          rowElementRect: {
            x,
            y,
            height,
            width: metrics.width
          },
          availableWidth,
          surroundElementList
        })
        x = surroundPosition.x
        x += metrics.width
        // 行快照：每个新行的起始状态都是增量续算的恢复点。
        // 快照描述行首元素参与计算前的状态（x 不含行首元素宽度）
        if (isRecordRowSnapshot && nextRow) {
          const snapshot = buildRowComputeState(
            nextRow.rowIndex,
            surroundPosition.x,
            preControlRealWidth
          )
          draw
            .getIncrementalRowComputer()
            .recordSnapshot(nextRow, snapshot, rowElement)
          // 断点续算：新行与旧行结构状态收敛即提前结束，其后旧行原样复用
          if (payload.resume?.converge?.(snapshot, rowElement, i)) break
        }
      }
    }
    // 区域最小高度：内容高度不足时向区域末行补充高度（内容超出时由行高自然撑开）
    draw.getArea().applyMinHeight(rowList)
    return rowList
  }

  public computePageList(
    payload: IComputePageListPayload
  ): IComputePageListResult {
    const { rowList, pageMode, paperDirection, maxPageNo } = payload
    let elementList = payload.elementList
    let isElementListTruncated = false
    const pageRowList: IRow[][] = [[]]
    const pageDirectionList = [paperDirection]
    let pageNo = 0
    if (pageMode === PageMode.CONTINUITY) {
      pageRowList[0] = rowList
      return {
        pageRowList,
        pageDirectionList,
        elementList,
        isElementListTruncated
      }
    }
    let direction = paperDirection
    let pageLimit = this.draw.getHeight(direction)
    let pageHeight = this.draw.getMainOuterHeight(0, direction)
    let prevColumnIndex: number | undefined = undefined
    for (let i = 0; i < rowList.length; i++) {
      const row = rowList[i]
      const rowOffsetY = row.offsetY || 0
      const columnChanged =
        prevColumnIndex !== undefined &&
        row.columnIndex !== undefined &&
        row.columnIndex > 0 &&
        row.columnIndex !== prevColumnIndex
      if (columnChanged) {
        pageHeight =
          this.draw.getMainOuterHeight(pageNo, direction) +
          row.height +
          rowOffsetY
        pageRowList[pageNo].push(row)
      } else if (
        row.height + rowOffsetY + pageHeight > pageLimit ||
        rowList[i - 1]?.isPageBreak
      ) {
        const areaPadding = row.areaPadding
        if (areaPadding && !rowList[i - 1]?.isPageBreak) {
          const contentHeight = row.height - areaPadding.height
          const remainHeight = pageLimit - pageHeight - rowOffsetY
          if (contentHeight <= remainHeight) {
            const carryHeight = row.height - remainHeight
            const nextRow = rowList[i + 1]
            if (carryHeight > 0) {
              if (nextRow) {
                nextRow.offsetY = (nextRow.offsetY || 0) + carryHeight
                nextRow.areaPaddingCarry = {
                  areaId: areaPadding.areaId,
                  height: carryHeight
                }
              } else if (!Number.isInteger(maxPageNo) || pageNo < maxPageNo!) {
                row.areaPaddingCarry = {
                  areaId: areaPadding.areaId,
                  height: carryHeight
                }
                pageDirectionList[pageNo + 1] = direction
                pageRowList.push([])
              }
            }
            const inPagePadding = remainHeight - contentHeight
            row.height = remainHeight
            row.areaPadding = inPagePadding
              ? { areaId: areaPadding.areaId, height: inPagePadding }
              : undefined
            pageHeight = pageLimit
            pageRowList[pageNo].push(row)
            prevColumnIndex = row.columnIndex
            continue
          }
        }
        if (Number.isInteger(maxPageNo) && pageNo >= maxPageNo!) {
          const fragment = row.tableFragment
          const tableElement = elementList[row.startIndex]
          if (
            fragment &&
            tableElement?.type === ElementType.TABLE &&
            this.draw
              .getTablePaging()
              .truncateTableByFragment(tableElement, fragment, elementList)
          ) {
            elementList = elementList.slice(0, row.startIndex + 1)
          } else {
            elementList = elementList.slice(0, row.startIndex)
          }
          isElementListTruncated = true
          break
        }
        pageNo++
        const prevRow = rowList[i - 1]
        if (prevRow?.isPageBreak) {
          direction = prevRow.paperDirection || paperDirection
          pageLimit = this.draw.getHeight(direction)
        }
        pageDirectionList[pageNo] = direction
        pageHeight =
          this.draw.getMainOuterHeight(pageNo, direction) +
          row.height +
          rowOffsetY
        pageRowList.push([row])
      } else {
        pageHeight += row.height + rowOffsetY
        pageRowList[pageNo].push(row)
      }
      prevColumnIndex = row.columnIndex
    }
    return {
      pageRowList,
      pageDirectionList,
      elementList,
      isElementListTruncated
    }
  }
}
