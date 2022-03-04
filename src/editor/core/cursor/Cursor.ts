import { CURSOR_AGENT_HEIGHT } from "../../dataset/constant/Cursor"
import { IEditorOption } from "../../interface/Editor"
import { Draw } from "../draw/Draw"
import { CanvasEvent } from "../event/CanvasEvent"
import { Position } from "../position/Position"
import { CursorAgent } from "./CursorAgent"

export class Cursor {

  private draw: Draw
  private container: HTMLDivElement
  private options: Required<IEditorOption>
  private position: Position
  private cursorDom: HTMLDivElement
  private cursorAgent: CursorAgent

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.container = draw.getContainer()
    this.position = draw.getPosition()
    this.options = draw.getOptions()

    this.cursorDom = document.createElement('div')
    this.cursorDom.classList.add('cursor')
    this.container.append(this.cursorDom)
    this.cursorAgent = new CursorAgent(draw, canvasEvent)
  }

  public getCursorDom(): HTMLDivElement {
    return this.cursorDom
  }

  public getAgentDom(): HTMLTextAreaElement {
    return this.cursorAgent.getAgentCursorDom()
  }

  public drawCursor() {
    const isReadonly = this.draw.isReadonly()
    const cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    // 设置光标代理
    const { scale } = this.options
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const { metrics, coordinate: { leftTop, rightTop }, ascent, pageNo } = cursorPosition
    const preY = pageNo * (height + pageGap)
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
    this.cursorDom.style.left = `${cursorLeft}px`
    this.cursorDom.style.top = `${cursorTop}px`
    this.cursorDom.style.display = isReadonly ? 'none' : 'block'
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