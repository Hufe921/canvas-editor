import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorZone } from '../../dataset/enum/Editor'
import { throttle } from '../../utils'
import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'
import { Position } from '../position/Position'

export class ZoneTip {
  private position: Position
  private i18n: I18n
  private container: HTMLDivElement
  private pageContainer: HTMLDivElement

  private isDisableMouseMove: boolean
  private tipContainer: HTMLDivElement
  private tipContent: HTMLSpanElement
  private currentMoveZone: EditorZone | undefined

  constructor(draw: Draw) {
    this.position = draw.getPosition()
    this.i18n = draw.getI18n()
    this.container = draw.getContainer()
    this.pageContainer = draw.getPageContainer()

    const { tipContainer, tipContent } = this._drawZoneTip()
    this.tipContainer = tipContainer
    this.tipContent = tipContent
    this.isDisableMouseMove = true
    this.currentMoveZone = EditorZone.MAIN

    this._watchMouseMoveZoneChange()
  }

  private _watchMouseMoveZoneChange() {
    this.pageContainer.addEventListener(
      'mousemove',
      throttle((evt: MouseEvent) => {
        if (this.isDisableMouseMove) return
        const pageNo = Number((<HTMLCanvasElement>evt.target).dataset.index)
        if (Number.isNaN(pageNo)) {
          this._updateZoneTip(false)
        } else {
          const positionInfo = this.position.getPositionByXY({
            x: evt.offsetX,
            y: evt.offsetY,
            pageNo
          })
          this.currentMoveZone = positionInfo.zone
          this._updateZoneTip(
            positionInfo.zone === EditorZone.HEADER ||
              positionInfo.zone === EditorZone.FOOTER,
            evt.x,
            evt.y
          )
        }
      }, 250)
    )
    // mouseenter后mousemove有效，避免因节流导致的mouseleave后继续执行逻辑
    this.pageContainer.addEventListener('mouseenter', () => {
      this.isDisableMouseMove = false
    })
    this.pageContainer.addEventListener('mouseleave', () => {
      this.isDisableMouseMove = true
      this._updateZoneTip(false)
    })
  }

  private _drawZoneTip() {
    const tipContainer = document.createElement('div')
    tipContainer.classList.add(`${EDITOR_PREFIX}-zone-tip`)
    const tipContent = document.createElement('span')
    tipContainer.append(tipContent)
    this.container.append(tipContainer)
    return {
      tipContainer,
      tipContent
    }
  }

  private _updateZoneTip(visible: boolean, left?: number, top?: number) {
    if (visible) {
      this.tipContainer.classList.add('show')
      this.tipContainer.style.left = `${left}px`
      this.tipContainer.style.top = `${top}px`
      this.tipContent.innerText = this.i18n.t(
        `zone.${
          this.currentMoveZone === EditorZone.HEADER ? 'headerTip' : 'footerTip'
        }`
      )
    } else {
      this.tipContainer.classList.remove('show')
    }
  }
}
