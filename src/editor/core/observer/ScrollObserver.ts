import { debounce } from '../../utils'
import { Draw } from '../draw/Draw'

export interface IElementVisibleInfo {
  intersectionHeight: number
}

export interface IPageVisibleInfo {
  intersectionPageNo: number
  visiblePageNoList: number[]
}

export class ScrollObserver {
  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
    // 监听滚轮
    setTimeout(() => {
      if (!window.scrollY) {
        this._observer()
      }
    })
    this._addEvent()
  }

  private _addEvent() {
    document.addEventListener('scroll', this._observer)
  }

  public removeEvent() {
    document.removeEventListener('scroll', this._observer)
  }

  public getElementVisibleInfo(element: Element): IElementVisibleInfo {
    const rect = element.getBoundingClientRect()
    const viewHeight = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight
    )
    const visibleHeight =
      Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0)
    return {
      intersectionHeight: visibleHeight > 0 ? visibleHeight : 0
    }
  }

  public getPageVisibleInfo(): IPageVisibleInfo {
    const pageList = this.draw.getPageList()
    const visiblePageNoList: number[] = []
    let intersectionPageNo = 0
    let intersectionMaxHeight = 0
    for (let i = 0; i < pageList.length; i++) {
      const curPage = pageList[i]
      const { intersectionHeight } = this.getElementVisibleInfo(curPage)
      // 之前页存在交叉 && 当前页不交叉则后续均不交叉，结束循环
      if (intersectionMaxHeight && !intersectionHeight) break
      if (intersectionHeight) {
        visiblePageNoList.push(i)
      }
      if (intersectionHeight > intersectionMaxHeight) {
        intersectionMaxHeight = intersectionHeight
        intersectionPageNo = i
      }
    }
    return {
      intersectionPageNo,
      visiblePageNoList
    }
  }

  private _observer = debounce(() => {
    const { intersectionPageNo, visiblePageNoList } = this.getPageVisibleInfo()
    this.draw.setIntersectionPageNo(intersectionPageNo)
    this.draw.setVisiblePageNoList(visiblePageNoList)
  }, 150)
}
