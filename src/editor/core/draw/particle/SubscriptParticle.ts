import { IRowElement } from '../../../interface/Row'

export class SubscriptParticle {
  // 向下偏移字高的一半
  public getOffsetY(element: IRowElement): number {
    return element.metrics.height / 2
  }
}
