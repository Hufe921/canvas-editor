import {IRegisterContextMenu} from '../../../interface/contextmenu/ContextMenu'
import {Command} from '../../command/Command'

export const reviewMenus: IRegisterContextMenu[] = [
  {
    name: '隐藏痕迹',
    when: ()=>true,
    callback: (command: Command) => {
      command.execHideTracks(true)
    }
  },
  {
    name: '显示痕迹',
    when: ()=>true,
    callback: (command: Command) => {
      command.execHideTracks(false)
    }
  }
]