import { ZERO } from '../../../dataset/constant/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { EditorMode } from '../../../dataset/enum/Editor'
import type { DeepRequired } from '../../../interface/Common'
import type { IEditorOption } from '../../../interface/Editor'
import type { IElement } from '../../../interface/Element'
import type { IRenderContext } from '../../render/model/RenderContext'
import type { Draw } from '../Draw'

// 完整段落范围，endIndex 为开区间，不包含下一段的起始元素
export interface IParagraphDragBlock {
  startIndex: number
  endIndex: number
}

// 手柄命中区域及所属段落的垂直范围，用于悬浮检测和落点计算
export interface IParagraphDragHandle extends IParagraphDragBlock {
  x: number
  y: number
  width: number
  height: number
  paragraphTop: number
  paragraphBottom: number
}

// 保留当前段落的起始元素，并在下一段、列表项或标题开始前截断
export function getParagraphBlock(
  elementList: IElement[],
  startIndex: number
): IParagraphDragBlock | null {
  const startElement = elementList[startIndex]
  if (!startElement) return null
  const isLeadingZero = startElement.value === ZERO && !startElement.listWrap
  const contentStartIndex = isLeadingZero ? startIndex + 1 : startIndex
  let endIndex = elementList.length
  for (let i = contentStartIndex; i < elementList.length; i++) {
    const element = elementList[i]
    const preElement = elementList[i - 1]
    if (element.value === ZERO && !element.listWrap) {
      endIndex = i
      break
    }
    if (
      i > contentStartIndex &&
      (element.listId !== preElement?.listId ||
        element.titleId !== preElement?.titleId)
    ) {
      endIndex = i
      break
    }
  }
  return {
    startIndex,
    endIndex
  }
}

// 表格、Block 和 Area 具有独立布局，不按普通段落移动
export function isParagraphDraggable(elementList: IElement[]): boolean {
  return elementList.every(
    element =>
      !element.areaId &&
      element.type !== ElementType.TABLE &&
      element.type !== ElementType.BLOCK
  )
}

// 原地移动完整段落，返回新起始索引；落点位于原段落内时不移动
export function moveParagraphBlock(
  elementList: IElement[],
  source: IParagraphDragBlock,
  targetIndex: number
): number | null {
  const { startIndex, endIndex } = source
  if (
    startIndex < 0 ||
    endIndex <= startIndex ||
    endIndex > elementList.length ||
    targetIndex < 0 ||
    targetIndex > elementList.length ||
    (targetIndex >= startIndex && targetIndex <= endIndex)
  ) {
    return null
  }
  const block = elementList.slice(startIndex, endIndex)
  elementList.splice(startIndex, block.length)
  // 向后移动时，目标索引需扣除已经移除的源段落长度
  const insertIndex =
    targetIndex > startIndex ? targetIndex - block.length : targetIndex
  elementList.splice(insertIndex, 0, ...block)
  return insertIndex
}

export class ParagraphDragParticle {
  private readonly HANDLE_WIDTH = 10
  private readonly HANDLE_HEIGHT = 14
  private readonly HANDLE_RIGHT = 12
  private readonly HIT_PADDING = 4
  private readonly DOT_RADIUS = 1.25

