import { CURSOR_AGENT_OFFSET_HEIGHT } from '../../dataset/constant/Cursor'
import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { ElementType } from '../../dataset/enum/Element'
import { MoveDirection } from '../../dataset/enum/Observer'
import { DeepRequired } from '../../interface/Common'
import { ICursorOption } from '../../interface/Cursor'
import { IEditorOption } from '../../interface/Editor'
import { IElement, IElementPosition } from '../../interface/Element'
import { findScrollContainer, nextTick } from '../../utils'
import { isMobile } from '../../utils/ua'
import { Draw } from '../draw/Draw'
import { CanvasEvent } from '../event/CanvasEvent'
import { Position } from '../position/Position'
import { CursorAgent } from './CursorAgent'

/** 光标墨迹盒：上下标用名义字号，避免 actualSize/垫高 metrics 把光标算矮、算飘 */
export function resolveCursorInkMetrics(payload: {
  element?: Pick<IElement, 'type' | 'size' | 'actualSize'> | null
  metrics: {
    height: number
    boundingBoxAscent: number
    boundingBoxDescent: number
  }
  defaultSize: number
  scale: number
}): { fontSize: number; inkAscent: number; inkDescent: number } {
  const { element, metrics, defaultSize, scale } = payload
  const isScript =
    element?.type === ElementType.SUPERSCRIPT ||
    element?.type === ElementType.SUBSCRIPT
  // 上下标绘制用 actualSize，光标高度仍跟正文名义字号一致
  const fontSize =
    ((isScript
      ? element?.size || defaultSize
      : element?.actualSize || element?.size || defaultSize) *
      scale) ||
    metrics.height ||
    defaultSize * scale
  if (isScript) {
    return {
      fontSize,
      inkAscent: fontSize * 0.8,
      inkDescent: fontSize * 0.2
    }
  }
  const rawAscent = metrics.boundingBoxAscent || 0
  const rawDescent =
    metrics.boundingBoxDescent < 0 ? 0 : metrics.boundingBoxDescent
  const inflated =
    metrics.height > fontSize * 1.15 || rawAscent > fontSize * 1.05
  return {
    fontSize,
    inkAscent: inflated ? fontSize * 0.8 : rawAscent || fontSize * 0.8,
    inkDescent: inflated ? fontSize * 0.2 : rawDescent
  }
}

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
  private hitLineStartIndex: number | undefined

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

  public getHitLineStartIndex() {
    return this.hitLineStartIndex
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

  public focus() {
    // 移动端只读模式禁用聚焦避免唤起输入法，web端允许聚焦避免事件无法捕获
    if (isMobile && this.draw.isReadonly()) return
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    // 光标不聚焦时重新定位
    if (document.activeElement !== agentCursorDom) {
      agentCursorDom.focus()
      agentCursorDom.setSelectionRange(0, 0)
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
    this.hitLineStartIndex = hitLineStartIndex
    if (hitLineStartIndex) {
      const positionList = this.position.getPositionList()
      cursorPosition = positionList[hitLineStartIndex]
    }
    const {
      metrics,
      coordinate: { leftTop, rightTop },
      ascent,
      pageNo,
      index: cursorIndex
    } = cursorPosition
    const zoneManager = this.draw.getZone()
    const curPageNo = zoneManager.isMainActive()
      ? pageNo
      : this.draw.getPageNo()
    const preY = curPageNo * (height + pageGap)
    // 光标高度与同行字号一致（text-engine 的 metrics.height 常为行盒，需回退到字号）
    const element = this.draw.getElementList()[cursorIndex]
    const { fontSize, inkAscent, inkDescent } = resolveCursorInkMetrics({
      element,
      metrics,
      defaultSize: this.options.defaultSize,
      scale
    })
    const textHeight = Math.max(inkAscent + inkDescent, fontSize * 0.5)
    // 略高于字身：上下各加约 1/8 字号（2px～6px）
    const pad = Math.min(Math.max(fontSize / 8, 2 * scale), 6 * scale)
    const cursorHeight = textHeight + pad * 2
    const defaultOffsetHeight = CURSOR_AGENT_OFFSET_HEIGHT * scale
    const agentCursorDom = this.cursorAgent.getAgentCursorDom()
    if (isFocus) {
      setTimeout(() => {
        this.focus()
      })
    }
    // 基线：leftTop + ascent；光标相对字身上下各外扩 pad。
    // 图片/公式的 position.ascent 是顶对齐偏移（row.ascent - height），不是行基线
    const isImageLike =
      element?.type === ElementType.IMAGE ||
      element?.type === ElementType.LATEX
    const baselineOffset = isImageLike ? ascent + metrics.height : ascent
    const cursorTop = leftTop[1] + baselineOffset - inkAscent - pad + preY
    // Host index = after this element. LTR trailing = rightTop; RTL trailing = leftTop.
    const isRtlRun = ((cursorPosition.bidiLevel ?? 0) & 1) === 1
    const cursorLeft = hitLineStartIndex
      ? isRtlRun
        ? rightTop[0]
        : leftTop[0]
      : isRtlRun
        ? leftTop[0]
        : rightTop[0]
    // Sync IME textarea direction with paragraph
    try {
      const adapter = this.draw.getLayoutHostAdapter()
      const elementList = this.draw.getElementList()
      const dir = adapter.resolveElementDirection(
        elementList,
        cursorPosition.index
      )
      this.cursorAgent.syncDirection(dir)
    } catch {
      /* adapter may be unavailable during destroy */
    }
    agentCursorDom.style.left = `${cursorLeft}px`
    agentCursorDom.style.top = `${
      cursorTop + cursorHeight - defaultOffsetHeight
    }px`
    // 模拟光标显示
    if (!isShow) {
      this.recoveryCursor()
      return
    }
    // 记录旧光标位置：用于光标移动到可视范围内
    const oldTop = this.cursorDom.style.top
    // 设置光标位置与颜色（options.cursor.color / width）
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
    // 移动到视野范围内（仅在聚焦时）
    if (isFocus) {
      nextTick(() => {
        // nexttick后执行 => 避免画布没有渲染完成造成残影
        this.moveCursorToVisible({
          cursorPosition: cursorPosition!,
          direction:
            parseInt(oldTop) > cursorTop ? MoveDirection.UP : MoveDirection.DOWN
        })
      })
    }
  }

  public recoveryCursor() {
    this.cursorDom.style.display = 'none'
    this._clearBlinkTimeout()
  }

  public moveCursorToVisible(payload: IMoveCursorToVisibleOption) {
    const { cursorPosition, direction } = payload
    if (!cursorPosition || !direction) return
    const zoneManager = this.draw.getZone()
    // 页眉/页脚 positionList 跨页共享，pageNo 不能代表光标实际所在页，用当前页
    const pageNo = zoneManager.isMainActive()
      ? cursorPosition.pageNo
      : this.draw.getPageNo()
    const {
      coordinate: { leftTop, leftBottom }
    } = cursorPosition
    // 查找滚动容器，如果是滚动容器是document，则限制范围为当前窗口
    const scrollContainer = findScrollContainer(this.container)
    const rect = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }
    const isDocumentScroll = scrollContainer === document.documentElement
    if (isDocumentScroll) {
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
    // 当前页面距离滚动容器顶部距离
    const prePageY =
      pageNo * (this.draw.getHeight() + this.draw.getPageGap()) +
      this.container.getBoundingClientRect().top
    // 向上移动时：以顶部距离为准，向下移动时：以底部位置为准
    const isUp = direction === MoveDirection.UP
    const x = leftBottom[0] + (isDocumentScroll ? 0 : rect.left)
    const y = isUp ? leftTop[1] + prePageY : leftBottom[1] + prePageY
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
