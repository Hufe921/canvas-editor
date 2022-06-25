import { ElementType } from '../../../dataset/enum/Element'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const imageMenus: IRegisterContextMenu[] = [
  {
    name: '另存为图片',
    icon: 'image',
    when: (payload) => {
      return !payload.editorHasSelection && payload.startElement?.type === ElementType.IMAGE
    },
    callback: (command: Command) => {
      command.executeSaveAsImageElement()
    }
  },
]