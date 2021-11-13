import { Cursor } from "../cursor/Cursor"
import { Draw } from "../draw/Draw"
import { CanvasEvent } from "./CanvasEvent"

export class GlobalEvent {

  private canvas: HTMLCanvasElement
  private draw: Draw
  private cursor: Cursor | null
  private canvasEvent: CanvasEvent

  constructor(canvas: HTMLCanvasElement, draw: Draw, canvasEvent: CanvasEvent) {
    this.canvas = canvas
    this.draw = draw
    this.canvasEvent = canvasEvent
    this.cursor = null
  }

  register() {
    this.cursor = this.draw.getCursor()

    document.addEventListener('click', (evt) => {
      this.recoverCursor(evt)
    })

    document.addEventListener('mouseup', () => {
      this.updateDragState()
    })
  }

  recoverCursor(evt: MouseEvent) {
    if (!this.cursor) return
    const cursorDom = this.cursor.getCursorDom()
    const agentDom = this.cursor.getAgentDom()
    const innerDoms = [this.canvas, cursorDom, agentDom, this.canvas.parentNode, document.body]
    if (innerDoms.includes(evt.target as any)) return
    this.cursor.recoveryCursor()
  }

  updateDragState() {
    this.canvasEvent.setIsAllowDrag(false)
  }

}