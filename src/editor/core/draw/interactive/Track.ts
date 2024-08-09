import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import {IElement, IElementFillRect, IElementPosition} from '../../../interface/Element'
import { Draw } from '../Draw'
import {EDITOR_PREFIX} from '../../../dataset/constant/Editor'
import {trackTypeStr} from '../../../dataset/constant/Track'

export class Track {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private insertRectMap: Map<string, IElementFillRect>
  private deleteRectMap: Map<string, IElementFillRect>
  private container: HTMLDivElement
  private trackPopupElement: HTMLDivElement
  private trackInformationElement: HTMLDivElement


  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.insertRectMap = new Map()
    this.deleteRectMap = new Map()
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

  public clearFillInfo() {
    this.insertRectMap.clear()
    this.deleteRectMap.clear()
  }

  public recordInsertRectInfo(
    element: IElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const trackId = element.trackId
    if (!trackId) return
      const insRect = this.insertRectMap.get(trackId)
      if (!insRect) {
        this.insertRectMap.set(trackId, {
          x,
          y,
          width,
          height
        })
      } else {
        insRect.width += width
      }

  }

  public recordDeleteRectInfo(
    element: IElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const trackId = element.trackId
    if (!trackId) return
    const delRect = this.deleteRectMap.get(trackId)
    if (!delRect) {
      this.deleteRectMap.set(trackId, {
        x,
        y,
        width,
        height
      })
    } else {
      delRect.width += width
    }

  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.insertRectMap.size && !this.deleteRectMap) return

    const {
      trackStyle: { deleteColor, insertColor }
    } = this.options
    ctx.save()
    this.insertRectMap.forEach((fillRect) => {
      const { x, y, width,  } = fillRect
      ctx.strokeStyle = insertColor
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x+width, y)
      ctx.stroke()
      ctx.restore()

    })
    this.deleteRectMap.forEach((fillRect) => {
      const { x, y, width } = fillRect
      const adjustY = y + 0.5
      ctx.strokeStyle = deleteColor
      ctx.beginPath()
      ctx.moveTo(x, adjustY)
      ctx.lineTo(x + width, adjustY)
      ctx.stroke()
      ctx.restore()
    })
    this.clearFillInfo()
  }
}