  private draw: Draw
  private options: DeepRequired<IEditorOption>
  // 按页缓存手柄和段落范围，避免鼠标移动时重复扫描行列表
  private handleMap: Map<number, IParagraphDragHandle[]>
  private hoveredBlock: { pageNo: number; startIndex: number } | null

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.handleMap = new Map()
    this.hoveredBlock = null
  }

  public isEnabled(): boolean {
    const mode = this.draw.getMode()
    return (
      !this.options.paragraphDrag.disabled &&
      (mode === EditorMode.EDIT || mode === EditorMode.DESIGN)
    )
  }

  public getHandleList(pageNo: number): IParagraphDragHandle[] {
    return this.handleMap.get(pageNo) || []
  }

  public getHoveredHandle(pageNo: number): IParagraphDragHandle | null {
    if (this.hoveredBlock?.pageNo !== pageNo) return null
    return (
      this.getHandleList(pageNo).find(
        handle => handle.startIndex === this.hoveredBlock?.startIndex
      ) || null
    )
  }

  private getHitHandle(x: number, y: number, pageNo: number) {
    return this.getHandleList(pageNo).find(
      item =>
        x >= item.x &&
        x <= item.x + item.width &&
        y >= item.y &&
        y <= item.y + item.height
    )
  }

  public getHitParagraph(
    x: number,
    y: number,
    pageNo: number
  ): IParagraphDragBlock | null {
    if (!this.isEnabled()) return null
    const handle = this.getHitHandle(x, y, pageNo)
    if (!handle) return null
    return {
      startIndex: handle.startIndex,
      endIndex: handle.endIndex
    }
  }

  public clearHover(): boolean {
    if (!this.hoveredBlock) return false
    this.hoveredBlock = null
    return true
  }

  public updateHover(x: number, y: number, pageNo: number) {
    // 优先命中手柄，从正文移向手柄时可保持同一段落的悬浮状态
    const hitHandle = this.getHitHandle(x, y, pageNo)
    let hoveredHandle = hitHandle || null
    if (!hoveredHandle) {
      const { width, margins } = this.draw.getPageSize(pageNo)
      if (x >= margins[3] && x <= width - margins[1]) {
        hoveredHandle =
          this.getHandleList(pageNo).find(
            handle => y >= handle.paragraphTop && y <= handle.paragraphBottom
          ) || null
      }
    }
    const previous = this.hoveredBlock
    const next = hoveredHandle
      ? { pageNo, startIndex: hoveredHandle.startIndex }
      : null
    // 仅悬浮目标变化时需要重绘，避免每次 mousemove 都刷新页面
    const isChanged =
      previous?.pageNo !== next?.pageNo ||
      previous?.startIndex !== next?.startIndex
    this.hoveredBlock = next
    return {
      isChanged,
      isHit: !!hitHandle
    }
  }

  // 选择距离指针最近的段落，按垂直中点决定插入到段落前或后
  public getDropIndex(y: number, pageNo: number): number | null {
    const handleList = this.getHandleList(pageNo)
    if (!handleList.length) return null
    let target: IParagraphDragHandle | null = null
    let minDistance = Infinity
    for (const handle of handleList) {
      const { paragraphTop, paragraphBottom } = handle
      const distance =
        y < paragraphTop
          ? paragraphTop - y
          : y > paragraphBottom
            ? y - paragraphBottom
            : 0
      if (distance < minDistance) {
        minDistance = distance
        target = handle
      }
    }
    if (!target) return null
    return y > (target.paragraphTop + target.paragraphBottom) / 2
      ? target.endIndex
      : target.startIndex
  }

  private clear(pageNo: number) {
    this.handleMap.delete(pageNo)
    if (this.hoveredBlock?.pageNo === pageNo) {
      this.hoveredBlock = null
    }
  }

  public render(ctx: IRenderContext, pageNo: number) {
    if (!this.isEnabled()) {
      this.clear(pageNo)
      return
    }
    const { scale, paragraphDrag } = this.options
    const { margins } = this.draw.getPageSize(pageNo)
    const elementList = this.draw.getOriginalMainElementList()
    const positionList = this.draw.getPosition().getOriginalMainPositionList()
    const rowList = this.draw.getPageRowList()[pageNo] || []
    const handleList: IParagraphDragHandle[] = []
    const handleWidth = this.HANDLE_WIDTH * scale
    const handleHeight = this.HANDLE_HEIGHT * scale
    const hitPadding = this.HIT_PADDING * scale
    // 手柄位于正文左边距外，边距过小时保留最小页面间距
    const visualX = Math.max(
      4 * scale,
      margins[3] - (this.HANDLE_RIGHT + this.HANDLE_WIDTH) * scale
    )
    ctx.save()
    ctx.fillStyle = paragraphDrag.color
    // 行按文档顺序排列，一次遍历即可补全换行段落的垂直范围
    let activeHandle: IParagraphDragHandle | null = null
    for (const row of rowList) {
      const position = positionList[row.startIndex]
      if (!position) {
        activeHandle = null
        continue
      }
      const rowTop = position.coordinate.leftTop[1]
      if (
        activeHandle &&
        row.startIndex >= activeHandle.startIndex &&
        row.startIndex < activeHandle.endIndex
      ) {
        activeHandle.paragraphBottom = rowTop + row.height
      } else {
        activeHandle = null
      }
      const firstElement = row.elementList[0]
      if (!firstElement || row.tableFragment) continue
      // 只在段落首行创建手柄，列表续行的 ZERO 带有 listWrap
      const isParagraphFirstRow =
        row.startIndex === 0 ||
        (firstElement.value === ZERO && !firstElement.listWrap)
      if (!isParagraphFirstRow) continue
      const block = getParagraphBlock(elementList, row.startIndex)
      if (
        !block ||
        !isParagraphDraggable(
          elementList.slice(block.startIndex, block.endIndex)
        )
      ) {
        continue
      }
      // 相对首行内容垂直居中，段后间距不参与手柄定位
      const rowContentHeight = row.height - (row.spacingAfter || 0)
      const centerY = rowTop + rowContentHeight / 2
      const visualY = centerY - handleHeight / 2
      const handle: IParagraphDragHandle = {
        ...block,
        x: visualX - hitPadding,
        y: visualY - hitPadding,
        width: handleWidth + hitPadding * 2,
        height: handleHeight + hitPadding * 2,
        paragraphTop: rowTop,
        paragraphBottom: rowTop + row.height
      }
      handleList.push(handle)
      activeHandle = handle
      // 所有手柄均参与命中检测，但只绘制悬浮段落的手柄
      const isHovered =
        this.hoveredBlock?.pageNo === pageNo &&
        this.hoveredBlock.startIndex === block.startIndex
      if (!isHovered) continue
      const dotRadius = this.DOT_RADIUS * scale
      const dotGapX = 6 * scale
      const dotGapY = 5 * scale
      for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
        for (let colIndex = 0; colIndex < 2; colIndex++) {
          const x = visualX + dotRadius + colIndex * dotGapX
          const y = visualY + dotRadius + rowIndex * dotGapY
          ctx.beginPath()
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    ctx.restore()
    this.handleMap.set(pageNo, handleList)
  }
}
