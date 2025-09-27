import { EDITOR_PREFIX } from '../../../../dataset/constant/Editor'
import { ElementType } from '../../../../dataset/enum/Element'
import { IRowElement } from '../../../../interface/Row'
import { Draw } from '../../Draw'
import { BaseBlock } from './modules/BaseBlock'

export class BlockParticle {
  private draw: Draw
  private container: HTMLDivElement
  private blockContainer: HTMLDivElement
  private blockMap: Map<string, BaseBlock>

  constructor(draw: Draw) {
    this.draw = draw
    this.container = draw.getContainer()
    this.blockMap = new Map()
    this.blockContainer = this._createBlockContainer()
    this.container.append(this.blockContainer)
  }

  private _createBlockContainer(): HTMLDivElement {
    const blockContainer = document.createElement('div')
    blockContainer.classList.add(`${EDITOR_PREFIX}-block-container`)
    return blockContainer
  }

  public getDraw(): Draw {
    return this.draw
  }

  public getBlockContainer(): HTMLDivElement {
    return this.blockContainer
  }

  public render(
    ctx: CanvasRenderingContext2D,
    pageNo: number,
    element: IRowElement,
    x: number,
    y: number
  ) {
    // 优先使用缓存block
    const id = element.id!
    let cacheBlock = this.blockMap.get(id)
    if (!cacheBlock) {
      cacheBlock = new BaseBlock(this, element)
      cacheBlock.render()
      this.blockMap.set(id, cacheBlock)
    }
    // 打印模式截图，其他模式更新位置
    if (this.draw.isPrintMode()) {
      cacheBlock.snapshot(ctx, x, y)
    } else {
      cacheBlock.setClientRects(pageNo, x, y)
    }
  }

  public clear() {
    if (!this.blockMap.size) return
    const elementList = this.draw.getOriginalMainElementList()
    const blockElementIds: string[] = []
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      if (element.type === ElementType.BLOCK) {
        blockElementIds.push(element.id!)
      }
    }
    this.blockMap.forEach(block => {
      const id = block.getBlockElement().id!
      if (!blockElementIds.includes(id)) {
        block.remove()
        this.blockMap.delete(id)
      }
    })
  }
}
