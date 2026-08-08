import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EventBusMap } from '../../interface/EventBus'
import { Draw } from '../draw/Draw'
import { CanvasEvent } from '../event/CanvasEvent'
import { EventBus } from '../event/eventbus/EventBus'
import { pasteByEvent } from '../event/handlers/paste'

export class CursorAgent {
  private draw: Draw
  private container: HTMLDivElement
  private agentCursorDom: HTMLTextAreaElement
  private canvasEvent: CanvasEvent
  private eventBus: EventBus<EventBusMap>
  /** Set when keydown already handled Backspace/Delete — skip beforeinput twin. */
  private keydownHandledDelete = false
  private keydownHandledDeleteTimer: ReturnType<typeof setTimeout> | null =
    null

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.container = draw.getContainer()
    this.canvasEvent = canvasEvent
    this.eventBus = draw.getEventBus()
    // 代理光标绘制
    const agentCursorDom = document.createElement('textarea')
    agentCursorDom.autocomplete = 'off'
    agentCursorDom.classList.add(`${EDITOR_PREFIX}-inputarea`)
    agentCursorDom.innerText = ''
    this.container.append(agentCursorDom)
    this.agentCursorDom = agentCursorDom
    // 事件
    agentCursorDom.onkeydown = (evt: KeyboardEvent) => this._keyDown(evt)
    agentCursorDom.oninput = this._input.bind(this)
    agentCursorDom.onpaste = (evt: ClipboardEvent) => this._paste(evt)
    agentCursorDom.addEventListener(
      'beforeinput',
      this._beforeInput.bind(this) as EventListener
    )
    agentCursorDom.addEventListener(
      'compositionstart',
      this._compositionstart.bind(this)
    )
    agentCursorDom.addEventListener(
      'compositionend',
      this._compositionend.bind(this)
    )
  }

  public getAgentCursorDom(): HTMLTextAreaElement {
    return this.agentCursorDom
  }

  /** Sync textarea dir with current paragraph direction (IME / RTL). */
  public syncDirection(dir: 'ltr' | 'rtl' | 'auto') {
    this.agentCursorDom.dir = dir
  }

  private _markKeydownHandledDelete() {
    this.keydownHandledDelete = true
    if (this.keydownHandledDeleteTimer != null) {
      clearTimeout(this.keydownHandledDeleteTimer)
    }
    // 部分浏览器 beforeinput 会落到微任务之后；用短延时覆盖整次按键周期
    this.keydownHandledDeleteTimer = setTimeout(() => {
      this.keydownHandledDelete = false
      this.keydownHandledDeleteTimer = null
    }, 50)
  }

  private _keyDown(evt: KeyboardEvent) {
    if (evt.key === 'Backspace' || evt.key === 'Delete') {
      this._markKeydownHandledDelete()
    }
    this.canvasEvent.keydown(evt)
  }

  /**
   * Mobile / IME often emit beforeinput delete without a reliable keydown.
   * Desktop keydown remains primary; this is a fallback (DEFER-021).
   * 已由 keydown 处理时只拦截，勿再合成一次删除（否则会多删句号等前邻字符）。
   */
  private _beforeInput(evt: InputEvent) {
    if (this.canvasEvent.isComposing) return
    const { inputType } = evt
    if (
      inputType !== 'deleteContentBackward' &&
      inputType !== 'deleteContentForward'
    ) {
      return
    }
    evt.preventDefault()
    if (this.keydownHandledDelete) return
    const key =
      inputType === 'deleteContentBackward' ? 'Backspace' : 'Delete'
    // 合成删除也打标，避免同周期内重复 beforeinput
    this._markKeydownHandledDelete()
    this.canvasEvent.keydown(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    )
  }

  private _input(evt: Event) {
    const data = (<InputEvent>evt).data
    if (data) {
      this.canvasEvent.input(data)
    }
    if (this.eventBus.isSubscribe('input')) {
      this.eventBus.emit('input', evt)
    }
  }

  private _paste(evt: ClipboardEvent) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const clipboardData = evt.clipboardData
    if (!clipboardData) return
    pasteByEvent(this.canvasEvent, evt)
    evt.preventDefault()
  }

  private _compositionstart() {
    this.canvasEvent.compositionstart()
  }

  private _compositionend(evt: CompositionEvent) {
    this.canvasEvent.compositionend(evt)
  }
}
