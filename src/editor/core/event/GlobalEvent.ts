import { EDITOR_COMPONENT } from "../../dataset/constant/Editor"
import { IEditorOption } from "../../interface/Editor"
import { findParent } from "../../utils"
import { Cursor } from "../cursor/Cursor"
import { Draw } from "../draw/Draw"
import { HyperlinkParticle } from "../draw/particle/HyperlinkParticle"
import { ImageParticle } from "../draw/particle/ImageParticle"
import { TableTool } from "../draw/particle/table/TableTool"
import { RangeManager } from "../range/RangeManager"
import { CanvasEvent } from "./CanvasEvent"

export class GlobalEvent {

  private draw: Draw
  private canvas: HTMLCanvasElement
  private options: Required<IEditorOption>
  private cursor: Cursor | null
  private canvasEvent: CanvasEvent
  private range: RangeManager
  private imageParticle: ImageParticle
  private tableTool: TableTool
  private hyperlinkParticle: HyperlinkParticle

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.canvas = draw.getPage()
    this.options = draw.getOptions()
    this.canvasEvent = canvasEvent
    this.cursor = null
    this.range = draw.getRange()
    this.imageParticle = draw.getImageParticle()
    this.tableTool = draw.getTableTool()
    this.hyperlinkParticle = draw.getHyperlinkParticle()
  }

  public register() {
    this.cursor = this.draw.getCursor()
    document.addEventListener('keyup', () => {
      this.setRangeStyle()
    })
    document.addEventListener('click', (evt) => {
      this.recoverEffect(evt)
    })
    document.addEventListener('mouseup', () => {
      this.setDragState()
    })
    document.addEventListener('wheel', (evt: WheelEvent) => {
      this.setPageScale(evt)
    }, { passive: false })
  }

  public recoverEffect(evt: MouseEvent) {
    if (!this.cursor) return
    const cursorDom = this.cursor.getCursorDom()
    const agentDom = this.cursor.getAgentDom()
    const innerDoms = [this.canvas, cursorDom, agentDom, document.body]
    if (innerDoms.includes(evt.target as any)) {
      this.setRangeStyle()
      return
    }
    // 编辑器外部dom
    const outerEditorDom = findParent(
      evt.target as Element,
      (node: Node & Element) => !!node && node.nodeType === 1 && !!node.getAttribute(EDITOR_COMPONENT),
      true
    )
    if (outerEditorDom) {
      this.setRangeStyle()
      return
    }
    this.cursor.recoveryCursor()
    this.range.recoveryRangeStyle()
    this.range.setRange(0, 0)
    this.imageParticle.clearResizer()
    this.tableTool.dispose()
    this.hyperlinkParticle.clearHyperlinkPopup()
  }

  public setDragState() {
    this.canvasEvent.setIsAllowDrag(false)
  }

  public setRangeStyle() {
    this.range.setRangeStyle()
  }

  public setPageScale(evt: WheelEvent) {
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

}