import { Command } from '../../core/command/Command'
import { IElement } from '../Element'

export interface IContextMenuContext {
  startElement: IElement | null;
  endElement: IElement | null;
  isReadonly: boolean;
  editorHasSelection: boolean;
  editorTextFocus: boolean;
  isInTable: boolean;
  isCrossRowCol: boolean;
}

export interface IRegisterContextMenu {
  id?: string;
  isDivider?: boolean;
  icon?: string;
  name?: string;
  shortCut?: string;
  when?: (payload: IContextMenuContext) => boolean;
  callback?: (command: Command, context: IContextMenuContext) => any;
  childMenus?: IRegisterContextMenu[];
}
