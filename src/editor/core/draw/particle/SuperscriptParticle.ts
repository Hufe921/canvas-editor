import { IRowElement } from '../../../interface/Row'

export class SuperscriptParticle {
  // 向上偏移字高的一半
  public getOffsetY(element: IRowElement): number {
    return -element.metrics.height / 2
  }
}
