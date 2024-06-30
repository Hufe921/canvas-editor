import { INTERNAL_CONTEXT_MENU_KEY } from '../../../dataset/constant/ContextMenu'
import { EditorMode } from '../../../dataset/enum/Editor'
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
        !!payload.startElement?.controlId &&
        payload.options.mode !== EditorMode.FORM
      )
    },
    callback: (command: Command) => {
      command.executeRemoveControl()
    }
  }
]
