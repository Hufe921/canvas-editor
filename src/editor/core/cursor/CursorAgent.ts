import { debounce } from "../../utils"
import { Draw } from "../draw/Draw"
import { CanvasEvent } from "../event/CanvasEvent"

export class CursorAgent {

  private container: HTMLDivElement
  private agentCursorDom: HTMLTextAreaElement
  private canvasEvent: CanvasEvent

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.container = draw.getContainer()
    this.canvasEvent = canvasEvent
    // 代理光标绘制
    const agentCursorDom = document.createElement('textarea')
    agentCursorDom.autocomplete = 'off'
    agentCursorDom.classList.add('inputarea')
    agentCursorDom.innerText = ''
    this.container.append(agentCursorDom)
    this.agentCursorDom = agentCursorDom
    // 事件
    agentCursorDom.onkeydown = (evt: KeyboardEvent) => this._keyDown(evt)
    agentCursorDom.oninput = debounce(this._input.bind(this), 0)
    agentCursorDom.onpaste = (evt: ClipboardEvent) => this._paste(evt)
    agentCursorDom.addEventListener('compositionstart', this._compositionstart.bind(this))
    agentCursorDom.addEventListener('compositionend', this._compositionend.bind(this))
  }

  public getAgentCursorDom(): HTMLTextAreaElement {
    return this.agentCursorDom
  }

  private _keyDown(evt: KeyboardEvent) {
    this.canvasEvent.keydown(evt)
  }

  private _input(evt: InputEvent) {
    if (!evt.data) return
    this.canvasEvent.input(evt.data)
  }

  private _paste(evt: ClipboardEvent) {
    this.canvasEvent.paste(evt)
  }

  private _compositionstart() {
    this.canvasEvent.compositionstart()
  }

  private _compositionend() {
    this.canvasEvent.compositionend()
  }

}