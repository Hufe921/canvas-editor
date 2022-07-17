import { ElementType } from '../../../dataset/enum/Element'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const hyperlinkMenus: IRegisterContextMenu[] = [
  {
    name: '删除链接',
    when: (payload) => {
      return payload.startElement?.type === ElementType.HYPERLINK
    },
    callback: (command: Command) => {
      command.executeDeleteHyperlink()
    }
  },
  {
    name: '取消链接',
    when: (payload) => {
      return payload.startElement?.type === ElementType.HYPERLINK
    },
    callback: (command: Command) => {
      command.executeCancelHyperlink()
    }
  }
]