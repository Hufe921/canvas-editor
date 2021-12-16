import { IContextMenuContext, IRegisterContextMenu } from "../../interface/contextmenu/ContextMenu"
import { Draw } from "../draw/Draw"
import { Position } from "../position/Position"
import { RangeManager } from "../range/RangeManager"

export class ContextMenu {

  private range: RangeManager
  private position: Position
  private contextMenus: IRegisterContextMenu[]

  constructor(draw: Draw) {
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.contextMenus = []
    // 接管菜单权限
    document.addEventListener('contextmenu', this._proxyContextMenuEvent.bind(this))
  }


  private _proxyContextMenuEvent(evt: MouseEvent) {
    const context = this._getContext()
    let renderList: IRegisterContextMenu[] = []
    for (let c = 0; c < this.contextMenus.length; c++) {
      const menu = this.contextMenus[c]
      console.log('menu: ', menu);
      if (menu.isSeparateLine) {
        renderList.push(menu)
      } else {
        const isMatch = menu.when?.(context)
        if (isMatch) {
          renderList.push(menu)
        }
      }
    }
    if (renderList.length) {
      this._render(renderList)
    }
    evt.preventDefault()
  }

  private _getContext(): IContextMenuContext {
    const { startIndex, endIndex } = this.range.getRange()
    // 是否存在焦点
    const editorTextFocus = startIndex !== 0 || endIndex !== 0
    // 是否存在选区
    const editorHasSelection = editorTextFocus && startIndex !== endIndex
    // 是否在表格内
    const positionContext = this.position.getPositionContext()
    const isInTable = positionContext.isTable
    return { editorHasSelection, editorTextFocus, isInTable }
  }

  private _render(payload: IRegisterContextMenu[]) {
    console.log('payload: ', payload)
  }

  public registerContextMenus(payload: IRegisterContextMenu[]) {
    this.contextMenus.push(...payload)
  }


  public dispose() {

  }

}
