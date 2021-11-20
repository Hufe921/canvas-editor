import { CURSOR_AGENT_HEIGHT } from "../../dataset/constant/Cursor"
import { Draw } from "../draw/Draw"
import { CanvasEvent } from "../event/CanvasEvent"
import { Position } from "../position/Position"
import { RangeManager } from "../range/RangeManager"
import { CursorAgent } from "./CursorAgent"

export class Cursor {

  private canvas: HTMLCanvasElement
  private draw: Draw
  private range: RangeManager
  private position: Position
  private cursorDom: HTMLDivElement
  private cursorAgent: CursorAgent

  constructor(canvas: HTMLCanvasElement, draw: Draw, canvasEvent: CanvasEvent) {
    this.canvas = canvas
    this.draw = draw
    this.range = this.draw.getRange()
    this.position = this.draw.getPosition()

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

  public setCursorPosition(evt: MouseEvent) {
    const positionIndex = this.position.getPositionByXY(evt.offsetX, evt.offsetY)
    if (~positionIndex) {
      this.range.setRange(positionIndex, positionIndex)
      setTimeout(() => {
        this.draw.render({ curIndex: positionIndex, isSubmitHistory: false })
      })
    }
  }

  public drawCursor() {
    const cursorPosition = this.draw.getPosition().getCursorPosition()
    if (!cursorPosition) return
    // 设置光标代理
    const { metrics, coordinate: { leftTop, rightTop }, ascent } = cursorPosition
    const height = metrics.boundingBoxAscent + metrics.boundingBoxDescent
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    setTimeout(() => {
      agentCursorDom.focus()
      agentCursorDom.setSelectionRange(0, 0)
    })
    const cursorTop = leftTop[1] + ascent - metrics.boundingBoxAscent
    const curosrleft = rightTop[0]
    agentCursorDom.style.left = `${curosrleft}px`
    agentCursorDom.style.top = `${cursorTop + height - CURSOR_AGENT_HEIGHT}px`
    // 模拟光标显示
    this.cursorDom.style.left = `${curosrleft}px`
    this.cursorDom.style.top = `${cursorTop}px`
    this.cursorDom.style.display = 'block'
    this.cursorDom.style.height = `${height}px`
    setTimeout(() => {
      this.cursorDom.classList.add('cursor--animation')
    }, 200)
  }

  public recoveryCursor() {
    this.cursorDom.style.display = 'none'
    this.cursorDom.classList.remove('cursor--animation')
  }

}