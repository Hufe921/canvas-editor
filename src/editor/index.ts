import './assets/css/index.css'
import { IEditorOption, IEditorResult } from './interface/Editor'
import { IElement } from './interface/Element'
import { Draw } from './core/draw/Draw'
import { Command } from './core/command/Command'
import { CommandAdapt } from './core/command/CommandAdapt'
import { Listener } from './core/listener/Listener'
import { RowFlex } from './dataset/enum/Row'
import { ElementType } from './dataset/enum/Element'
import { formatElementList } from './utils/element'
import { Register } from './core/register/Register'
import { globalMenus } from './core/contextmenu/menus/GlobalMenus'
import { ContextMenu } from './core/contextmenu/ContextMenu'
import { tableMenus } from './core/contextmenu/menus/tableMenus'
import { IContextMenuContext, IRegisterContextMenu } from './interface/contextmenu/ContextMenu'
import { EditorComponent } from './dataset/enum/Editor'
import { EDITOR_COMPONENT } from './dataset/constant/Editor'
import { IHeader } from './interface/Header'

export default class Editor {

  public command: Command
  public listener: Listener
  public register: Register

  constructor(container: HTMLDivElement, elementList: IElement[], options: IEditorOption = {}) {
    const headerOptions: Required<IHeader> = {
      data: '',
      color: '#AAAAAA',
      size: 14,
      font: 'Yahei',
      ...options.header
    }
    const editorOptions: Required<IEditorOption> = {
      defaultType: 'TEXT',
      defaultFont: 'Yahei',
      defaultSize: 16,
      defaultRowMargin: 1,
      defaultBasicRowMarginHeight: 8,
      width: 794,
      height: 1123,
      scale: 1,
      pageGap: 20,
      pageNumberBottom: 60,
      pageNumberSize: 12,
      pageNumberFont: 'Yahei',
      underlineColor: '#000000',
      strikeoutColor: '#FF0000',
      rangeAlpha: 0.6,
      rangeColor: '#AECBFA',
      rangeMinWidth: 5,
      searchMatchAlpha: 0.6,
      searchMatchColor: '#FFFF00',
      highlightAlpha: 0.6,
      resizerColor: '#4182D9',
      resizerSize: 5,
      marginIndicatorSize: 35,
      marginIndicatorColor: '#BABABA',
      margins: [100, 120, 100, 120],
      tdPadding: 5,
      defaultTdHeight: 40,
      defaultHyperlinkColor: '#0000FF',
      headerTop: 50,
      ...options,
      header: headerOptions
    }
    formatElementList(elementList)
    // 监听
    this.listener = new Listener()
    // 启动
    const draw = new Draw(container, editorOptions, elementList, this.listener)
    // 命令
    this.command = new Command(new CommandAdapt(draw))
    // 菜单
    const contextMenu = new ContextMenu(draw, this.command)
    // 注册
    this.register = new Register({
      contextMenu
    })
    this.register.contextMenuList(globalMenus)
    this.register.contextMenuList(tableMenus)
  }

}

// 对外对象
export {
  Editor,
  RowFlex,
  ElementType,
  EditorComponent,
  EDITOR_COMPONENT
}

// 对外类型
export type {
  IElement,
  IEditorOption,
  IEditorResult,
  IContextMenuContext,
  IRegisterContextMenu
}