import { IRowElement } from '../../../interface/Row'
import {Draw} from '../Draw'
import {IEditorOption} from '../../../interface/Editor'
import {DeepRequired} from '../../../interface/Common'
import {TrackType} from '../../../dataset/enum/Track'
import {IElement, IElementPosition} from '../../../interface/Element'
import {EDITOR_PREFIX} from '../../../dataset/constant/Editor'
import {trackTypeStr} from '../../../dataset/constant/Track'

export class TrackParticle {
  // 向上偏移字高的一半
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private container: HTMLDivElement
  private trackPopupElement: HTMLDivElement
  private trackInformationElement: HTMLDivElement
  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    const { tackPopupContainer, trackInfoContainer } = this.createTrackContainer()
    this.trackPopupElement = tackPopupContainer
    this.trackInformationElement = trackInfoContainer
  }

  private createTrackContainer() {
    const tackPopupContainer = document.createElement('div')
    tackPopupContainer.classList.add(`${EDITOR_PREFIX}-track-popup`)
    const trackInfoContainer = document.createElement('div')
    tackPopupContainer.append(trackInfoContainer)
    this.container.append(tackPopupContainer)
    return { tackPopupContainer, trackInfoContainer }
  }

  public showTrackInfo(element: IElement, position: IElementPosition) {
    const {
      coordinate: {
        leftTop: [left, top]
      },
      lineHeight
    } = position
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = this.draw.getPageNo() * (height + pageGap)
    // 位置
    this.trackPopupElement.style.display = 'block'
    this.trackPopupElement.style.left = `${left}px`
    this.trackPopupElement.style.top = `${top + preY + lineHeight}px`
    // 标签
    const trackInformation = element.track?.author + '于' + element.track?.date + trackTypeStr[element.trackType!]
    const textNode = document.createTextNode(trackInformation)
    this.trackInformationElement.append(textNode)
  }

  public clearTrackPopup() {
    this.trackInformationElement.innerHTML = ''
    this.trackPopupElement.style.display = 'none'
  }
  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const { insertColor, deleteColor} = this.options.trackStyle
    ctx.save()
    ctx.font = element.style
    ctx.fillStyle = element.trackType === TrackType.INSERT ? insertColor : deleteColor
    if(element.trackType === TrackType.DELETE) {
      element.strikeout = true
    } else if(element.trackType === TrackType.INSERT){
      element.underline = true
    }
    ctx.fillText(element.value, x, y)
    ctx.restore()
  }
}
