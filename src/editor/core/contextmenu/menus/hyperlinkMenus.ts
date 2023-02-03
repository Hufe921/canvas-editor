import { ElementType } from '../../../dataset/enum/Element'
import { IContextMenuContext, IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const hyperlinkMenus: IRegisterContextMenu[] = [
  {
    id: 'deleteHyperlink',
    name: '删除链接',
    when: (payload) => {
      return payload.startElement?.type === ElementType.HYPERLINK
    },
    callback: (command: Command) => {
      command.executeDeleteHyperlink()
    }
  },
  {
    id: 'cancelHyperlink',
    name: '取消链接',
    when: (payload) => {
      return payload.startElement?.type === ElementType.HYPERLINK
    },
    callback: (command: Command) => {
      command.executeCancelHyperlink()
    }
  },
  {
    id: 'editHyperlink',
    name: '编辑链接',
    when: (payload) => {
      return payload.startElement?.type === ElementType.HYPERLINK
    },
    callback: (command: Command, context: IContextMenuContext) => {
      console.log(hyperlinkMenus[2].name)
      const url = window.prompt(hyperlinkMenus[2].name, context.startElement?.url)
      if (url) {
        command.executeEditHyperlink(url)
      }
    }
  }
]
