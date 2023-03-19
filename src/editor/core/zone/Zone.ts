import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorZone } from '../../dataset/enum/Editor'
import { Draw } from '../draw/Draw'

export class Zone {

  private draw: Draw
  private container: HTMLDivElement

  private currentZone: EditorZone
  private headerIndicatorContainer: HTMLDivElement | null

  constructor(draw: Draw) {
    this.draw = draw
    this.container = draw.getContainer()
    this.currentZone = EditorZone.MAIN
    this.headerIndicatorContainer = null
  }

  public isHeaderActive(): boolean {
    return this.getZone() === EditorZone.HEADER
  }

  public isMainActive(): boolean {
    return this.getZone() === EditorZone.MAIN
  }

  public getZone(): EditorZone {
    return this.currentZone
  }

  public setZone(payload: EditorZone) {
    if (this.currentZone === payload) return
    this.currentZone = payload
    this.draw.getRange().clearRange()
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isCompute: false
    })
    // 页眉指示器
    if (this.isHeaderActive()) {
      this._drawHeaderZoneIndicator()
    } else {
      this._clearHeaderZoneIndicator()
    }
  }

  private _drawHeaderZoneIndicator() {
    this.headerIndicatorContainer = document.createElement('div')
    this.headerIndicatorContainer.classList.add(`${EDITOR_PREFIX}-header-indicator`)
    const pageList = this.draw.getPageList()
    const pageHeight = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = pageHeight + pageGap
    for (let p = 0; p < pageList.length; p++) {
      const indicator = document.createElement('div')
      indicator.innerText = `编辑页眉`
      indicator.style.top = `${preY * p}px`
      this.headerIndicatorContainer.append(indicator)
    }
    this.container.append(this.headerIndicatorContainer)
  }

  private _clearHeaderZoneIndicator() {
    this.headerIndicatorContainer?.remove()
  }

}