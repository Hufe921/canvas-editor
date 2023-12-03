import { CURSOR_AGENT_OFFSET_HEIGHT } from '../../dataset/constant/Cursor'
import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { MoveDirection } from '../../dataset/enum/Observer'
import { DeepRequired } from '../../interface/Common'
import { ICursorOption } from '../../interface/Cursor'
import { IEditorOption } from '../../interface/Editor'
import { IElementPosition } from '../../interface/Element'
import { findScrollContainer } from '../../utils'
import { Draw } from '../draw/Draw'
import { CanvasEvent } from '../event/CanvasEvent'
import { Position } from '../position/Position'
import { CursorAgent } from './CursorAgent'

export type IDrawCursorOption = ICursorOption & {
  isShow?: boolean
  isBlink?: boolean
  isFocus?: boolean
  hitLineStartIndex?: number
}

export interface IMoveCursorToVisibleOption {
  direction: MoveDirection
  cursorPosition: IElementPosition
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

  public getAgentIsActive(): boolean {
    return this.getAgentDom() === document.activeElement
  }

  public getAgentDomValue(): string {
    return this.getAgentDom().value
  }

  public clearAgentDomValue() {
    this.getAgentDom().value = ''
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
    let cursorPosition = this.position.getCursorPosition()
    if (!cursorPosition) return
    const { scale, cursor } = this.options
    const {
      color,
      width,
      isShow = true,
      isBlink = true,
      isFocus = true,
      hitLineStartIndex
    } = { ...cursor, ...payload }
    // 设置光标代理
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    // 光标位置
    if (hitLineStartIndex) {
      const positionList = this.position.getPositionList()
      cursorPosition = positionList[hitLineStartIndex]
    }
    const {
      metrics,
      coordinate: { leftTop, rightTop },
      ascent,
      pageNo
    } = cursorPosition
    const zoneManager = this.draw.getZone()
    const curPageNo = zoneManager.isMainActive()
      ? pageNo
      : this.draw.getPageNo()
    const preY = curPageNo * (height + pageGap)
    // 默认偏移高度
    const defaultOffsetHeight = CURSOR_AGENT_OFFSET_HEIGHT * scale
    // 增加1/4字体大小（最小为defaultOffsetHeight即默认偏移高度）
    const increaseHeight = Math.min(metrics.height / 4, defaultOffsetHeight)
    const cursorHeight = metrics.height + increaseHeight * 2
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    if (isFocus) {
      setTimeout(() => {
        agentCursorDom.focus()
        agentCursorDom.setSelectionRange(0, 0)
      })
    }
    // fillText位置 + 文字基线到底部距离 - 模拟光标偏移量
    const descent =
      metrics.boundingBoxDescent < 0 ? 0 : metrics.boundingBoxDescent
    const cursorTop =
      leftTop[1] + ascent + descent - (cursorHeight - increaseHeight) + preY
    const cursorLeft = hitLineStartIndex ? leftTop[0] : rightTop[0]
    agentCursorDom.style.left = `${cursorLeft}px`
    agentCursorDom.style.top = `${
      cursorTop + cursorHeight - defaultOffsetHeight
    }px`
    // 模拟光标显示
    if (!isShow) return
    const isReadonly = this.draw.isReadonly()
    this.cursorDom.style.width = `${width * scale}px`
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

  public moveCursorToVisible(payload: IMoveCursorToVisibleOption) {
    const { cursorPosition, direction } = payload
    if (!cursorPosition || !direction) return
    const {
      pageNo,
      coordinate: { leftTop, leftBottom }
    } = cursorPosition
    // 当前页面距离滚动容器顶部距离
    const prePageY =
      pageNo * (this.draw.getHeight() + this.draw.getPageGap()) +
      this.container.getBoundingClientRect().top
    // 向上移动时：以顶部距离为准，向下移动时：以底部位置为准
    const isUp = direction === MoveDirection.UP
    const x = leftBottom[0]
    const y = isUp ? leftTop[1] + prePageY : leftBottom[1] + prePageY
    // 查找滚动容器，如果是滚动容器是document，则限制范围为当前窗口
    const scrollContainer = findScrollContainer(this.container)
    const rect = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }
    if (scrollContainer === document.documentElement) {
      rect.right = window.innerWidth
      rect.bottom = window.innerHeight
    } else {
      const { left, right, top, bottom } =
        scrollContainer.getBoundingClientRect()
      rect.left = left
      rect.right = right
      rect.top = top
      rect.bottom = bottom
    }
    // 可视范围根据参数调整
    const { maskMargin } = this.options
    rect.top += maskMargin[0]
    rect.bottom -= maskMargin[2]
    // 不在可视范围时，移动滚动条到合适位置
    if (
      !(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
    ) {
      const { scrollLeft, scrollTop } = scrollContainer
      isUp
        ? scrollContainer.scroll(scrollLeft, scrollTop - (rect.top - y))
        : scrollContainer.scroll(scrollLeft, scrollTop + y - rect.bottom)
    }
  }
}
