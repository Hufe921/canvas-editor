import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorZone } from '../../dataset/enum/Editor'
import { throttle } from '../../utils'
import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'
import { Zone } from './Zone'

export class ZoneTip {
  private zone: Zone
  private i18n: I18n
  private container: HTMLDivElement
  private pageContainer: HTMLDivElement

  private isDisableMouseMove: boolean
  private tipContainer: HTMLDivElement
  private tipContent: HTMLSpanElement
  private currentMoveZone: EditorZone | undefined

  constructor(draw: Draw, zone: Zone) {
    this.zone = zone
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
        if (evt.target instanceof HTMLCanvasElement) {
          const mousemoveZone = this.zone.getZoneByY(evt.offsetY)
          this.currentMoveZone = mousemoveZone
          // 激活区域是正文，移动区域是页眉、页脚时绘制
          this._updateZoneTip(
            this.zone.getZone() === EditorZone.MAIN &&
              (mousemoveZone === EditorZone.HEADER ||
                mousemoveZone === EditorZone.FOOTER),
            evt.x,
            evt.y
          )
        } else {
          this._updateZoneTip(false)
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
