import { ElementType } from '../../../dataset/enum/Element'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const controlMenus: IRegisterContextMenu[] = [
  {
    i18nPath: 'contextmenu.control.delete',
    when: payload => {
      return (
        !payload.isReadonly &&
        !payload.editorHasSelection &&
        payload.startElement?.type === ElementType.CONTROL
      )
    },
    callback: (command: Command) => {
      command.executeRemoveControl()
    }
  }
]
