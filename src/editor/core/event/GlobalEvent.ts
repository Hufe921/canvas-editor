import { EDITOR_COMPONENT } from "../../dataset/constant/Editor"
import { findParent } from "../../utils"
import { Cursor } from "../cursor/Cursor"
import { Draw } from "../draw/Draw"
import { ImageParticle } from "../draw/particle/ImageParticle"
import { RangeManager } from "../range/RangeManager"
import { CanvasEvent } from "./CanvasEvent"

export class GlobalEvent {

  private canvas: HTMLCanvasElement
  private draw: Draw
  private cursor: Cursor | null
  private canvasEvent: CanvasEvent
  private range: RangeManager
  private imageParticle: ImageParticle

  constructor(canvas: HTMLCanvasElement, draw: Draw, canvasEvent: CanvasEvent) {
    this.canvas = canvas
    this.draw = draw
    this.canvasEvent = canvasEvent
    this.cursor = null
    this.range = draw.getRange()
    this.imageParticle = draw.getImageParticle()
  }

  register() {
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
  }

  recoverEffect(evt: MouseEvent) {
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
  }

  setDragState() {
    this.canvasEvent.setIsAllowDrag(false)
  }

  setRangeStyle() {
    this.range.setRangeStyle()
  }

}