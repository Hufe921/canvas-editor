export interface IContextMenuContext {
  editorHasSelection: boolean;
  editorTextFocus: boolean;
  isInTable: boolean;
}

export interface IRegisterContextMenu {
  isSeparateLine?: boolean;
  icon?: string;
  name?: string;
  when?: (payload: IContextMenuContext) => boolean;
  callback?: Function;
  childMenus?: IRegisterContextMenu[]
}