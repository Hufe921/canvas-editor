import { IRowElement } from '../../../../../interface/Row'

export class VideoBlock {
  private element: IRowElement

  constructor(element: IRowElement) {
    this.element = element
  }

  public render(blockItemContainer: HTMLDivElement) {
    const block = this.element.block!
    const video = document.createElement('video')
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.objectFit = 'contain'
    video.src = block.videoBlock?.src || ''
    video.controls = true
    video.crossOrigin = 'anonymous'
    blockItemContainer.append(video)
  }
}
