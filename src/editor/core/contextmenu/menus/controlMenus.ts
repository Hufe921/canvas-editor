import { INTERNAL_CONTEXT_MENU_KEY } from '../../../dataset/constant/ContextMenu'
import { ElementType } from '../../../dataset/enum/Element'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'
const {
  CONTROL: { DELETE }
} = INTERNAL_CONTEXT_MENU_KEY

export const controlMenus: IRegisterContextMenu[] = [
  {
    key: DELETE,
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
