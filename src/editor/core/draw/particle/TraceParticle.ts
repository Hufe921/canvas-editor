import { EDITOR_PREFIX } from '../../../dataset/constant/Editor'
import { EditorMode } from '../../../dataset/enum/Editor'
import { ElementType } from '../../../dataset/enum/Element'
import { TraceType } from '../../../dataset/enum/Trace'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import {
  IElement,
  IElementMetrics,
  IElementPosition
} from '../../../interface/Element'
import { IRow, IRowElement } from '../../../interface/Row'
import { IMarkElementListDeletedOption } from '../../../interface/Trace'
import { visitElementTree } from '../../../utils/element'
import { Draw } from '../Draw'

interface ITraceRenderContext {
  ctx: CanvasRenderingContext2D
  element: IRowElement
  x: number
  y: number
  curRow: IRow
  metrics: IElementMetrics
  offsetY: number
  scale: number
}

export class TraceParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private container: HTMLDivElement
  private tracePopupContainer: HTMLDivElement
  private listDom: HTMLDivElement
  private lastHoverKey: string
  // 留痕线条累积器：同色 run 内合并为一次 stroke
  private strikeoutState: { x: number; y: number; width: number } | null = null
  private underlineState: { x: number; y: number; width: number } | null = null
  private currentRow: IRow | null = null

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    this.lastHoverKey = ''
    // 初始化时创建 hover 浮窗 DOM
    const { popup, listDom } = this._createTracePopupDom()
    this.tracePopupContainer = popup
    this.listDom = listDom
  }

  // 创建留痕 hover 浮窗容器
  private _createTracePopupDom() {
    const popup = document.createElement('div')
    popup.classList.add(`${EDITOR_PREFIX}-trace-popup`)
    const listDom = document.createElement('div')
    listDom.classList.add(`${EDITOR_PREFIX}-trace-popup__list`)
    popup.append(listDom)
    this.container.append(popup)
    return { popup, listDom }
  }

  // 绘制痕迹 hover 浮窗（按时间顺序展示 insert/delete 记录）
  public drawTracePopup(
    element: IElement,
    position: IElementPosition | undefined,
    pageNo: number
  ) {
    const records = element.trace
    if (!records?.length || !position) {
      this.clearTracePopup()
      return
    }
    const {
      coordinate: {
        leftTop: [left, top]
      },
      lineHeight
    } = position
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = pageNo * (height + pageGap)
    // 位置
    this.tracePopupContainer.style.display = 'block'
    this.tracePopupContainer.style.left = `${left}px`
    this.tracePopupContainer.style.top = `${top + preY + lineHeight}px`
    // 时间线：按时间顺序自上而下逐条渲染（先插入后删除会显示两条）
    const {
      insertColor,
      deleteColor,
      author: defaultAuthor
    } = this.options.trace
    const i18n = this.draw.getI18n()
    const authorLabel = i18n.t('trace.author')
    const timeLabel = i18n.t('trace.time')
    const unknownAuthor = i18n.t('trace.unknownAuthor')
    this.listDom.innerHTML = ''
    const fragment = document.createDocumentFragment()
    for (const record of records) {
      const isInsert = record.type === TraceType.INSERTED
      const item = document.createElement('div')
      item.classList.add(`${EDITOR_PREFIX}-trace-popup__item`)
      // 类型徽标（按类型着色）
      const typeSpan = document.createElement('span')
      typeSpan.classList.add(`${EDITOR_PREFIX}-trace-popup__type`)
      typeSpan.innerText = i18n.t(isInsert ? 'trace.insert' : 'trace.delete')
      typeSpan.style.color = isInsert ? insertColor : deleteColor
      item.append(typeSpan)
      // 作者
      const author = record.author || defaultAuthor || unknownAuthor
      const authorSpan = document.createElement('span')
      authorSpan.classList.add(`${EDITOR_PREFIX}-trace-popup__author`)
      authorSpan.innerText = `${authorLabel}: ${author}`
      item.append(authorSpan)
      // 时间
      if (record.timestamp) {
        const timeSpan = document.createElement('span')
        timeSpan.classList.add(`${EDITOR_PREFIX}-trace-popup__time`)
        timeSpan.innerText = `${timeLabel}: ${new Date(
          record.timestamp
        ).toLocaleString()}`
        item.append(timeSpan)
      }
      fragment.append(item)
    }
    this.listDom.append(fragment)
  }

  // 隐藏痕迹 hover 浮窗并重置 hover 索引
  public clearTracePopup() {
    this.tracePopupContainer.style.display = 'none'
    this.lastHoverKey = ''
  }

  // 留痕模式下根据鼠标位置显示/隐藏痕迹浮窗
  public handleMouseMove(evt: MouseEvent) {
    if (!this.draw.isTraceMode()) return
    const target = evt.target as HTMLDivElement
    const pageIndex = target.dataset.index
    if (pageIndex) {
      this.draw.setPageNo(Number(pageIndex))
    }
    const position = this.draw.getPosition()
    const positionResult = position.getPositionByXY({
      x: evt.offsetX,
      y: evt.offsetY
    })
    if (!~positionResult.index) {
      this.clearTracePopup()
      return
    }
    const elementList = this.draw.getOriginalElementList()
    let element: IElement | undefined = elementList[positionResult.index]
    let elementPosition: IElementPosition | undefined =
      position.getOriginalPositionList()[positionResult.index]
    let hoverKey = String(positionResult.index)
    if (positionResult.isTable && positionResult.tdValueIndex !== undefined) {
      const td = position.getTableTdByContext(elementList, {
        ...positionResult,
        isTable: true
      })
      element = td?.value[positionResult.tdValueIndex]
      elementPosition = td?.positionList?.[positionResult.tdValueIndex]
      hoverKey = `${positionResult.tablePath
        ?.map(item => `${item.index}:${item.trIndex}:${item.tdIndex}`)
        .join('/')}:${positionResult.tdValueIndex}`
    }
    if (!element?.trace?.length) {
      this.clearTracePopup()
      return
    }
    if (this.lastHoverKey === hoverKey) return
    this.drawTracePopup(element, elementPosition, this.draw.getPageNo())
    this.lastHoverKey = hoverKey
  }

  // 获取元素留痕类型标记
  private _getTraceFlags(element?: IRowElement | null) {
    const records = element?.trace || []
    return {
      hasInsert: records.some(r => r.type === TraceType.INSERTED),
      hasDelete: records.some(r => r.type === TraceType.DELETED)
    }
  }

  // TRACE 模式下绘制元素留痕装饰（DELETED 红色中划线 / INSERTED 蓝色下划线）
  // 同 run 内累积为一次 stroke，跨类型/跨行时 flush，避免逐元素 stroke 在端点产生抗锯齿断裂
  public render(context: ITraceRenderContext) {
    if (!this.draw.isTraceMode()) return
    const { ctx, element, x, y, curRow, metrics, offsetY, scale } = context
    // 跨行：冲刷累积，避免线条跨越行间距
    if (this.currentRow !== curRow) {
      this._flushStrikeout(ctx, scale)
      this._flushUnderline(ctx, scale)
      this.currentRow = curRow
    }
    const { hasInsert, hasDelete } = this._getTraceFlags(element)
    // 删除痕迹：累积中划线段
    if (hasDelete) {
      const standardMetrics = this.draw
        .getTextParticle()
        .measureBasisWord(ctx, this.draw.getElementFont(element))
      let traceAdjustY =
        y +
        offsetY +
        standardMetrics.actualBoundingBoxDescent * scale -
        metrics.height / 2
      if (element.type === ElementType.SUBSCRIPT) {
        traceAdjustY += this.draw.getSubscriptParticle().getOffsetY(element)
      } else if (element.type === ElementType.SUPERSCRIPT) {
        traceAdjustY += this.draw.getSuperscriptParticle().getOffsetY(element)
      }
      if (!this.strikeoutState) {
        this.strikeoutState = {
          x,
          y: traceAdjustY + 0.5,
          width: metrics.width
        }
      } else {
        this.strikeoutState.width += metrics.width
      }
    } else if (this.strikeoutState) {
      this._flushStrikeout(ctx, scale)
    }
    // 新增痕迹：累积下划线段
    if (hasInsert) {
      const traceRowMargin = this.draw.getElementRowMargin(element)
      const traceOffsetX = element.left || 0
      let traceUY = 0
      if (element.type === ElementType.SUBSCRIPT) {
        traceUY = this.draw.getSubscriptParticle().getOffsetY(element)
      }
      const startX = x - traceOffsetX
      // 与标准下划线一致：curRow.height - rowMargin 为文本内容底部，再加 2 * scale 腾出与文字的间距
      const startY =
        Math.floor(y + curRow.height - traceRowMargin + traceUY + 2 * scale) +
        0.5
      if (!this.underlineState) {
        this.underlineState = {
          x: startX,
          y: startY,
          width: metrics.width + traceOffsetX
        }
      } else {
        this.underlineState.width += metrics.width + traceOffsetX
      }
    } else if (this.underlineState) {
      this._flushUnderline(ctx, scale)
    }
  }

  // 主动冲刷所有累积（页面渲染结束、表格嵌套切换等场景调用）
  public flush(ctx: CanvasRenderingContext2D) {
    const scale = this.options.scale
    this._flushStrikeout(ctx, scale)
    this._flushUnderline(ctx, scale)
    this.currentRow = null
  }

  private _flushStrikeout(ctx: CanvasRenderingContext2D, scale: number) {
    if (!this.strikeoutState) return
    ctx.save()
    ctx.lineWidth = this.options.trace.lineWidth * scale
    ctx.strokeStyle = this.options.trace.deleteColor
    ctx.lineCap = 'butt'
    ctx.beginPath()
    ctx.moveTo(this.strikeoutState.x, this.strikeoutState.y)
    ctx.lineTo(
      this.strikeoutState.x + this.strikeoutState.width,
      this.strikeoutState.y
    )
    ctx.stroke()
    ctx.restore()
    this.strikeoutState = null
  }

  private _flushUnderline(ctx: CanvasRenderingContext2D, scale: number) {
    if (!this.underlineState) return
    ctx.save()
    ctx.lineWidth = this.options.trace.lineWidth * scale
    ctx.strokeStyle = this.options.trace.insertColor
    ctx.lineCap = 'butt'
    ctx.beginPath()
    ctx.moveTo(this.underlineState.x, this.underlineState.y)
    ctx.lineTo(
      this.underlineState.x + this.underlineState.width,
      this.underlineState.y
    )
    ctx.stroke()
    ctx.restore()
    this.underlineState = null
  }

  // 留痕软删除元素在非留痕查看模式下应隐藏（视觉等同于 hide=true）
  public isTraceHidden(element: IElement) {
    const records = element.trace
    return (
      records?.[records.length - 1]?.type === TraceType.DELETED &&
      !this.draw.isTraceMode()
    )
  }

  // 给元素列表打标；开启留痕时追加指定类型记录
  private _markElementList(elementList: IElement[], type: TraceType) {
    if (this.options.trace.disabled) return
    const author = this.options.trace.author
    const timestamp = Date.now()
    visitElementTree(elementList, el => {
      const records = el.trace || []
      if (records[records.length - 1]?.type === type) return
      el.trace = [...records, { type, author, timestamp }]
    })
  }

  // 给新增元素打标
  public markElementListInserted(elementList: IElement[]) {
    this._markElementList(elementList, TraceType.INSERTED)
  }

  // 给删除元素打标
  public markElementListDeleted(
    elementList: IElement[],
    options?: IMarkElementListDeletedOption
  ) {
    let deleteElementList = elementList
    if (
      !options?.isIgnoreDeletedRule &&
      !this.draw.isDesignMode() &&
      !this.draw.getControl().getIsRangeWithinControl()
    ) {
      const mode = this.draw.getMode()
      const tdDeletable = options?.tdDeletable ?? this.draw.getTd()?.deletable
      const { group, modeRule } = this.options
      deleteElementList = elementList.filter(
        element =>
          element.hide ||
          element.control?.hide ||
          element.area?.hide ||
          (tdDeletable !== false &&
            element.control?.deletable !== false &&
            (!element.controlId ||
              mode !== EditorMode.FORM ||
              !modeRule[mode].controlDeletableDisabled) &&
            element.title?.deletable !== false &&
            (group.deletable !== false || !element.groupIds?.length) &&
            (element.area?.deletable !== false || element.areaIndex !== 0))
      )
    }
    this._markElementList(deleteElementList, TraceType.DELETED)
    return deleteElementList
  }
}
