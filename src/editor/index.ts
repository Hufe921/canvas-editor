import './assets/css/index.css'
import { IEditorData, IEditorOption, IEditorResult } from './interface/Editor'
import { IElement } from './interface/Element'
import { Draw } from './core/draw/Draw'
import { Command } from './core/command/Command'
import { CommandAdapt } from './core/command/CommandAdapt'
import { Listener } from './core/listener/Listener'
import { RowFlex } from './dataset/enum/Row'
import { ElementType } from './dataset/enum/Element'
import { formatElementList } from './utils/element'
import { Register } from './core/register/Register'
import { ContextMenu } from './core/contextmenu/ContextMenu'
import { IContextMenuContext, IRegisterContextMenu } from './interface/contextmenu/ContextMenu'
import { EditorComponent, EditorZone, EditorMode, PageMode, PaperDirection } from './dataset/enum/Editor'
import { EDITOR_COMPONENT } from './dataset/constant/Editor'
import { IHeader } from './interface/Header'
import { IWatermark } from './interface/Watermark'
import { defaultHeaderOption } from './dataset/constant/Header'
import { defaultWatermarkOption } from './dataset/constant/Watermark'
import { ControlType, ImageDisplay } from './dataset/enum/Control'
import { defaultControlOption } from './dataset/constant/Control'
import { IControlOption } from './interface/Control'
import { ICheckboxOption } from './interface/Checkbox'
import { defaultCheckboxOption } from './dataset/constant/Checkbox'
import { DeepRequired } from './interface/Common'
import { INavigateInfo } from './core/draw/interactive/Search'
import { Shortcut } from './core/shortcut/Shortcut'
import { KeyMap } from './dataset/enum/KeyMap'
import { BlockType } from './dataset/enum/Block'
import { IBlock } from './interface/Block'
import { ILang } from './interface/i18n/I18n'
import { ICursorOption } from './interface/Cursor'
import { defaultCursorOption } from './dataset/constant/Cursor'
import { IPageNumber } from './interface/PageNumber'
import { defaultPageNumberOption } from './dataset/constant/PageNumber'
import { VerticalAlign } from './dataset/enum/VerticalAlign'
import { TableBorder } from './dataset/enum/table/Table'
import { IFooter } from './interface/Footer'
import { defaultFooterOption } from './dataset/constant/Footer'
import { MaxHeightRatio, NumberType } from './dataset/enum/Common'
import { ITitleOption } from './interface/Title'
import { defaultTitleOption } from './dataset/constant/Title'
import { TitleLevel } from './dataset/enum/Title'
import { ListStyle, ListType } from './dataset/enum/List'

export default class Editor {

  public command: Command
  public listener: Listener
  public register: Register
  public destroy: Function

  constructor(container: HTMLDivElement, data: IEditorData | IElement[], options: IEditorOption = {}) {
    const headerOptions: Required<IHeader> = {
      ...defaultHeaderOption,
      ...options.header
    }
    const footerOptions: Required<IFooter> = {
      ...defaultFooterOption,
      ...options.footer
    }
    const pageNumberOptions: Required<IPageNumber> = {
      ...defaultPageNumberOption,
      ...options.pageNumber
    }
    const waterMarkOptions: Required<IWatermark> = {
      ...defaultWatermarkOption,
      ...options.watermark
    }
    const controlOptions: Required<IControlOption> = {
      ...defaultControlOption,
      ...options.control
    }
    const checkboxOptions: Required<ICheckboxOption> = {
      ...defaultCheckboxOption,
      ...options.checkbox
    }
    const cursorOptions: Required<ICursorOption> = {
      ...defaultCursorOption,
      ...options.cursor
    }
    const titleOptions: Required<ITitleOption> = {
      ...defaultTitleOption,
      ...options.title
    }

    const editorOptions: DeepRequired<IEditorOption> = {
      mode: EditorMode.EDIT,
      defaultType: 'TEXT',
      defaultFont: 'Yahei',
      defaultSize: 16,
      minSize: 5,
      maxSize: 72,
      defaultRowMargin: 1,
      defaultBasicRowMarginHeight: 8,
      defaultTabWidth: 32,
      width: 794,
      height: 1123,
      scale: 1,
      pageGap: 20,
      underlineColor: '#000000',
      strikeoutColor: '#FF0000',
      rangeAlpha: 0.6,
      rangeColor: '#AECBFA',
      rangeMinWidth: 5,
      searchMatchAlpha: 0.6,
      searchMatchColor: '#FFFF00',
      searchNavigateMatchColor: '#AAD280',
      highlightAlpha: 0.6,
      resizerColor: '#4182D9',
      resizerSize: 5,
      marginIndicatorSize: 35,
      marginIndicatorColor: '#BABABA',
      margins: [100, 120, 100, 120],
      pageMode: PageMode.PAGING,
      tdPadding: 5,
      defaultTrMinHeight: 40,
      defaultHyperlinkColor: '#0000FF',
      paperDirection: PaperDirection.VERTICAL,
      inactiveAlpha: 0.6,
      ...options,
      header: headerOptions,
      footer: footerOptions,
      pageNumber: pageNumberOptions,
      watermark: waterMarkOptions,
      control: controlOptions,
      checkbox: checkboxOptions,
      cursor: cursorOptions,
      title: titleOptions
    }
    // 数据处理
    let headerElementList: IElement[] = []
    let mainElementList: IElement[] = []
    let footerElementList: IElement[] = []
    if (Array.isArray(data)) {
      mainElementList = data
    } else {
      headerElementList = data.header || []
      mainElementList = data.main
      footerElementList = data.footer || []
    }
    [headerElementList, mainElementList, footerElementList]
      .forEach(elementList => {
        formatElementList(elementList, {
          editorOptions
        })
      })
    // 监听
    this.listener = new Listener()
    // 启动
    const draw = new Draw(
      container,
      editorOptions,
      {
        header: headerElementList,
        main: mainElementList,
        footer: footerElementList
      },
      this.listener
    )
    // 命令
    this.command = new Command(new CommandAdapt(draw))
    // 菜单
    const contextMenu = new ContextMenu(draw, this.command)
    // 快捷键
    const shortcut = new Shortcut(draw, this.command)
    // 注册
    this.register = new Register({
      contextMenu,
      shortcut,
      i18n: draw.getI18n()
    })
    // 注册销毁方法
    this.destroy = () => {
      draw.destroy()
      shortcut.removeEvent()
      contextMenu.removeEvent()
    }
  }

}

// 对外对象
export {
  Editor,
  RowFlex,
  VerticalAlign,
  EditorZone,
  EditorMode,
  ElementType,
  ControlType,
  EditorComponent,
  EDITOR_COMPONENT,
  PageMode,
  ImageDisplay,
  Command,
  KeyMap,
  BlockType,
  PaperDirection,
  TableBorder,
  MaxHeightRatio,
  NumberType,
  TitleLevel,
  ListType,
  ListStyle
}

// 对外类型
export type {
  IElement,
  IEditorData,
  IEditorOption,
  IEditorResult,
  IContextMenuContext,
  IRegisterContextMenu,
  IWatermark,
  INavigateInfo,
  IBlock,
  ILang
}