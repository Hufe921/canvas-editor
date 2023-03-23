import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorZone } from '../../dataset/enum/Editor'
import { IEditorOption } from '../../interface/Editor'
import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'

export class Zone {
  private draw: Draw
  private options: Required<IEditorOption>
  private i18n: I18n
  private container: HTMLDivElement

  private currentZone: EditorZone
  private headerIndicatorContainer: HTMLDivElement | null

  constructor(draw: Draw) {
    this.draw = draw
    this.i18n = draw.getI18n()
    this.options = draw.getOptions()
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
      this.drawHeaderZoneIndicator()
    } else {
      this._clearHeaderZoneIndicator()
    }
  }

  public drawHeaderZoneIndicator() {
    this._clearHeaderZoneIndicator()
    const { scale } = this.options
    this.headerIndicatorContainer = document.createElement('div')
    this.headerIndicatorContainer.classList.add(`${EDITOR_PREFIX}-header-indicator`)
    const pageList = this.draw.getPageList()
    const pageHeight = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = pageHeight + pageGap
    const headerHeight = this.draw.getHeader().getHeight()
    const headerTop = (this.options.header?.top ?? 0) * scale
    const margins = this.draw.getMargins()

    for (let p = 0; p < pageList.length; p++) {
      const indicator = document.createElement('div')
      indicator.innerText = this.i18n.t('global.header')
      document.body.appendChild(indicator)
      const indicatorStyle = getComputedStyle(indicator)
      indicator.style.top = `${preY * p + headerHeight + parseFloat(indicatorStyle.height) * scale}px`
      this.headerIndicatorContainer.append(indicator)

      // 绘制上，左，下，右边线

      // 上边线
      const lineTop = document.createElement('span')
      lineTop.classList.add(`${EDITOR_PREFIX}-header-indicator-border__top`)
      lineTop.style.top = `${(preY * p + headerTop)}px`
      lineTop.style.width = this.draw.getInnerWidth() + 'px'
      lineTop.style.marginLeft = margins[3] + 'px'
      this.headerIndicatorContainer.append(lineTop)

      // 左边线
      const lineLeft = document.createElement('span')
      lineLeft.classList.add(`${EDITOR_PREFIX}-header-indicator-border__left`)
      lineLeft.style.top = `${(preY * p + headerTop)}px`
      lineLeft.style.height = `${headerHeight}px`
      lineLeft.style.left = margins[3] + 'px'
      this.headerIndicatorContainer.append(lineLeft)

      // 下边线
      const lineBottom = document.createElement('span')
      lineBottom.classList.add(`${EDITOR_PREFIX}-header-indicator-border__bottom`)
      lineBottom.style.top = `${(preY * p + headerHeight + headerTop)}px`
      this.headerIndicatorContainer.append(lineBottom)

      // 右边线
      const lineRight = document.createElement('span')
      lineRight.classList.add(`${EDITOR_PREFIX}-header-indicator-border__right`)
      lineRight.style.top = `${(preY * p + headerTop)}px`
      lineRight.style.height = `${headerHeight}px`
      lineRight.style.left = `${(margins[3] + this.draw.getInnerWidth())}px`
      this.headerIndicatorContainer.append(lineRight)
    }
    this.container.append(this.headerIndicatorContainer)
  }

  private _clearHeaderZoneIndicator() {
    this.headerIndicatorContainer?.remove()
  }
}
