import { EDITOR_COMPONENT } from "../../dataset/constant/Editor"
import { findParent } from "../../utils"
import { Cursor } from "../cursor/Cursor"
import { Draw } from "../draw/Draw"
import { RangeManager } from "../range/RangeManager"
import { CanvasEvent } from "./CanvasEvent"

export class GlobalEvent {

  private canvas: HTMLCanvasElement
  private draw: Draw
  private cursor: Cursor | null
  private canvasEvent: CanvasEvent
  private range: RangeManager

  constructor(canvas: HTMLCanvasElement, draw: Draw, canvasEvent: CanvasEvent) {
    this.canvas = canvas
    this.draw = draw
    this.canvasEvent = canvasEvent
    this.cursor = null
    this.range = draw.getRange()
  }

  register() {
    this.cursor = this.draw.getCursor()
    document.addEventListener('keyup', () => {
      this.setRangeStyle()
    })
    document.addEventListener('click', (evt) => {
      this.recoverCursor(evt)
      this.setRangeStyle()
    })
    document.addEventListener('mouseup', () => {
      this.setDragState()
    })
  }

  recoverCursor(evt: MouseEvent) {
    if (!this.cursor) return
    const cursorDom = this.cursor.getCursorDom()
    const agentDom = this.cursor.getAgentDom()
    const innerDoms = [this.canvas, cursorDom, agentDom, document.body]
    if (innerDoms.includes(evt.target as any)) return
    // 编辑器外部dom
    const outerEditorDom = findParent(
      evt.target as Element,
      (node: Node & Element) => !!node && node.nodeType === 1 && !!node.getAttribute(EDITOR_COMPONENT),
      true
    )
    if (outerEditorDom) return
    this.cursor.recoveryCursor()
  }

  setDragState() {
    this.canvasEvent.setIsAllowDrag(false)
  }

  setRangeStyle() {
    this.range.setRangeStyle()
  }

}