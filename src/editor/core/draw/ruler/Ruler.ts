import { EDITOR_PREFIX } from '../../../dataset/constant/Editor'
import {
  EditorMode,
  PageMode,
  PaperDirection
} from '../../../dataset/enum/Editor'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IMargin } from '../../../interface/Margin'
import { Draw } from '../Draw'

// 拖拽边距的方向
enum RulerMarginSide {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom'
}

export class Ruler {
  // 1毫米对应的像素值（基于96dpi）
  private readonly MM_PX = 96 / 25.4
  // 边距手柄的命中容差（像素）
  private readonly HANDLE_HIT_TOLERANCE = 7
  // 拖动边距时正文区域保留的最小尺寸（像素）
  private readonly MIN_INNER_SIZE = 100

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
    ctx.clearRect(0, 0, width, height)
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
      const tickHeight = isCm ? 10 : i % 5 === 0 ? 7 : 4
      ctx.moveTo(x, height)
      ctx.lineTo(x, height - tickHeight)
      // 边缘处的刻度数字会被裁切，仅绘制完整可容纳的
      if (isCm && i > 0 && x >= 8 && x <= width - 8) {
        ctx.fillText(String(i / 10), x, 9)
      }
    }
    ctx.stroke()
    // 底部边框线
    ctx.beginPath()
    ctx.strokeStyle = '#e0e0e0'
    ctx.moveTo(0, height - 0.5)
    ctx.lineTo(width, height - 0.5)
    ctx.stroke()
    // 左右边距手柄
    this._drawXHandle(ctx, margins[3], height)
    this._drawXHandle(ctx, width - margins[1], height)
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
    ctx.clearRect(0, 0, rulerSize, pageHeight)
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
      const tickWidth = isCm ? 10 : i % 5 === 0 ? 7 : 4
      ctx.moveTo(rulerSize, y)
      ctx.lineTo(rulerSize - tickWidth, y)
      // 边缘处的刻度数字会被裁切，仅绘制完整可容纳的
      if (isCm && i > 0 && y >= 8 && y <= pageHeight - 8) {
        ctx.save()
        ctx.translate(9, y)
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
    // 上下边距手柄
    this._drawYHandle(ctx, margins[0], rulerSize)
    this._drawYHandle(ctx, pageHeight - margins[2], rulerSize)
  }

  private _drawXHandle(
    ctx: CanvasRenderingContext2D,
    x: number,
    height: number
  ) {
    const halfWidth = 5
    const handleHeight = 7
    ctx.beginPath()
    ctx.fillStyle = '#595959'
    ctx.moveTo(x - halfWidth, height - handleHeight)
    ctx.lineTo(x + halfWidth, height - handleHeight)
    ctx.lineTo(x, height)
    ctx.closePath()
    ctx.fill()
  }

  private _drawYHandle(
    ctx: CanvasRenderingContext2D,
    y: number,
    width: number
  ) {
    const halfHeight = 5
    const handleWidth = 7
    ctx.beginPath()
    ctx.fillStyle = '#595959'
    ctx.moveTo(width - handleWidth, y - halfHeight)
    ctx.lineTo(width - handleWidth, y + halfHeight)
    ctx.lineTo(width, y)
    ctx.closePath()
    ctx.fill()
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

  // 只读、打印、表单模式下不允许拖动边距
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

  private _mousedownX(evt: MouseEvent) {
    if (this._isMarginDragDisabled()) return
    const side = this._getHitMarginSideX(this._getRelativeX(evt))
    if (!side) return
    this._startDrag(side, evt.clientX)
  }

  private _mousedownY(evt: MouseEvent) {
    if (this._isMarginDragDisabled()) return
    const side = this._getHitMarginSideY(this._getRelativeY(evt))
    if (!side) return
    this._startDrag(side, evt.clientY)
  }

  private _updateCursorX(evt: MouseEvent) {
    if (!this.canvasX) return
    const side = this._getHitMarginSideX(this._getRelativeX(evt))
    this.canvasX.style.cursor = side ? 'col-resize' : 'default'
  }

  private _updateCursorY(evt: MouseEvent) {
    if (!this.canvasY) return
    const side = this._getHitMarginSideY(this._getRelativeY(evt))
    this.canvasY.style.cursor = side ? 'row-resize' : 'default'
  }

  private _dragMargin(evt: MouseEvent) {
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
    if (!this.dragSide) return
    this.dragSide = null
    this.dragStartPosition = 0
    this.dragOriginMargins = null
    document.removeEventListener('mousemove', this.mousemoveHandler)
    document.removeEventListener('mouseup', this.mouseupHandler)
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
