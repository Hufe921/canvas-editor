import { ElementType } from '../../../dataset/enum/Element'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const hyperlinkMenus: IRegisterContextMenu[] = [
  {
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
    i18nPath: 'contextmenu.hyperlink.edit',
    when: payload => {
      return (
        !payload.isReadonly &&
        payload.startElement?.type === ElementType.HYPERLINK
      )
    },
    callback: (command: Command, context: IContextMenuContext) => {
      const url = context.startElement?.url
      if (url) {
        command.executeEditHyperlink(url)
      }
    }
  }
]
