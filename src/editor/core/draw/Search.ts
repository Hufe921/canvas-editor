import { IEditorOption } from "../../interface/Editor"
import { Position } from "../position/Position"
import { Draw } from "./Draw"

export class Search {

  private ctx: CanvasRenderingContext2D
  private options: Required<IEditorOption>
  private draw: Draw
  private position: Position

  constructor(ctx: CanvasRenderingContext2D, options: Required<IEditorOption>, draw: Draw) {
    this.ctx = ctx
    this.options = options
    this.draw = draw
    this.position = draw.getPosition()
  }

  render() {
    const searchMatch = this.draw.getSearchMathch()
    if (!searchMatch || !searchMatch.length) return
    const searchMatchList = searchMatch.flat()
    const positionList = this.position.getPositionList()
    this.ctx.save()
    this.ctx.globalAlpha = this.options.searchMatchAlpha
    this.ctx.fillStyle = this.options.searchMatchColor
    searchMatchList.forEach(s => {
      const position = positionList[s]
      const { leftTop, leftBottom, rightTop } = position.coordinate
      const x = leftTop[0]
      const y = leftTop[1]
      const width = rightTop[0] - leftTop[0]
      const height = leftBottom[1] - leftTop[1]
      this.ctx.fillRect(x, y, width, height)
    })
    this.ctx.restore()
  }

}