import {INTERNAL_CONTEXT_MENU_KEY} from '../../../dataset/constant/ContextMenu'
import {IContextMenuContext, IRegisterContextMenu} from '../../../interface/contextmenu/ContextMenu'
import {Command} from '../../command/Command'
import {AreaMode} from '../../../dataset/enum/Area'

const {
  AREA: { DELETE }
} = INTERNAL_CONTEXT_MENU_KEY

export const areaMenus: IRegisterContextMenu[] = [
  {
    key: DELETE,
    i18nPath: 'contextmenu.area.delete',
    when: payload => {
      return (
        !payload.isReadonly &&
        !!payload.startElement?.areaId &&
        !!payload.endElement?.areaId &&
        payload.startElement.areaId === payload.endElement.areaId &&
        payload.startElement?.area?.mode !== AreaMode.READONLY
      )
    },
    callback: (command: Command,context: IContextMenuContext) => {
      const areaId = context.startElement?.areaId
      if(!areaId) return
      command.executeRemoveAreaById(areaId)
    }
  }
]
