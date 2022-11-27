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
    blockContainer.classList.add('block-container')
    return blockContainer
  }

  public getDraw(): Draw {
    return this.draw
  }

  public getBlockContainer(): HTMLDivElement {
    return this.blockContainer
  }

  public render(pageNo: number, element: IRowElement, x: number, y: number) {
    const id = element.id!
    const cacheBlock = this.blockMap.get(id)
    if (cacheBlock) {
      cacheBlock.setClientRects(pageNo, x, y)
    } else {
      const newBlock = new BaseBlock(this, element)
      newBlock.render()
      newBlock.setClientRects(pageNo, x, y)
      this.blockMap.set(id, newBlock)
    }
  }

}