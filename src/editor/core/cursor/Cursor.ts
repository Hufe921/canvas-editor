import { CURSOR_AGENT_HEIGHT } from "../../dataset/constant/Cursor"
import { Draw } from "../draw/Draw"
import { CanvasEvent } from "../event/CanvasEvent"
import { CursorAgent } from "./CursorAgent"

export class Cursor {

  private canvas: HTMLCanvasElement
  private draw: Draw
  private cursorDom: HTMLDivElement
  private cursorAgent: CursorAgent

  constructor(canvas: HTMLCanvasElement, draw: Draw, canvasEvent: CanvasEvent) {
    this.canvas = canvas
    this.draw = draw

    this.cursorDom = document.createElement('div')
    this.cursorDom.classList.add('cursor')
    this.canvas.parentNode?.append(this.cursorDom)
    this.cursorAgent = new CursorAgent(canvas, canvasEvent)
  }

  public getCursorDom(): HTMLDivElement {
    return this.cursorDom
  }

  public getAgentDom(): HTMLTextAreaElement {
    return this.cursorAgent.getAgentCursorDom()
  }

  public drawCursor() {
    const cursorPosition = this.draw.getPosition().getCursorPosition()
    if (!cursorPosition) return
    // 设置光标代理
    const { metrics, coordinate: { leftTop, rightTop }, ascent } = cursorPosition
    // 增加1/4字体大小
    const offsetHeight = metrics.height / 4
    const cursorHeight = metrics.height + offsetHeight * 2
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    setTimeout(() => {
      agentCursorDom.focus()
      agentCursorDom.setSelectionRange(0, 0)
    })
    // fillText位置 + 文字基线到底部距离  - 模拟光标偏移量
    const descent = metrics.boundingBoxDescent < 0 ? 0 : metrics.boundingBoxDescent
    const cursorTop = (leftTop[1] + ascent) + descent - (cursorHeight - offsetHeight)
    const curosrleft = rightTop[0]
    agentCursorDom.style.left = `${curosrleft}px`
    agentCursorDom.style.top = `${cursorTop + cursorHeight - CURSOR_AGENT_HEIGHT}px`
    // 模拟光标显示
    this.cursorDom.style.left = `${curosrleft}px`
    this.cursorDom.style.top = `${cursorTop}px`
    this.cursorDom.style.display = 'block'
    this.cursorDom.style.height = `${cursorHeight}px`
    setTimeout(() => {
      this.cursorDom.classList.add('cursor--animation')
    }, 200)
  }

  public recoveryCursor() {
    this.cursorDom.style.display = 'none'
    this.cursorDom.classList.remove('cursor--animation')
  }

}