import './assets/css/index.css'
import { IEditorData, IEditorOption, IEditorResult } from './interface/Editor'
import { IElement } from './interface/Element'
import { Draw } from './core/draw/Draw'
import { Command } from './core/command/Command'
import { CommandAdapt } from './core/command/CommandAdapt'
import { Listener } from './core/listener/Listener'
import { RowFlex } from './dataset/enum/Row'
import { ImageDisplay } from './dataset/enum/Common'
import { ElementType } from './dataset/enum/Element'
import { formatElementList } from './utils/element'
import { Register } from './core/register/Register'
import { ContextMenu } from './core/contextmenu/ContextMenu'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from './interface/contextmenu/ContextMenu'
import {
  EditorComponent,
  EditorZone,
  EditorMode,
  PageMode,
  PaperDirection,
  WordBreak
} from './dataset/enum/Editor'
import { EDITOR_COMPONENT } from './dataset/constant/Editor'
import { IHeader } from './interface/Header'
import { IWatermark } from './interface/Watermark'
import { defaultHeaderOption } from './dataset/constant/Header'
import { defaultWatermarkOption } from './dataset/constant/Watermark'
import { ControlIndentation, ControlType } from './dataset/enum/Control'
import { defaultControlOption } from './dataset/constant/Control'
import { IControlOption } from './interface/Control'
import { ICheckboxOption } from './interface/Checkbox'
import { IRadioOption } from './interface/Radio'
import { defaultCheckboxOption } from './dataset/constant/Checkbox'
import { defaultRadioOption } from './dataset/constant/Radio'
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
import { TableBorder, TdBorder, TdSlash } from './dataset/enum/table/Table'
import { IFooter } from './interface/Footer'
import { defaultFooterOption } from './dataset/constant/Footer'
import { MaxHeightRatio, NumberType } from './dataset/enum/Common'
import { ITitleOption } from './interface/Title'
import { defaultTitleOption } from './dataset/constant/Title'
import { TitleLevel } from './dataset/enum/Title'
import { ListStyle, ListType } from './dataset/enum/List'
import { ICatalog, ICatalogItem } from './interface/Catalog'
import { IPlaceholder } from './interface/Placeholder'
import { defaultPlaceholderOption } from './dataset/constant/Placeholder'
import { Plugin } from './core/plugin/Plugin'
import { UsePlugin } from './interface/Plugin'
import { EventBus } from './core/event/eventbus/EventBus'
import { EventBusMap } from './interface/EventBus'
import { IGroup } from './interface/Group'
import { defaultGroupOption } from './dataset/constant/Group'
import { IRangeStyle } from './interface/Listener'
import { Override } from './core/override/Override'
import { defaultPageBreakOption } from './dataset/constant/PageBreak'
import { IPageBreak } from './interface/PageBreak'
import { LETTER_CLASS } from './dataset/constant/Common'
import { INTERNAL_CONTEXT_MENU_KEY } from './dataset/constant/ContextMenu'
import { IRange } from './interface/Range'
import { deepClone, splitText } from './utils'
import { IZoneOption } from './interface/Zone'
import { defaultZoneOption } from './dataset/constant/Zone'
import { IBackgroundOption } from './interface/Background'
import { defaultBackground } from './dataset/constant/Background'
import { BackgroundRepeat, BackgroundSize } from './dataset/enum/Background'
import { TextDecorationStyle } from './dataset/enum/Text'
import { ILineBreakOption } from './interface/LineBreak'
import { defaultLineBreak } from './dataset/constant/LineBreak'
import { ISeparatorOption } from './interface/Separator'
import { defaultSeparatorOption } from './dataset/constant/Separator'
import { ITableOption } from './interface/table/Table'
import { defaultTableOption } from './dataset/constant/Table'

export default class Editor {
  public command: Command
  public listener: Listener
  public eventBus: EventBus<EventBusMap>
  public override: Override
  public register: Register
  public destroy: () => void
  public use: UsePlugin

