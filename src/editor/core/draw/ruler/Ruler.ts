import { EDITOR_PREFIX } from '../../../dataset/constant/Editor'
import { ZERO } from '../../../dataset/constant/Common'
import {
  EditorMode,
  PageMode,
  PaperDirection
} from '../../../dataset/enum/Editor'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IMargin } from '../../../interface/Margin'
import type { IElement } from '../../../interface/Element'
import { IRenderContext } from '../../render/model/RenderContext'
import { Draw } from '../Draw'

// 拖拽边距的方向
enum RulerMarginSide {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom'
}

// 缩进标记拖拽目标（作用于光标/选区所在段落）
enum RulerIndentTarget {
  FIRST_LINE = 'firstLine',
  LEFT = 'left',
  RIGHT = 'right'
}

export class Ruler {
  // 1毫米对应的像素值（基于96dpi）
  private readonly MM_PX = 96 / 25.4
  // 边距手柄的命中容差（像素）
  private readonly HANDLE_HIT_TOLERANCE = 7
  // 拖动边距时正文区域保留的最小尺寸（像素）
  private readonly MIN_INNER_SIZE = 100
  // 拖动缩进时正文区域保留的最小尺寸（原始像素）
  private readonly MIN_INNER_SIZE_INDENT = 100

  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private container: HTMLDivElement
  private rulerContainer: HTMLDivElement | null
  private canvasX: HTMLCanvasElement | null
  private ctxX: CanvasRenderingContext2D | null
  private canvasY: HTMLCanvasElement | null
  private ctxY: CanvasRenderingContext2D | null
  private dragSide: RulerMarginSide | null
  private dragStartPosition: number
  private dragOriginMargins: IMargin | null
  private dragIndentTarget: RulerIndentTarget | null
  private dragOriginIndents: {
    left: number
    firstLine: number
    right: number
  } | null
  private isIndentApplied: boolean
  private guideline: HTMLDivElement | null
  // 缩进标记位置缓存（随标尺重绘刷新，命中检测直接消费，避免悬浮时反复解析段落）
  private indentMarkerPositionCache: {
    firstLineX: number
    leftX: number
    rightX: number
  } | null
  private mousemoveHandler: (evt: MouseEvent) => void
  private mouseupHandler: () => void

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    this.rulerContainer = null
    this.canvasX = null
    this.ctxX = null
    this.canvasY = null
    this.ctxY = null
    this.dragSide = null
    this.dragStartPosition = 0
    this.dragOriginMargins = null
    this.dragIndentTarget = null
    this.dragOriginIndents = null
    this.isIndentApplied = false
    this.guideline = null
    this.indentMarkerPositionCache = null
    this.mousemoveHandler = this._dragMargin.bind(this)
    this.mouseupHandler = this._stopDrag.bind(this)
  }

  public isEnable(): boolean {
    return !this.options.ruler.disabled
  }

  private _createDOM() {
    // 垂直标尺画布（先创建，水平标尺画布覆盖于左上角交汇区之上）
    const canvasY = document.createElement('canvas')
    canvasY.classList.add(`${EDITOR_PREFIX}-ruler-y`)
    // 水平标尺画布
    const canvasX = document.createElement('canvas')
    canvasX.classList.add(`${EDITOR_PREFIX}-ruler-x`)
    const rulerContainer = document.createElement('div')
    rulerContainer.classList.add(`${EDITOR_PREFIX}-ruler`)
    rulerContainer.append(canvasY, canvasX)
    // 阻止事件冒泡至编辑器容器，避免影响选区等交互
    rulerContainer.addEventListener('mousedown', evt => {
      evt.preventDefault()
      evt.stopPropagation()
      if (evt.target === canvasY) {
        this._mousedownY(evt)
      } else {
        this._mousedownX(evt)
      }
    })
    // 注意：此处不可阻止冒泡，拖动边距依赖document上的mousemove事件
    rulerContainer.addEventListener('mousemove', evt => {
      if (evt.target === canvasY) {
        this._updateCursorY(evt)
      } else {
        this._updateCursorX(evt)
      }
    })
    rulerContainer.addEventListener('mouseleave', () => this._resetCursor())
    this.container.insertBefore(rulerContainer, this.draw.getPageContainer())
    this.rulerContainer = rulerContainer
    this.canvasX = canvasX
    this.ctxX = canvasX.getContext('2d')
    this.canvasY = canvasY
    this.ctxY = canvasY.getContext('2d')
  }

  public setEnabled(enabled: boolean) {
    this.options.ruler.disabled = !enabled
    this.render()
  }

  public dispose() {
    this._stopDrag()
    this._removeGuideline()
    this.indentMarkerPositionCache = null
    this.rulerContainer?.remove()
    this.rulerContainer = null
    this.canvasX = null
    this.ctxX = null
    this.canvasY = null
    this.ctxY = null
  }

  public render() {
    if (!this.isEnable()) {
      if (this.rulerContainer) {
        this.rulerContainer.style.display = 'none'
      }
      return
    }
    if (!this.rulerContainer) {
      this._createDOM()
    }
    const rulerContainer = this.rulerContainer!
    // 连页模式下无页面边距概念，隐藏标尺
    if (this.options.pageMode !== PageMode.PAGING) {
      rulerContainer.style.display = 'none'
      return
    }
    rulerContainer.style.display = 'block'
    this._renderX()
    this._renderY()
  }

  private _renderX() {
    const canvasX = this.canvasX!
    const ctx = this.ctxX!
    const { height } = this.options.ruler
    const width = this.draw.getWidth()
    const dpr = this.draw.getPagePixelRatio()
    canvasX.style.width = `${width}px`
    canvasX.style.height = `${height}px`
    canvasX.width = width * dpr
    canvasX.height = height * dpr
    ctx.scale(dpr, dpr)
    // 背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    // 页边距阴影区域
    const margins = this.draw.getMargins()
    const scale = this.options.scale
    ctx.fillStyle = '#f2f2f2'
    ctx.fillRect(0, 0, margins[3], height)
    ctx.fillRect(width - margins[1], 0, margins[1], height)
    // 刻度（以毫米为单位，数字按厘米显示）
    ctx.strokeStyle = '#999999'
    ctx.fillStyle = '#666666'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.beginPath()
    const mmPx = this.MM_PX * scale
    const tickCount = Math.floor(width / mmPx)
    for (let i = 0; i <= tickCount; i++) {
      const x = Math.round(i * mmPx) + 0.5
      const isCm = i % 10 === 0
      const tickHeight = isCm ? 8 : i % 5 === 0 ? 5 : 3
      ctx.moveTo(x, height)
      ctx.lineTo(x, height - tickHeight)
      // 边缘处的刻度数字会被裁切，仅绘制完整可容纳的（数字行居标尺中部，
      // 上部留给首行缩进盾形标记、下部留给左/右缩进屋形标记）
      if (isCm && i > 0 && x >= 8 && x <= width - 8) {
        ctx.fillText(String(i / 10), x, 17)
      }
    }
    ctx.stroke()
    // 底部边框线
    ctx.beginPath()
    ctx.strokeStyle = '#e0e0e0'
    ctx.moveTo(0, height - 0.5)
    ctx.lineTo(width, height - 0.5)
    ctx.stroke()
    // 缩进标记（作用于光标/选区所在段落，无光标时退回第一段保持可见）
    const indents = this._getParagraphIndents()
    if (indents) {
      const positions = this._getIndentMarkerPositions(indents)
      this.indentMarkerPositionCache = positions
      this._drawIndentMarker(
        ctx,
        positions.firstLineX,
        RulerIndentTarget.FIRST_LINE
      )
      this._drawIndentMarker(ctx, positions.leftX, RulerIndentTarget.LEFT)
      this._drawIndentMarker(ctx, positions.rightX, RulerIndentTarget.RIGHT)
    } else {
      this.indentMarkerPositionCache = null
    }
  }

  private _renderY() {
    const canvasY = this.canvasY!
    const ctx = this.ctxY!
    // 垂直标尺宽度与水平标尺高度一致
    const rulerSize = this.options.ruler.height
    // 仅对齐第一页
    const pageHeight = this.draw.getHeight()
    const dpr = this.draw.getPagePixelRatio()
    canvasY.style.width = `${rulerSize}px`
    canvasY.style.height = `${pageHeight}px`
    canvasY.width = rulerSize * dpr
    canvasY.height = pageHeight * dpr
    ctx.scale(dpr, dpr)
    // 背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rulerSize, pageHeight)
    // 上下页边距阴影区域
    const margins = this.draw.getMargins()
    const scale = this.options.scale
    ctx.fillStyle = '#f2f2f2'
    ctx.fillRect(0, 0, rulerSize, margins[0])
    ctx.fillRect(0, pageHeight - margins[2], rulerSize, margins[2])
    // 刻度（以毫米为单位，数字按厘米显示）
    ctx.strokeStyle = '#999999'
    ctx.fillStyle = '#666666'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.beginPath()
    const mmPx = this.MM_PX * scale
    const tickCount = Math.floor(pageHeight / mmPx)
    for (let i = 0; i <= tickCount; i++) {
      const y = Math.round(i * mmPx) + 0.5
      const isCm = i % 10 === 0
      const tickWidth = isCm ? 8 : i % 5 === 0 ? 5 : 3
      ctx.moveTo(rulerSize, y)
      ctx.lineTo(rulerSize - tickWidth, y)
      // 边缘处的刻度数字会被裁切，仅绘制完整可容纳的
      if (isCm && i > 0 && y >= 8 && y <= pageHeight - 8) {
        ctx.save()
        ctx.translate(16, y)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(String(i / 10), 0, 0)
        ctx.restore()
      }
    }
    ctx.stroke()
    // 右侧边框线
    ctx.beginPath()
    ctx.strokeStyle = '#e0e0e0'
    ctx.moveTo(rulerSize - 0.5, 0)
    ctx.lineTo(rulerSize - 0.5, pageHeight)
    ctx.stroke()
  }

  // 光标/选区所在段落元素列表（无选区时返回null，缩进标记随之隐藏）
  private _getParagraphElementList(): IElement[] | null {
    const { startIndex, endIndex } = this.draw.getRange().getRange()
    if (!~startIndex && !~endIndex) return null
    return this.draw.getRange().getRangeParagraphElementList()
  }

  // 段落缩进值（换行符可能携带上一段落属性，取段内第一个内容元素读值；
  // 无选区时退回第一段，保持标尺标记可见）
  private _getParagraphIndents(): {
    paragraphElementList: IElement[]
    left: number
    firstLine: number
    right: number
  } | null {
    const paragraphElementList =
      this._getParagraphElementList() ?? this._getFirstParagraphElementList()
    const anchor = this._getIndentAnchor(paragraphElementList)
    if (!anchor) return null
    return {
      paragraphElementList,
      left: anchor.indentLeft || 0,
      firstLine: anchor.indentFirstLine || 0,
      right: anchor.indentRight || 0
    }
  }

  // 文档第一段元素列表（标尺无选区时的显示兜底）
  private _getFirstParagraphElementList(): IElement[] {
    const elementList = this.draw.getElementList()
    const result: IElement[] = []
    for (const element of elementList) {
      result.push(element)
      if (result.length > 1 && element.value === ZERO && !element.listWrap) {
        break
      }
    }
    return result
  }

  private _getIndentAnchor(
    paragraphElementList: IElement[]
  ): IElement | undefined {
    return (
      paragraphElementList.find(el => el.value !== ZERO) ??
      paragraphElementList[0]
    )
  }

  // 缩进标记在标尺上的显示位置（显示像素）
  private _getIndentMarkerPositions(indents: {
    left: number
    firstLine: number
    right: number
  }) {
    const margins = this.draw.getMargins()
    const scale = this.options.scale
    return {
      firstLineX: margins[3] + (indents.left + indents.firstLine) * scale,
      leftX: margins[3] + indents.left * scale,
      rightX: this.draw.getWidth() - margins[1] - indents.right * scale
    }
  }

  // 缩进标记：白底灰边轮廓形（对齐 WPS）——首行缩进为标尺上部的盾形（平顶下尖），
  // 左/右缩进为标尺下缘的屋形（三角顶+矩形身），中部数字行留白
  private _drawIndentMarker(
    ctx: IRenderContext,
    x: number,
    target: RulerIndentTarget
  ) {
    ctx.beginPath()
    if (target === RulerIndentTarget.FIRST_LINE) {
      ctx.moveTo(x - 5, 2)
      ctx.lineTo(x + 5, 2)
      ctx.lineTo(x + 5, 5)
      ctx.lineTo(x, 10.5)
      ctx.lineTo(x - 5, 5)
    } else {
      ctx.moveTo(x, 17)
      ctx.lineTo(x + 5, 21)
      ctx.lineTo(x + 5, 25.5)
      ctx.lineTo(x - 5, 25.5)
      ctx.lineTo(x - 5, 21)
    }
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#7a7a7a'
    ctx.stroke()
  }

  // 缩进标记命中检测（上部盾形为首行缩进，下部屋形为左/右缩进，
  // 中部数字行留给边距拖拽；位置取自标尺重绘时的缓存）
  private _getHitIndentTarget(x: number, y: number): RulerIndentTarget | null {
    const positions = this.indentMarkerPositionCache
    if (!positions) return null
    if (
      y < 11.5 &&
      Math.abs(x - positions.firstLineX) <= this.HANDLE_HIT_TOLERANCE
    ) {
      return RulerIndentTarget.FIRST_LINE
    }
    if (y >= 16) {
      if (Math.abs(x - positions.leftX) <= this.HANDLE_HIT_TOLERANCE) {
        return RulerIndentTarget.LEFT
      }
      if (Math.abs(x - positions.rightX) <= this.HANDLE_HIT_TOLERANCE) {
        return RulerIndentTarget.RIGHT
      }
    }
    return null
  }

  // 拖动缩进时在页面上显示落点虚线引导线
  private _showGuideline(x: number) {
    if (!this.guideline) {
      const guideline = document.createElement('div')
      guideline.classList.add(`${EDITOR_PREFIX}-ruler-guideline`)
      this.draw.getPageContainer().append(guideline)
      this.guideline = guideline
    }
    this.guideline.style.left = `${x}px`
  }

  private _removeGuideline() {
    this.guideline?.remove()
    this.guideline = null
  }

  private _getHitMarginSideX(x: number): RulerMarginSide | null {
    const width = this.draw.getWidth()
    const margins = this.draw.getMargins()
    if (Math.abs(x - margins[3]) <= this.HANDLE_HIT_TOLERANCE) {
      return RulerMarginSide.LEFT
    }
    if (Math.abs(x - (width - margins[1])) <= this.HANDLE_HIT_TOLERANCE) {
      return RulerMarginSide.RIGHT
    }
    return null
  }

  private _getHitMarginSideY(y: number): RulerMarginSide | null {
    const pageHeight = this.draw.getHeight()
    const margins = this.draw.getMargins()
    if (Math.abs(y - margins[0]) <= this.HANDLE_HIT_TOLERANCE) {
      return RulerMarginSide.TOP
    }
    if (Math.abs(y - (pageHeight - margins[2])) <= this.HANDLE_HIT_TOLERANCE) {
      return RulerMarginSide.BOTTOM
    }
    return null
  }

  // 以标尺容器为基准计算相对横坐标（offsetX依赖事件目标，各浏览器表现不一致）
  private _getRelativeX(evt: MouseEvent): number {
    if (!this.rulerContainer) return 0
    const rect = this.rulerContainer.getBoundingClientRect()
    return evt.clientX - rect.left
  }

  private _getRelativeY(evt: MouseEvent): number {
    if (!this.canvasY) return 0
    const rect = this.canvasY.getBoundingClientRect()
    return evt.clientY - rect.top
  }

  // 水平标尺上的相对纵坐标（区分上层首行缩进与中层左/右缩进标记）
  private _getRelativeYOnCanvasX(evt: MouseEvent): number {
    if (!this.canvasX) return 0
    const rect = this.canvasX.getBoundingClientRect()
    return evt.clientY - rect.top
  }

  // 只读、打印、表单模式下不允许拖动边距与缩进
  private _isMarginDragDisabled(): boolean {
    const mode = this.draw.getMode()
    return (
      this.draw.isReadonly() ||
      mode === EditorMode.PRINT ||
      mode === EditorMode.FORM
    )
  }

  private _startDrag(side: RulerMarginSide, position: number) {
    // 记录拖拽起点与起始边距，后续按位移增量计算
    this.dragSide = side
    this.dragStartPosition = position
    this.dragOriginMargins = [...this.draw.getOriginalMargins()] as IMargin
    // 清除选区与光标，避免拖动过程中编辑器交互干扰
    this.draw.getRange().clearRange()
    this.draw.getCursor().drawCursor({ isShow: false })
    document.addEventListener('mousemove', this.mousemoveHandler)
    document.addEventListener('mouseup', this.mouseupHandler)
  }

  private _startIndentDrag(target: RulerIndentTarget, clientX: number) {
    // 拖动作用于光标/选区所在段落，无选区时不响应
    const paragraphElementList = this._getParagraphElementList()
    if (!paragraphElementList) return
    const anchor = this._getIndentAnchor(paragraphElementList)
    if (!anchor) return
    this.dragIndentTarget = target
    this.dragStartPosition = clientX
    this.dragOriginIndents = {
      left: anchor.indentLeft || 0,
      firstLine: anchor.indentFirstLine || 0,
      right: anchor.indentRight || 0
    }
    this.isIndentApplied = false
    // 与边距拖拽不同：作用段落由光标/选区决定，不清除选区
    document.addEventListener('mousemove', this.mousemoveHandler)
    document.addEventListener('mouseup', this.mouseupHandler)
  }

  private _mousedownX(evt: MouseEvent) {
    if (this._isMarginDragDisabled()) return
    const x = this._getRelativeX(evt)
    const y = this._getRelativeYOnCanvasX(evt)
    // 缩进标记优先命中，其余落在边距交界线命中区的交给边距拖拽
    const indentTarget = this._getHitIndentTarget(x, y)
    if (indentTarget) {
      this._startIndentDrag(indentTarget, evt.clientX)
      return
    }
    const side = this._getHitMarginSideX(x)
    if (!side) return
    this._startDrag(side, evt.clientX)
  }

  private _mousedownY(evt: MouseEvent) {
    if (this._isMarginDragDisabled()) return
    const side = this._getHitMarginSideY(this._getRelativeY(evt))
    if (!side) return
    this._startDrag(side, evt.clientY)
  }

  // 悬浮光标提示：缩进标记为pointer，边距交界处为col-resize
  private _updateCursorX(evt: MouseEvent) {
    if (!this.canvasX) return
    const x = this._getRelativeX(evt)
    const y = this._getRelativeYOnCanvasX(evt)
    const indentTarget = this._getHitIndentTarget(x, y)
    const marginSide = indentTarget ? null : this._getHitMarginSideX(x)
    this.canvasX.style.cursor = indentTarget
      ? 'pointer'
      : marginSide
        ? 'col-resize'
        : 'default'
  }

  private _updateCursorY(evt: MouseEvent) {
    if (!this.canvasY) return
    const side = this._getHitMarginSideY(this._getRelativeY(evt))
    this.canvasY.style.cursor = side ? 'row-resize' : 'default'
  }

  private _resetCursor() {
    if (this.canvasX) this.canvasX.style.cursor = 'default'
    if (this.canvasY) this.canvasY.style.cursor = 'default'
  }

  // 拖动缩进标记：连续跟随鼠标，拖动中不入历史栈
  private _dragIndent(evt: MouseEvent) {
    const target = this.dragIndentTarget
    const origin = this.dragOriginIndents
    if (!target || !origin) return
    const paragraphElementList = this._getParagraphElementList()
    if (!paragraphElementList) return
    const scale = this.options.scale
    const delta = (evt.clientX - this.dragStartPosition) / scale
    // 右缩进标记向左拖动时缩进增大
    const direction = target === RulerIndentTarget.RIGHT ? -1 : 1
    const adjust = (value: number, min: number, max: number) => {
      const next = Math.round(value + delta * direction)
      return Math.min(Math.max(next, min), Math.max(max, min))
    }
    // 原始尺寸下的版心宽度，约束缩进保证正文存在最小宽度
    const originalWidth = this.draw.getOriginalWidth()
    const originalMargins = this.draw.getOriginalMargins()
    const innerWidth = originalWidth - originalMargins[3] - originalMargins[1]
    const maxLeft = innerWidth - origin.right - this.MIN_INNER_SIZE_INDENT
    let key: 'indentLeft' | 'indentFirstLine' | 'indentRight'
    let value: number
    if (target === RulerIndentTarget.LEFT) {
      key = 'indentLeft'
      value = adjust(origin.left, 0, maxLeft)
    } else if (target === RulerIndentTarget.FIRST_LINE) {
      // 首行缩进允许负值（悬挂缩进），但不越过左边距
      key = 'indentFirstLine'
      value = adjust(origin.firstLine, -origin.left, maxLeft)
    } else {
      key = 'indentRight'
      value = adjust(
        origin.right,
        0,
        innerWidth - origin.left - this.MIN_INNER_SIZE_INDENT
      )
    }
    paragraphElementList.forEach(element => {
      element[key] = value
    })
    this.isIndentApplied = true
    this.draw.render({ isSubmitHistory: false, isSetCursor: false })
    const indents = this._getParagraphIndents()
    if (indents) {
      const positions = this._getIndentMarkerPositions({
        ...indents,
        [key]: value
      })
      const guidelineX =
        key === 'indentLeft'
          ? positions.leftX
          : key === 'indentFirstLine'
            ? positions.firstLineX
            : positions.rightX
      this._showGuideline(guidelineX)
    }
  }

  private _dragMargin(evt: MouseEvent) {
    if (this.dragIndentTarget) {
      this._dragIndent(evt)
      return
    }
    if (!this.dragSide || !this.dragOriginMargins || !this.rulerContainer) {
      return
    }
    const scale = this.options.scale
    // 显示方向上的页边距（原始尺寸）
    const displayed = [...this.dragOriginMargins]
    if (
      this.dragSide === RulerMarginSide.LEFT ||
      this.dragSide === RulerMarginSide.RIGHT
    ) {
      const originalWidth = this.draw.getOriginalWidth()
      // 基于拖拽起点的位移增量（还原为原始尺寸）
      const delta = (evt.clientX - this.dragStartPosition) / scale
      if (this.dragSide === RulerMarginSide.LEFT) {
        displayed[3] = this.clampMargin(
          displayed[3] + delta,
          originalWidth - displayed[1] - this.MIN_INNER_SIZE
        )
      } else {
        displayed[1] = this.clampMargin(
          displayed[1] - delta,
          originalWidth - displayed[3] - this.MIN_INNER_SIZE
        )
      }
    } else {
      const originalHeight = this.draw.getOriginalHeight()
      const delta = (evt.clientY - this.dragStartPosition) / scale
      if (this.dragSide === RulerMarginSide.TOP) {
        displayed[0] = this.clampMargin(
          displayed[0] + delta,
          originalHeight - displayed[2] - this.MIN_INNER_SIZE
        )
      } else {
        displayed[2] = this.clampMargin(
          displayed[2] - delta,
          originalHeight - displayed[0] - this.MIN_INNER_SIZE
        )
      }
    }
    this._setDisplayedMargins(<IMargin>displayed.map(m => Math.round(m)))
  }

  private _stopDrag() {
    const isIndentDrag = !!this.dragIndentTarget
    this.dragIndentTarget = null
    this.dragOriginIndents = null
    if (isIndentDrag) {
      this._removeGuideline()
      // 一次拖动提交一步撤销历史
      if (this.isIndentApplied) {
        this.isIndentApplied = false
        this.draw.render({ isSetCursor: false })
      }
    }
    // 拖拽手柄仅作触发，移动/抬起始终监听在document上，结束时统一移除
    document.removeEventListener('mousemove', this.mousemoveHandler)
    document.removeEventListener('mouseup', this.mouseupHandler)
    if (!this.dragSide) return
    this.dragSide = null
    this.dragStartPosition = 0
    this.dragOriginMargins = null
  }

  // 约束边距范围：[0, max]，保证正文区域存在最小宽度
  public clampMargin(value: number, max: number): number {
    return Math.min(Math.max(value, 0), Math.max(max, 0))
  }

  private _setDisplayedMargins(displayed: IMargin) {
    // getOriginalMargins 在横向纸张下做过旋转，此处还原回配置方向
    const { paperDirection, margins } = this.options
    const next: IMargin =
      paperDirection === PaperDirection.VERTICAL
        ? displayed
        : [displayed[3], displayed[0], displayed[1], displayed[2]]
    if (next.join() === margins.join()) return
    this.draw.setPaperMargin(next)
  }
}
