import { IRegisterContextMenu } from '../../interface/contextmenu/ContextMenu'
import { IRegisterShortcut } from '../../interface/shortcut/Shortcut'
import { ContextMenu } from '../contextmenu/ContextMenu'
import { Shortcut } from '../shortcut/Shortcut'

interface IRegisterPayload {
  contextMenu: ContextMenu;
  shortcut: Shortcut;
}

export class Register {

  public contextMenuList: (payload: IRegisterContextMenu[]) => void
  public shortcutList: (payload: IRegisterShortcut[]) => void
  public getContextMenuList: () => IRegisterContextMenu[]

  constructor(payload: IRegisterPayload) {
    const { contextMenu, shortcut } = payload
    this.contextMenuList = contextMenu.registerContextMenuList.bind(contextMenu)
    this.shortcutList = shortcut.registerShortcutList.bind(shortcut)
    this.getContextMenuList = contextMenu.getContextMenuList.bind(contextMenu)
  }

}
