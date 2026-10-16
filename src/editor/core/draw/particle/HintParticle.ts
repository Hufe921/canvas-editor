import { EDITOR_PREFIX } from '../../../dataset/constant/Editor'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { ITd } from '../../../interface/table/Td'
import { Draw } from '../Draw'

// 单次 hover 命中解析结果
interface IHintHit {
  hint: string
  position?: IElementPosition
  td?: ITd
}

// 悬浮提示粒子：鼠标移入配置了 hint 的元素（含控件/表格单元格等）时展示提示浮窗
export class HintParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private container: HTMLDivElement
  private hintPopupContainer: HTMLDivElement
  private hintDom: HTMLSpanElement
  private lastHoverKey: string

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    this.lastHoverKey = ''
    // 初始化时创建提示浮窗 DOM
    const { popup, hintDom } = this._createHintPopupDom()
    this.hintPopupContainer = popup
    this.hintDom = hintDom
  }

  // 创建提示浮窗容器
  private _createHintPopupDom() {
    const popup = document.createElement('div')
    popup.classList.add(`${EDITOR_PREFIX}-hint-popup`)
    const hintDom = document.createElement('span')
    hintDom.classList.add(`${EDITOR_PREFIX}-hint-popup__text`)
    popup.append(hintDom)
    this.container.append(popup)
    return { popup, hintDom }
  }

  // 解析元素提示文案
  private _getElementHint(element: IElement | undefined): string {
    return element?.hint || ''
  }

  // 根据命中结果计算并展示提示浮窗
  public drawHintPopup(hit: IHintHit, pageNo: number) {
    const position = hit.position
    const td = hit.td
    if (!position && !td) {
      this.clearHintPopup()
      return
    }
    // 定位锚点：优先元素位置，缺省退回单元格左上角
    let left: number
    let top: number
    let lineHeight: number
    if (position) {
      const {
        coordinate: {
          leftTop: [l, t]
        },
        lineHeight: lh
      } = position
      left = l
      top = t
      lineHeight = lh
    } else {
      left = td!.x || 0
      top = td!.y || 0
      lineHeight = td!.rowList?.[0]?.height || 0
    }
    const { x: pageLeft, y: preY } = this.draw.getPageOffset(pageNo)
    // 应用配置样式
    const { backgroundColor, color, fontSize, maxWidth } = this.options.hint
    // 先填充内容并应用样式，确保后续能测量到真实尺寸
    this.hintDom.innerText = hit.hint
    this.hintPopupContainer.style.background = backgroundColor
    this.hintPopupContainer.style.color = color
    this.hintPopupContainer.style.fontSize = `${fontSize}px`
    this.hintPopupContainer.style.maxWidth = `${maxWidth}px`
    // 默认展示在元素正下方，与文字保持间距
    const GAP = 6
    let popupLeft = left + pageLeft
    let popupTop = top + preY + lineHeight + GAP
    this.hintPopupContainer.style.left = `${popupLeft}px`
    this.hintPopupContainer.style.top = `${popupTop}px`
    this.hintPopupContainer.style.display = 'block'
    // 自适应：测量渲染后真实尺寸，避免超出可视区域
    const popupRect = this.hintPopupContainer.getBoundingClientRect()
    const { height: popupHeight } = popupRect
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    // 水平方向：右侧越界时向左平移，保证完整可见
    if (popupRect.right > viewportWidth) {
      popupLeft = Math.max(0, popupLeft - (popupRect.right - viewportWidth))
    }
    // 垂直方向：下方越界且元素上方空间足够则翻转到上方展示
    if (popupRect.bottom > viewportHeight) {
      const flipTop = top + preY - popupHeight - GAP
      if (flipTop >= 0) {
        popupTop = flipTop
      } else {
        // 上方也不够：贴可视区底边，尽量多展示
        popupTop = Math.max(0, popupTop - (popupRect.bottom - viewportHeight))
      }
    }
    this.hintPopupContainer.style.left = `${popupLeft}px`
    this.hintPopupContainer.style.top = `${popupTop}px`
  }

  // 隐藏提示浮窗并重置 hover 索引
  public clearHintPopup() {
    this.hintPopupContainer.style.display = 'none'
    this.lastHoverKey = ''
  }

  // 根据鼠标位置显示/隐藏提示浮窗
  public handleMouseMove(evt: MouseEvent) {
    // 总开关：禁用时不展示提示
    if (this.options.hint.disabled) return
    const target = evt.target as HTMLDivElement
    const pageIndex = target.dataset.index
    if (pageIndex) {
      this.draw.setPageNo(Number(pageIndex))
    }
    const position = this.draw.getPosition()
    const positionResult = position.getPositionByXY({
      x: evt.offsetX,
      y: evt.offsetY
    })
    if (!~positionResult.index) {
      this.clearHintPopup()
      return
    }
    const elementList = this.draw.getOriginalElementList()
    const hitElement: IElement | undefined = elementList[positionResult.index]
    let element: IElement | undefined = hitElement
    let elementPosition: IElementPosition | undefined =
      position.getOriginalPositionList()[positionResult.index]
    let td: ITd | undefined
    let hoverKey = String(positionResult.index)
    if (positionResult.isTable && positionResult.tdValueIndex !== undefined) {
      td =
        position.getTableTdByContext(elementList, {
          ...positionResult,
          isTable: true
        }) || undefined
      element = td?.value[positionResult.tdValueIndex]
      elementPosition = td?.positionList?.[positionResult.tdValueIndex]
      hoverKey = `${positionResult.tablePath
        ?.map(item => `${item.index}:${item.trIndex}:${item.tdIndex}`)
        .join('/')}:${positionResult.tdValueIndex}`
    }
    // 解析提示文案：元素级 > 单元格级 > 表格级（越具体越优先）
    let hint = this._getElementHint(element)
    if (!hint && td?.hint) hint = td.hint
    if (!hint && hitElement?.hint) hint = hitElement.hint
    // 无提示文案，或既无元素位置也无单元格可锚定则清除
    if (!hint || (!element && !td)) {
      this.clearHintPopup()
      return
    }
    if (this.lastHoverKey === hoverKey) return
    this.drawHintPopup(
      { hint, position: elementPosition, td },
      this.draw.getPageNo()
    )
    this.lastHoverKey = hoverKey
  }
}
