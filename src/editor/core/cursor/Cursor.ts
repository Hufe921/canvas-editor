import { CURSOR_AGENT_HEIGHT } from '../../dataset/constant/Cursor'
import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { DeepRequired } from '../../interface/Common'
import { ICursorOption } from '../../interface/Cursor'
import { IEditorOption } from '../../interface/Editor'
import { Draw } from '../draw/Draw'
import { CanvasEvent } from '../event/CanvasEvent'
import { Position } from '../position/Position'
import { CursorAgent } from './CursorAgent'

export type IDrawCursorOption = ICursorOption &
{
  isShow?: boolean;
  isBlink?: boolean;
}

export class Cursor {

  private readonly ANIMATION_CLASS = `${EDITOR_PREFIX}-cursor--animation`

  private draw: Draw
  private container: HTMLDivElement
  private options: DeepRequired<IEditorOption>
  private position: Position
  private cursorDom: HTMLDivElement
  private cursorAgent: CursorAgent
  private blinkTimeout: number | null

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.container = draw.getContainer()
    this.position = draw.getPosition()
    this.options = draw.getOptions()

    this.cursorDom = document.createElement('div')
    this.cursorDom.classList.add(`${EDITOR_PREFIX}-cursor`)
    this.container.append(this.cursorDom)
    this.cursorAgent = new CursorAgent(draw, canvasEvent)
    this.blinkTimeout = null
  }

  public getCursorDom(): HTMLDivElement {
    return this.cursorDom
  }

  public getAgentDom(): HTMLTextAreaElement {
    return this.cursorAgent.getAgentCursorDom()
  }

  public getAgentDomValue(): string {
    return this.getAgentDom().value
  }

  public clearAgentDomValue(): string {
    return this.getAgentDom().value = ''
  }

  private _blinkStart() {
    this.cursorDom.classList.add(this.ANIMATION_CLASS)
  }

  private _blinkStop() {
    this.cursorDom.classList.remove(this.ANIMATION_CLASS)
  }

  private _setBlinkTimeout() {
    this._clearBlinkTimeout()
    this.blinkTimeout = window.setTimeout(() => {
      this._blinkStart()
    }, 500)
  }

  private _clearBlinkTimeout() {
    if (this.blinkTimeout) {
      this._blinkStop()
      window.clearTimeout(this.blinkTimeout)
      this.blinkTimeout = null
    }
  }

  public drawCursor(payload?: IDrawCursorOption) {
    const cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    const { scale, cursor } = this.options
    const {
      color,
      width,
      isShow = true,
      isBlink = true
    } = { ...cursor, ...payload }
    // 设置光标代理
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const { metrics, coordinate: { leftTop, rightTop }, ascent, pageNo } = cursorPosition
    const zoneManager = this.draw.getZone()
    const curPageNo = zoneManager.isMainActive() ? pageNo : this.draw.getPageNo()
    const preY = curPageNo * (height + pageGap)
    // 增加1/4字体大小
    const offsetHeight = metrics.height / 4
    const cursorHeight = metrics.height + offsetHeight * 2
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    setTimeout(() => {
      agentCursorDom.focus()
      agentCursorDom.setSelectionRange(0, 0)
    })
    // fillText位置 + 文字基线到底部距离 - 模拟光标偏移量
    const descent = metrics.boundingBoxDescent < 0 ? 0 : metrics.boundingBoxDescent
    const cursorTop = (leftTop[1] + ascent) + descent - (cursorHeight - offsetHeight) + preY
    const cursorLeft = rightTop[0]
    agentCursorDom.style.left = `${cursorLeft}px`
    agentCursorDom.style.top = `${cursorTop + cursorHeight - CURSOR_AGENT_HEIGHT * scale}px`
    // 模拟光标显示
    if (!isShow) return
    const isReadonly = this.draw.isReadonly()
    this.cursorDom.style.width = `${width}px`
    this.cursorDom.style.backgroundColor = color
    this.cursorDom.style.left = `${cursorLeft}px`
    this.cursorDom.style.top = `${cursorTop}px`
    this.cursorDom.style.display = isReadonly ? 'none' : 'block'
    this.cursorDom.style.height = `${cursorHeight}px`
    if (isBlink) {
      this._setBlinkTimeout()
    } else {
      this._clearBlinkTimeout()
    }
  }

  public recoveryCursor() {
    this.cursorDom.style.display = 'none'
    this._clearBlinkTimeout()
  }

}