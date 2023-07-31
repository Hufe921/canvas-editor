import { EDITOR_COMPONENT } from '../../dataset/constant/Editor'
import { IEditorOption } from '../../interface/Editor'
import { findParent } from '../../utils'
import { Cursor } from '../cursor/Cursor'
import { Control } from '../draw/control/Control'
import { Draw } from '../draw/Draw'
import { HyperlinkParticle } from '../draw/particle/HyperlinkParticle'
import { DateParticle } from '../draw/particle/date/DateParticle'
import { Previewer } from '../draw/particle/previewer/Previewer'
import { TableTool } from '../draw/particle/table/TableTool'
import { RangeManager } from '../range/RangeManager'
import { CanvasEvent } from './CanvasEvent'

export class GlobalEvent {
  private draw: Draw
  private options: Required<IEditorOption>
  private cursor: Cursor | null
  private canvasEvent: CanvasEvent
  private range: RangeManager
  private previewer: Previewer
  private tableTool: TableTool
  private hyperlinkParticle: HyperlinkParticle
  private control: Control
  private dateParticle: DateParticle
  private dprMediaQueryList: MediaQueryList

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.options = draw.getOptions()
    this.canvasEvent = canvasEvent
    this.cursor = null
    this.range = draw.getRange()
    this.previewer = draw.getPreviewer()
    this.tableTool = draw.getTableTool()
    this.hyperlinkParticle = draw.getHyperlinkParticle()
    this.dateParticle = draw.getDateParticle()
    this.control = draw.getControl()
    this.dprMediaQueryList = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    )
  }

  public register() {
    this.cursor = this.draw.getCursor()
    this.addEvent()
  }

  private addEvent() {
    window.addEventListener('blur', this.clearSideEffect)
    document.addEventListener('keyup', this.setRangeStyle)
    document.addEventListener('click', this.clearSideEffect)
    document.addEventListener('mouseup', this.setCanvasEventAbility)
    document.addEventListener('wheel', this.setPageScale, { passive: false })
    document.addEventListener('visibilitychange', this._handleVisibilityChange)
    this.dprMediaQueryList.addEventListener('change', this._handleDprChange)
  }

  public removeEvent() {
    window.removeEventListener('blur', this.clearSideEffect)
    document.removeEventListener('keyup', this.setRangeStyle)
    document.removeEventListener('click', this.clearSideEffect)
    document.removeEventListener('mouseup', this.setCanvasEventAbility)
    document.removeEventListener('wheel', this.setPageScale)
    document.removeEventListener(
      'visibilitychange',
      this._handleVisibilityChange
    )
    this.dprMediaQueryList.removeEventListener('change', this._handleDprChange)
  }

  public clearSideEffect = (evt: Event) => {
    if (!this.cursor) return
    // 编辑器内部dom
    const target = <Element>(evt?.composedPath()[0] || evt.target)
    const pageList = this.draw.getPageList()
    const innerEditorDom = findParent(
      target,
      (node: any) => pageList.includes(node),
      true
    )
    if (innerEditorDom) {
      this.setRangeStyle()
      return
    }
    // 编辑器外部组件dom
    const outerEditorDom = findParent(
      target,
      (node: Node & Element) =>
        !!node && node.nodeType === 1 && !!node.getAttribute(EDITOR_COMPONENT),
      true
    )
    if (outerEditorDom) {
      this.setRangeStyle()
      this.watchCursorActive()
      return
    }
    this.cursor.recoveryCursor()
    this.range.recoveryRangeStyle()
    this.previewer.clearResizer()
    this.tableTool.dispose()
    this.hyperlinkParticle.clearHyperlinkPopup()
    this.control.destroyControl()
    this.dateParticle.clearDatePicker()
  }

  public setCanvasEventAbility = () => {
    this.canvasEvent.setIsAllowDrag(false)
    this.canvasEvent.setIsAllowSelection(false)
  }

  public setRangeStyle = () => {
    this.range.setRangeStyle()
  }

  public watchCursorActive() {
    // 选区闭合&实际光标移出光标代理
    if (!this.range.getIsCollapsed()) return
    setTimeout(() => {
      // 将模拟光标变成失活显示状态
      if (!this.cursor?.getAgentIsActive()) {
        this.cursor?.drawCursor({
          isFocus: false,
          isBlink: false
        })
      }
    })
  }

  public setPageScale = (evt: WheelEvent) => {
    if (!evt.ctrlKey) return
    evt.preventDefault()
    const { scale } = this.options
    if (evt.deltaY < 0) {
      // 放大
      const nextScale = scale * 10 + 1
      if (nextScale <= 30) {
        this.draw.setPageScale(nextScale / 10)
      }
    } else {
      // 缩小
      const nextScale = scale * 10 - 1
      if (nextScale >= 5) {
        this.draw.setPageScale(nextScale / 10)
      }
    }
  }

  private _handleVisibilityChange = () => {
    if (document.visibilityState) {
      const isCollapsed = this.range.getIsCollapsed()
      this.cursor?.drawCursor({
        isShow: isCollapsed
      })
    }
  }

  private _handleDprChange = () => {
    this.draw.setPageDevicePixel()
  }
}
