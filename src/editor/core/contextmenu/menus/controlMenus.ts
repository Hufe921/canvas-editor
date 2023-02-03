import { ElementType } from '../../../dataset/enum/Element'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const controlMenus: IRegisterContextMenu[] = [
  {
    id: 'removeControl',
    name: '删除控件',
    when: (payload) => {
      return !payload.editorHasSelection && payload.startElement?.type === ElementType.CONTROL
    },
    callback: (command: Command) => {
      command.executeRemoveControl()
    }
  }
]
