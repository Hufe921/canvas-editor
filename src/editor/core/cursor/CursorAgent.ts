import { debounce } from "../../utils"
import { CanvasEvent } from "../event/CanvasEvent"

export class CursorAgent {

  private canvas: HTMLCanvasElement
  private agentCursorDom: HTMLTextAreaElement
  private canvasEvent: CanvasEvent

  constructor(canvas: HTMLCanvasElement, canvasEvent: CanvasEvent) {
    this.canvas = canvas
    this.canvasEvent = canvasEvent
    // 代理光标绘制
    const agentCursorDom = document.createElement('textarea')
    agentCursorDom.autocomplete = 'off'
    agentCursorDom.classList.add('inputarea')
    agentCursorDom.innerText = ''
    this.canvas.parentNode?.append(agentCursorDom)
    this.agentCursorDom = agentCursorDom
    // 事件
    agentCursorDom.onkeydown = (evt: KeyboardEvent) => this.keyDown(evt)
    agentCursorDom.oninput = debounce(this.input.bind(this), 0)
    agentCursorDom.onpaste = (evt: ClipboardEvent) => this.paste(evt)
    agentCursorDom.addEventListener('compositionstart', this.compositionstart.bind(this))
    agentCursorDom.addEventListener('compositionend', this.compositionend.bind(this))
  }

  public getAgentCursorDom(): HTMLTextAreaElement {
    return this.agentCursorDom
  }

  keyDown(evt: KeyboardEvent) {
    this.canvasEvent.keydown(evt)
  }

  input(evt: InputEvent) {
    if (!evt.data) return
    this.canvasEvent.input(evt.data)
  }

  paste(evt: ClipboardEvent) {
    this.canvasEvent.paste(evt)
  }

  compositionstart() {
    this.canvasEvent.compositionstart()
  }

  compositionend() {
    this.canvasEvent.compositionend()
  }

}