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
  isDivider?: boolean;
  icon?: string;
  name?: string;
  shortCut?: string;
  when?: (payload: IContextMenuContext) => boolean;
  callback?: Function;
  childMenus?: IRegisterContextMenu[];
}