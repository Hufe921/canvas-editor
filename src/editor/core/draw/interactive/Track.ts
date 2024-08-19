import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import {IElement, IElementFillRect, IElementPosition} from '../../../interface/Element'
import { Draw } from '../Draw'
import {EDITOR_PREFIX} from '../../../dataset/constant/Editor'
import {trackTypeStr} from '../../../dataset/constant/Track'
import {ElementType} from '../../../dataset/enum/Element'
import {omitObject} from '../../../utils'
import {LIST_CONTEXT_ATTR, TITLE_CONTEXT_ATTR} from '../../../dataset/constant/Element'
import {zipElementList} from '../../../utils/element'

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
    const { trackPopupContainer, trackInfoContainer } = this.createTrackContainer()
    this.trackPopupElement = trackPopupContainer
    this.trackInformationElement = trackInfoContainer
  }
  public getList(): IElement[] {
    const trackElementList: IElement[] = []
    function getTrackElementList(elementList: IElement[]) {
      for (let e = 0; e < elementList.length; e++) {
        const element = elementList[e]
        if (element.type === ElementType.TABLE) {
          const trList = element.trList!
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              const tdElement = td.value
              getTrackElementList(tdElement)
            }
          }
        }
        if (element.trackId) {
          // 移除控件所在标题及列表上下文信息
          const controlElement = omitObject(element, [
            ...TITLE_CONTEXT_ATTR,
            ...LIST_CONTEXT_ATTR
          ])
          trackElementList.push(controlElement)
        }
      }
    }
    const data = [
      this.draw.getHeader().getElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooter().getElementList()
    ]
    for (const elementList of data) {
      getTrackElementList(elementList)
    }
    return zipElementList(trackElementList)
  }

  private createTrackContainer() {
    const trackPopupContainer = document.createElement('div')
    trackPopupContainer.classList.add(`${EDITOR_PREFIX}-track-popup`)
    const trackInfoContainer = document.createElement('div')
    trackPopupContainer.append(trackInfoContainer)
    this.container.append(trackPopupContainer)
    return { trackPopupContainer, trackInfoContainer }
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
    this.trackPopupElement.style.top = `${top + preY - lineHeight}px`
    // 标签
    const trackInformation = element.track?.author + '(' + element.track?.date + ')' + trackTypeStr[element.trackType!]
    const textNode = document.createTextNode(trackInformation)
    this.trackInformationElement.append(textNode)
  }

  public clearTrackPopup() {
    this.trackInformationElement.innerHTML = ''
    this.trackPopupElement.style.display = 'none'
  }

  public clearRectInfo() {
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
    })
    this.deleteRectMap.forEach((fillRect) => {
      const { x, y, width } = fillRect
      const adjustY = y + 0.5
      ctx.strokeStyle = deleteColor
      ctx.beginPath()
      ctx.moveTo(x, adjustY)
      ctx.lineTo(x + width, adjustY)
      ctx.stroke()
    })
    ctx.restore()
    this.clearRectInfo()
  }
}
