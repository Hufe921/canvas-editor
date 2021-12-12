import { EditorContext } from "../../../dataset/enum/Editor"
import { IEditorOption } from "../../../interface/Editor"
import { IElementPosition } from "../../../interface/Element"
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
    const searchMatchList = this.draw.getSearchMatch()
    if (!searchMatchList || !searchMatchList.length) return
    const { searchMatchAlpha, searchMatchColor } = this.options
    const positionList = this.position.getOriginalPositionList()
    const elementList = this.draw.getOriginalElementList()
    ctx.save()
    ctx.globalAlpha = searchMatchAlpha
    ctx.fillStyle = searchMatchColor
    for (let s = 0; s < searchMatchList.length; s++) {
      const searchMatch = searchMatchList[s]
      let position: IElementPosition | null = null
      if (searchMatch.type === EditorContext.TABLE) {
        const { tableIndex, trIndex, tdIndex, index } = searchMatch
        position = elementList[tableIndex!]?.trList![trIndex!].tdList[tdIndex!]!?.positionList![index]
      } else {
        position = positionList[searchMatch.index]
      }
      if (!position) continue
      const { coordinate: { leftTop, leftBottom, rightTop }, pageNo } = position
      if (pageNo !== pageIndex) continue
      const x = leftTop[0]
      const y = leftTop[1]
      const width = rightTop[0] - leftTop[0]
      const height = leftBottom[1] - leftTop[1]
      ctx.fillRect(x, y, width, height)
    }
    ctx.restore()
  }

}