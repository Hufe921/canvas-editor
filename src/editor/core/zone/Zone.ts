import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorZone } from '../../dataset/enum/Editor'
import { IEditorOption } from '../../interface/Editor'
import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'

export class Zone {

  private readonly INDICATOR_TITLE_TRANSLATE = [20, 5]

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
    const [offsetX, offsetY] = this.INDICATOR_TITLE_TRANSLATE
    this.headerIndicatorContainer = document.createElement('div')
    this.headerIndicatorContainer.classList.add(`${EDITOR_PREFIX}-header-indicator`)
    const pageList = this.draw.getPageList()
    const margins = this.draw.getMargins()
    const innerWidth = this.draw.getInnerWidth()
    const pageHeight = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = pageHeight + pageGap
    const header = this.draw.getHeader()
    const headerHeight = header.getHeight()
    const headerTop = header.getHeaderTop()

    for (let p = 0; p < pageList.length; p++) {
      const startY = preY * p + headerTop
      const indicatorTitle = document.createElement('div')
      // 标题
      indicatorTitle.innerText = this.i18n.t('frame.header')
      indicatorTitle.style.top = `${startY + headerHeight}px`
      indicatorTitle.style.transform = `translate(${offsetX * scale}px, ${offsetY * scale}px) scale(${scale})`
      this.headerIndicatorContainer.append(indicatorTitle)

      // 上边线
      const lineTop = document.createElement('span')
      lineTop.classList.add(`${EDITOR_PREFIX}-header-indicator-border__top`)
      lineTop.style.top = `${startY}px`
      lineTop.style.width = `${innerWidth}px`
      lineTop.style.marginLeft = `${margins[3]}px`
      this.headerIndicatorContainer.append(lineTop)

      // 左边线
      const lineLeft = document.createElement('span')
      lineLeft.classList.add(`${EDITOR_PREFIX}-header-indicator-border__left`)
      lineLeft.style.top = `${startY}px`
      lineLeft.style.height = `${headerHeight}px`
      lineLeft.style.left = `${margins[3]}px`
      this.headerIndicatorContainer.append(lineLeft)

      // 下边线
      const lineBottom = document.createElement('span')
      lineBottom.classList.add(`${EDITOR_PREFIX}-header-indicator-border__bottom`)
      lineBottom.style.top = `${startY + headerHeight}px`
      this.headerIndicatorContainer.append(lineBottom)

      // 右边线
      const lineRight = document.createElement('span')
      lineRight.classList.add(`${EDITOR_PREFIX}-header-indicator-border__right`)
      lineRight.style.top = `${startY}px`
      lineRight.style.height = `${headerHeight}px`
      lineRight.style.left = `${margins[3] + innerWidth}px`
      this.headerIndicatorContainer.append(lineRight)
    }
    this.container.append(this.headerIndicatorContainer)
  }

  private _clearHeaderZoneIndicator() {
    this.headerIndicatorContainer?.remove()
    this.headerIndicatorContainer = null
  }
}