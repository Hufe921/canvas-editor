import { IEditorOption } from "../../../interface/Editor"
import { Position } from "../../position/Position"
import { Draw } from "../Draw"

export class Search {

  private draw: Draw
  private options: Required<IEditorOption>
  private position: Position

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.position = draw.getPosition()
  }

  public render(ctx: CanvasRenderingContext2D, pageIndex: number) {
    const searchMatch = this.draw.getSearchMatch()
    if (!searchMatch || !searchMatch.length) return
    const searchMatchList = searchMatch.flat()
    const positionList = this.position.getOriginalPositionList()
    ctx.save()
    ctx.globalAlpha = this.options.searchMatchAlpha
    ctx.fillStyle = this.options.searchMatchColor
    searchMatchList.forEach(s => {
      const position = positionList[s]
      if (!position) return
      const { coordinate: { leftTop, leftBottom, rightTop }, pageNo } = position
      if (pageNo !== pageIndex) return
      const x = leftTop[0]
      const y = leftTop[1]
      const width = rightTop[0] - leftTop[0]
      const height = leftBottom[1] - leftTop[1]
      ctx.fillRect(x, y, width, height)
    })
    ctx.restore()
  }

}