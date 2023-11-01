import { INTERNAL_CONTEXT_MENU_KEY } from '../../../dataset/constant/ContextMenu'
import { ElementType } from '../../../dataset/enum/Element'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'
const {
  HYPERLINK: { DELETE, CANCEL, EDIT }
} = INTERNAL_CONTEXT_MENU_KEY

export const hyperlinkMenus: IRegisterContextMenu[] = [
  {
    key: DELETE,
    i18nPath: 'contextmenu.hyperlink.delete',
    when: payload => {
      return (
        !payload.isReadonly &&
        payload.startElement?.type === ElementType.HYPERLINK
      )
    },
    callback: (command: Command) => {
      command.executeDeleteHyperlink()
    }
  },
  {
    key: CANCEL,
    i18nPath: 'contextmenu.hyperlink.cancel',
    when: payload => {
      return (
        !payload.isReadonly &&
        payload.startElement?.type === ElementType.HYPERLINK
      )
    },
    callback: (command: Command) => {
      command.executeCancelHyperlink()
    }
  },
  {
    key: EDIT,
    i18nPath: 'contextmenu.hyperlink.edit',
    when: payload => {
      return (
        !payload.isReadonly &&
        payload.startElement?.type === ElementType.HYPERLINK
      )
    },
    callback: (command: Command, context: IContextMenuContext) => {
      const url = window.prompt('编辑链接', context.startElement?.url)
      if (url) {
        command.executeEditHyperlink(url)
      }
    }
  }
]
