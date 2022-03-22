import { IRegisterContextMenu } from '../../interface/contextmenu/ContextMenu'
import { ContextMenu } from '../contextmenu/ContextMenu'

interface IRegisterPayload {
  contextMenu: ContextMenu
}

export class Register {

  public contextMenuList: (payload: IRegisterContextMenu[]) => void

  constructor(payload: IRegisterPayload) {
    const { contextMenu } = payload
    this.contextMenuList = contextMenu.registerContextMenuList.bind(contextMenu)
  }

}