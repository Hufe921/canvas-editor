import { ElementStyleKey } from '../../dataset/enum/ElementStyle'
import { IElement, IElementPosition } from '../../interface/Element'
import { ICurrentPosition, IPositionContext } from '../../interface/Position'
import { Draw } from '../draw/Draw'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { threeClick } from '../../utils'
import { IRange } from '../../interface/Range'
import { mousedown } from './handlers/mousedown'
import { mouseup } from './handlers/mouseup'
import { mouseleave } from './handlers/mouseleave'
import { mousemove } from './handlers/mousemove'
import { keydown } from './handlers/keydown'
import { input } from './handlers/input'
import { cut } from './handlers/cut'
import { copy } from './handlers/copy'
import { drop } from './handlers/drop'
import click from './handlers/click'
import composition from './handlers/composition'
import drag from './handlers/drag'
import { isIOS } from '../../utils/ua'

export interface ICompositionInfo {
  elementList: IElement[]
  startIndex: number
  endIndex: number
  value: string
}

export class CanvasEvent {
  public isAllowSelection: boolean
  public isComposing: boolean
  public compositionInfo: ICompositionInfo | null

  public isAllowDrag: boolean
  public isAllowDrop: boolean
  public cacheRange: IRange | null
  public cacheElementList: IElement[] | null
  public cachePositionList: IElementPosition[] | null
  public cachePositionContext: IPositionContext | null
  public mouseDownStartPosition: ICurrentPosition | null

  private draw: Draw
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private range: RangeManager
  private position: Position

  constructor(draw: Draw) {
    this.draw = draw
    this.pageContainer = draw.getPageContainer()
    this.pageList = draw.getPageList()
    this.range = this.draw.getRange()
    this.position = this.draw.getPosition()

    this.isAllowSelection = false
    this.isComposing = false
    this.compositionInfo = null
    this.isAllowDrag = false
    this.isAllowDrop = false
    this.cacheRange = null
    this.cacheElementList = null
    this.cachePositionList = null
    this.cachePositionContext = null
    this.mouseDownStartPosition = null
  }

  public getDraw(): Draw {
    return this.draw
  }

  public register() {
    this.pageContainer.addEventListener('click', this.click.bind(this))
    this.pageContainer.addEventListener('mousedown', this.mousedown.bind(this))
    this.pageContainer.addEventListener('mouseup', this.mouseup.bind(this))
    this.pageContainer.addEventListener(
      'mouseleave',
      this.mouseleave.bind(this)
    )
    this.pageContainer.addEventListener('mousemove', this.mousemove.bind(this))
    this.pageContainer.addEventListener('dblclick', this.dblclick.bind(this))
    this.pageContainer.addEventListener('dragover', this.dragover.bind(this))
    this.pageContainer.addEventListener('drop', this.drop.bind(this))
    threeClick(this.pageContainer, this.threeClick.bind(this))
  }

  public setIsAllowSelection(payload: boolean) {
    this.isAllowSelection = payload
    if (!payload) {
      this.applyPainterStyle()
    }
  }

  public setIsAllowDrag(payload: boolean) {
    this.isAllowDrag = payload
    this.isAllowDrop = payload
  }

  public clearPainterStyle() {
    this.pageList.forEach(p => {
      p.style.cursor = 'text'
    })
    this.draw.setPainterStyle(null)
  }

  public applyPainterStyle() {
    const painterStyle = this.draw.getPainterStyle()
    if (!painterStyle) return
    const selection = this.range.getSelection()
    if (!selection) return
    const painterStyleKeys = Object.keys(painterStyle)
    selection.forEach(s => {
      painterStyleKeys.forEach(pKey => {
        const key = pKey as keyof typeof ElementStyleKey
        s[key] = painterStyle[key] as any
      })
    })
    this.draw.render({ isSetCursor: false })
    // 清除格式刷
    const painterOptions = this.draw.getPainterOptions()
    if (!painterOptions || !painterOptions.isDblclick) {
      this.clearPainterStyle()
    }
  }

  public selectAll() {
    const position = this.position.getPositionList()
    this.range.setRange(0, position.length - 1)
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isCompute: false
    })
  }

  public mousemove(evt: MouseEvent) {
    mousemove(evt, this)
  }

  public mousedown(evt: MouseEvent) {
    mousedown(evt, this)
  }

  public click() {
    // IOS系统限制非用户主动触发事件的键盘弹出
    if (isIOS && !this.draw.isReadonly()) {
      this.draw.getCursor().getAgentDom().focus()
    }
  }

  public mouseup(evt: MouseEvent) {
    mouseup(evt, this)
  }

  public mouseleave(evt: MouseEvent) {
    mouseleave(evt, this)
  }

  public keydown(evt: KeyboardEvent) {
    keydown(evt, this)
  }

  public dblclick(evt: MouseEvent) {
    click.dblclick(this, evt)
  }

  public threeClick() {
    click.threeClick(this)
  }

  public input(data: string) {
    input(data, this)
  }

  public cut() {
    cut(this)
  }

  public copy() {
    copy(this)
  }

  public compositionstart() {
    composition.compositionstart(this)
  }

  public compositionend(evt: CompositionEvent) {
    composition.compositionend(this, evt)
  }

  public drop(evt: DragEvent) {
    drop(evt, this)
  }

  public dragover(evt: DragEvent | MouseEvent) {
    drag.dragover(evt, this)
  }
}