  constructor(
    container: HTMLDivElement,
    data: IEditorData | IElement[],
    options: IEditorOption = {}
  ) {
    const tableOptions: Required<ITableOption> = {
      ...defaultTableOption,
      ...options.table
    }
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
    const radioOptions: Required<IRadioOption> = {
      ...defaultRadioOption,
      ...options.radio
    }
    const cursorOptions: Required<ICursorOption> = {
      ...defaultCursorOption,
      ...options.cursor
    }
    const titleOptions: Required<ITitleOption> = {
      ...defaultTitleOption,
      ...options.title
    }
    const placeholderOptions: Required<IPlaceholder> = {
      ...defaultPlaceholderOption,
      ...options.placeholder
    }
    const groupOptions: Required<IGroup> = {
      ...defaultGroupOption,
      ...options.group
    }
    const pageBreakOptions: Required<IPageBreak> = {
      ...defaultPageBreakOption,
      ...options.pageBreak
    }
    const zoneOptions: Required<IZoneOption> = {
      ...defaultZoneOption,
      ...options.zone
    }
    const backgroundOptions: Required<IBackgroundOption> = {
      ...defaultBackground,
      ...options.background
    }
    const lineBreakOptions: Required<ILineBreakOption> = {
      ...defaultLineBreak,
      ...options.lineBreak
    }
    const separatorOptions: Required<ISeparatorOption> = {
      ...defaultSeparatorOption,
      ...options.separator
    }

    const editorOptions: DeepRequired<IEditorOption> = {
      mode: EditorMode.EDIT,
      defaultType: 'TEXT',
      defaultColor: '#000000',
      defaultFont: 'Microsoft YaHei',
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
      defaultHyperlinkColor: '#0000FF',
      paperDirection: PaperDirection.VERTICAL,
      inactiveAlpha: 0.6,
      historyMaxRecordCount: 100,
      wordBreak: WordBreak.BREAK_WORD,
      printPixelRatio: 3,
      maskMargin: [0, 0, 0, 0],
      letterClass: [LETTER_CLASS.ENGLISH],
      contextMenuDisableKeys: [],
      scrollContainerSelector: '',
      ...options,
      table: tableOptions,
      header: headerOptions,
      footer: footerOptions,
      pageNumber: pageNumberOptions,
      watermark: waterMarkOptions,
      control: controlOptions,
      checkbox: checkboxOptions,
      radio: radioOptions,
      cursor: cursorOptions,
      title: titleOptions,
      placeholder: placeholderOptions,
      group: groupOptions,
      pageBreak: pageBreakOptions,
      zone: zoneOptions,
      background: backgroundOptions,
      lineBreak: lineBreakOptions,
      separator: separatorOptions
    }
    // 数据处理
    data = deepClone(data)
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
    const pageComponentData = [
      headerElementList,
      mainElementList,
      footerElementList
    ]
    pageComponentData.forEach(elementList => {
      formatElementList(elementList, {
        editorOptions
      })
    })
    // 监听
    this.listener = new Listener()
    // 事件
    this.eventBus = new EventBus<EventBusMap>()
    // 重写
    this.override = new Override()
    // 启动
    const draw = new Draw(
      container,
      editorOptions,
      {
        header: headerElementList,
        main: mainElementList,
        footer: footerElementList
      },
      this.listener,
      this.eventBus,
      this.override
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
    // 插件
    const plugin = new Plugin(this)
    this.use = plugin.use.bind(plugin)
  }
}

// 对外方法
export { splitText }

// 对外常量
export { EDITOR_COMPONENT, LETTER_CLASS, INTERNAL_CONTEXT_MENU_KEY }

// 对外枚举
export {
  Editor,
  RowFlex,
  VerticalAlign,
  EditorZone,
  EditorMode,
  ElementType,
  ControlType,
  EditorComponent,
  PageMode,
  ImageDisplay,
  Command,
  KeyMap,
  BlockType,
  PaperDirection,
  TableBorder,
  TdBorder,
  TdSlash,
  MaxHeightRatio,
  NumberType,
  TitleLevel,
  ListType,
  ListStyle,
  WordBreak,
  ControlIndentation,
  BackgroundRepeat,
  BackgroundSize,
  TextDecorationStyle
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
  ILang,
  ICatalog,
  ICatalogItem,
  IRange,
  IRangeStyle
}
