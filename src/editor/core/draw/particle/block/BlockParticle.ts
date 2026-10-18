import type { IElement, IElementMetrics } from '../../../../interface/Element'
import { isElementLayoutHidden } from '../../../../utils/element'
import { EDITOR_PREFIX } from '../../../../dataset/constant/Editor'
import { BlockType } from '../../../../dataset/enum/Block'
import { ElementType } from '../../../../dataset/enum/Element'
import { IIframeInfo } from '../../../../interface/Block'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { loadImage } from '../../../../utils'
import { Draw } from '../../Draw'
import { BaseBlock } from './modules/BaseBlock'

export class BlockParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private container: HTMLDivElement
  private blockContainer: HTMLDivElement
  private blockMap: Map<string, BaseBlock>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
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
    element: IElement,
    x: number,
    y: number,
    metrics: IElementMetrics
  ) {
    // 优先使用缓存block
    const id = element.id!
    let cacheBlock = this.blockMap.get(id)
    if (cacheBlock && cacheBlock.getBlockElement() !== element) {
      cacheBlock.remove()
      this.blockMap.delete(id)
      cacheBlock = undefined
    }
    if (!cacheBlock) {
      cacheBlock = new BaseBlock(this, element, metrics)
      cacheBlock.render()
      this.blockMap.set(id, cacheBlock)
    }
    cacheBlock.setMetrics(metrics)
    // 打印模式截图，其他模式更新位置
    if (this.draw.isPrintMode()) {
      cacheBlock.snapshot(ctx, pageNo, x, y)
    } else {
      cacheBlock.setClientRects(pageNo, x, y)
    }
    // 更新block状态
    cacheBlock.setStatus()
  }

  public clear() {
    if (!this.blockMap.size) return
    const blockElementIds = new Set<string>()
    const visit = (elements: IElement[]) => {
      for (const element of elements) {
        if (
          isElementLayoutHidden(element, {
            isDesignMode: this.draw.isDesignMode(),
            isAreaHideDisabled: this.draw.isAreaHideDisabled(),
            isTraceHidden: el => this.draw.getTraceParticle().isTraceHidden(el)
          })
        )
          continue
        if (element.type === ElementType.BLOCK) blockElementIds.add(element.id!)
        for (const row of element.trList || [])
          for (const cell of row.tdList) visit(cell.value)
      }
    }
    visit(this.draw.getOriginalMainElementList())
    visit(this.draw.getHeaderElementList())
    visit(this.draw.getFooterElementList())
    this.blockMap.forEach(block => {
      const id = block.getBlockElement().id!
      if (!blockElementIds.has(id)) {
        block.remove()
        this.blockMap.delete(id)
      }
    })
  }

  public update() {
    this.blockMap.forEach(baseBlock => {
      const element = baseBlock.getBlockElement()
      // 更新iframe srcdoc
      if (
        element.block?.type === BlockType.IFRAME &&
        element.block.iframeBlock?.srcdoc
      ) {
        const iframe = baseBlock.getIFrameBlock?.()?.getIframe?.()
        if (iframe?.contentDocument) {
          element.block.iframeBlock.srcdoc =
            iframe.contentDocument.documentElement.outerHTML
        }
      }
    })
  }

  public async drawIframeToPage(
    pageList: HTMLCanvasElement[],
    snapDomFunction: (iframe: HTMLIFrameElement) => Promise<string>
  ) {
    const tasks: Promise<void>[] = []
    this.blockMap.forEach(cacheBlock => {
      if (cacheBlock.getBlockElement().block?.type !== BlockType.IFRAME) return
      const positionInfo = cacheBlock.getPositionInfo()
      if (!positionInfo) return
      const iframe = cacheBlock.getIFrameBlock()?.getIframe()
      if (!iframe) return
      const { pageNo, x, y } = positionInfo
      const ctx = pageList[pageNo]?.getContext('2d')
      if (!ctx) return
      const { width, height } = cacheBlock.getMetrics()
      tasks.push(
        snapDomFunction(iframe)
          .then(base64 => loadImage(base64))
          .then(img => ctx.drawImage(img, x, y, width, height))
      )
    })
    await Promise.allSettled(tasks)
  }

  public pickIframeInfo(): IIframeInfo[][] {
    const result: IIframeInfo[][] = []
    const { scale } = this.options
    this.blockMap.forEach(cacheBlock => {
      const element = cacheBlock.getBlockElement()

      if (
        !element.block?.iframeBlock ||
        element.block.type !== BlockType.IFRAME
      ) {
        return
      }

      // 获取位置信息
      const positionInfo = cacheBlock.getPositionInfo()
      if (!positionInfo) return

      const { pageNo, x, y } = positionInfo
      if (!result[pageNo]) {
        result[pageNo] = []
      }

      result[pageNo].push({
        x,
        y,
        width: cacheBlock.getMetrics().width / scale,
        height: cacheBlock.getMetrics().height / scale,
        src: element.block.iframeBlock.src,
        srcdoc: element.block.iframeBlock.srcdoc
      })
    })

    return result
  }
}
