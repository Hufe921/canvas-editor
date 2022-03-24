import { IEditorOption } from '../../interface/Editor'
import { debounce } from '../../utils'
import { Draw } from '../draw/Draw'

export class ScrollObserver {

  private draw: Draw
  private options: Required<IEditorOption>
  private pageContainer: HTMLDivElement
  private pageHeight: number

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.pageContainer = draw.getPageContainer()
    const { height, pageGap } = this.options
    this.pageHeight = height + pageGap
    // 监听滚轮
    setTimeout(() => {
      if (!window.scrollY) {
        this._observer()
      }
    })
    document.addEventListener('scroll', debounce(this._observer.bind(this), 150))
  }

  private _observer() {
    const rect = this.pageContainer.getBoundingClientRect()
    const top = Math.abs(rect.top)
    const bottom = top + window.innerHeight
    const pageList = this.draw.getPageList()
    // 计算显示页
    const visiblePageNoList: number[] = []
    let intersectionPageNo = 0
    let intersectionMaxHeight = 0
    for (let i = 0; i < pageList.length; i++) {
      const curTop = i * this.pageHeight
      const curBottom = (i + 1) * this.pageHeight
      if (curTop > bottom) break
      if (curBottom < top) continue
      // 计算交叉高度
      let intersectionHeight = 0
      if (curTop < top && curBottom < bottom) {
        intersectionHeight = curBottom - top
      } else if (curTop > top && curBottom > bottom) {
        intersectionHeight = bottom - curTop
      } else {
        intersectionHeight = rect.height
      }
      if (intersectionHeight > intersectionMaxHeight) {
        intersectionMaxHeight = intersectionHeight
        intersectionPageNo = i
      }
      visiblePageNoList.push(i)
    }
    this.draw.setIntersectionPageNo(intersectionPageNo)
    this.draw.setVisiblePageNoList(visiblePageNoList)
  }

}