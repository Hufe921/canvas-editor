export interface IContextMenuContext {
  editorHasSelection: boolean;
  editorTextFocus: boolean;
  isInTable: boolean;
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