/// <reference types="emscripten" preserve="true" />
import type { EditorLifecycle } from './core/EditorLifecycle'
import type { FontCoverageReport } from './interface/FontCoverage'
import type { EditorRuntimeState } from './interface/Runtime'
import './assets/css/index.css'
import { version } from '../../package.json'
import {
  IEditorData,
  IEditorOption,
  IEditorResult,
  IUpdateOption
} from './interface/Editor'
import { IElement } from './interface/Element'
import { Draw } from './core/draw/Draw'
import { Command } from './core/command/Command'
import { CommandAdapt } from './core/command/CommandAdapt'
import { Listener } from './core/listener/Listener'
import { RowFlex } from './dataset/enum/Row'
import {
  CaretMovement,
  DeleteMovement,
  TextDirection
} from './dataset/enum/TextDirection'
import { TextScript } from './dataset/enum/TextScript'
import { ElementType } from './dataset/enum/Element'
import { Register } from './core/register/Register'
import { ContextMenu } from './core/contextmenu/ContextMenu'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from './interface/contextmenu/ContextMenu'
import {
  EditorComponent,
  EditorMode,
  EditorZone,
  PageMode,
  PaperDirection,
  WordBreak
} from './dataset/enum/Editor'
import { EDITOR_CLIPBOARD, EDITOR_COMPONENT } from './dataset/constant/Editor'
import { IWatermark } from './interface/Watermark'
import {
  ControlComponent,
  ControlIndentation,
  ControlState,
  ControlType
} from './dataset/enum/Control'
import { INavigateInfo } from './core/draw/interactive/Search'
import { Shortcut } from './core/shortcut/Shortcut'
import { KeyMap } from './dataset/enum/KeyMap'
import { BlockType } from './dataset/enum/Block'
import { MacroType } from './dataset/enum/Macro'
import { IBlock } from './interface/Block'
import { ILang } from './interface/i18n/I18n'
import { VerticalAlign } from './dataset/enum/VerticalAlign'
import { TableBorder, TdBorder, TdSlash } from './dataset/enum/table/Table'
import {
  FlexDirection,
  ImageDisplay,
  LocationPosition,
  MaxHeightRatio,
  NumberType,
  SurroundPosition
} from './dataset/enum/Common'
import { TitleLevel } from './dataset/enum/Title'
import { ListStyle, ListType } from './dataset/enum/List'
import { ICatalog, ICatalogItem } from './interface/Catalog'
import { Plugin } from './core/plugin/Plugin'
import { UsePlugin } from './interface/Plugin'
import { MacroManager } from './core/macro/MacroManager'
import { EventBus } from './core/event/eventbus/EventBus'
import { EventBusMap } from './interface/EventBus'
import { IRangeStyle } from './interface/Listener'
import { Override } from './core/override/Override'
import { LETTER_CLASS } from './dataset/constant/Common'
import { INTERNAL_CONTEXT_MENU_KEY } from './dataset/constant/ContextMenu'
import { IRange, RangeRect } from './interface/Range'
import { deepClone, splitText } from './utils'
import {
  createDomFromElementList,
  formatElementList,
  getElementListByHTML,
  getTextFromElementList,
  type IGetElementListByHTMLOption
} from './utils/element'
import { BackgroundRepeat, BackgroundSize } from './dataset/enum/Background'
import { TextDecorationStyle } from './dataset/enum/Text'
import { mergeOption } from './utils/option'
import { LineNumberType } from './dataset/enum/LineNumber'
import { AreaMode } from './dataset/enum/Area'
import { IBadge } from './interface/Badge'
import { WatermarkType, WatermarkLayer } from './dataset/enum/Watermark'
import { INTERNAL_SHORTCUT_KEY } from './dataset/constant/Shortcut'
import { IGraffitiData } from './interface/Graffiti'

export default class Editor {
  private readonly lifecycle: EditorLifecycle
  /** Resolves after WASM, configured fonts and first layout; not background downloads. */
  public readonly ready: Promise<void>

  get state(): EditorRuntimeState {
    return this.lifecycle.state
  }

  get initializationError() {
    return this.lifecycle.error
  }

  /** Creates a ready instance; destroys the partial instance if initialization fails. */
  static async create(
    container: HTMLDivElement,
    data: IEditorData | IElement[],
    options: IEditorOption = {}
  ): Promise<Editor> {
    const editor = new Editor(container, data, options)
    try {
      await editor.ready
      return editor
    } catch (error) {
      editor.destroy()
      throw error
    }
  }
  /** Retries current missing-font downloads after ready, respecting autoDownloadFonts. */
  public retryFontDownloads: () => void
  /** Detached current coverage snapshot; subscribe to fontCoverageChange for updates. */
  public getFontCoverageReport: () => FontCoverageReport
  public command: Command
  public version: string
  public listener: Listener
  public eventBus: EventBus<EventBusMap>
  public override: Override
  public register: Register
  public destroy: () => void
  public use: UsePlugin
  public macro: MacroManager

  constructor(
    container: HTMLDivElement,
    data: IEditorData | IElement[],
    options: IEditorOption = {}
  ) {
    // 合并配置
    const editorOptions = mergeOption(options)
    // 数据处理
    data = deepClone(data)
    let headerElementList: IElement[] = []
    let mainElementList: IElement[] = []
    let footerElementList: IElement[] = []
    let graffitiData: IGraffitiData[] = []
    if (Array.isArray(data)) {
      mainElementList = data
    } else {
      headerElementList = data.header || []
      mainElementList = data.main
      footerElementList = data.footer || []
      graffitiData = data.graffiti || []
    }
    const pageComponentData = [
      headerElementList,
      mainElementList,
      footerElementList
    ]
    pageComponentData.forEach(elementList => {
      formatElementList(elementList, {
        editorOptions,
        isForceCompensation: true
      })
    })
    // 版本
    this.version = version
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
        footer: footerElementList,
        graffiti: graffitiData
      },
      this.listener,
      this.eventBus,
      this.override
    )
    // 命令
    this.lifecycle = draw.getLifecycle()
    this.ready = draw.ready
    this.command = new Command(new CommandAdapt(draw), name => {
      this.lifecycle.assertReady(
        [
          'getValue',
          'getValueAsync',
          'getLocale',
          'getContainer',
          'executeComputeElementListHeightAsync'
        ].includes(name)
      )
    })
    // 宏
    this.macro = new MacroManager(this.command)
    // 菜单
    const contextMenu = new ContextMenu(draw, this.command)
    // 快捷键
    const shortcut = new Shortcut(draw, this.command)
    this.retryFontDownloads = draw.retryFontDownloads.bind(draw)
    this.getFontCoverageReport = draw.getFontCoverageReport.bind(draw)
    // 注册
    this.register = new Register({
      contextMenu,
      shortcut,
      i18n: draw.getI18n(),
      fonts: draw.registerFonts.bind(draw),
      getFontFaces: () => {
        this.lifecycle.assertReady(true)
        return draw.getLayoutHostAdapter().getFontManager().getFaces()
      },
      getFontRevision: () => {
        this.lifecycle.assertReady(true)
        return draw.getLayoutHostAdapter().getFontManager().getRevision()
      }
    })
    // 注册销毁方法
    this.destroy = () => {
      if (this.state === 'destroyed') return
      draw.destroy()
      shortcut.removeEvent()
      contextMenu.removeEvent()
      this.eventBus.dangerouslyClearAll()
    }
    // 插件
    const plugin = new Plugin(this)
    this.use = plugin.use.bind(plugin)
  }
}

// 对外方法
export {
  createDomFromElementList,
  getElementListByHTML,
  getTextFromElementList,
  splitText
}

// 对外常量
export {
  EDITOR_CLIPBOARD,
  EDITOR_COMPONENT,
  INTERNAL_CONTEXT_MENU_KEY,
  INTERNAL_SHORTCUT_KEY,
  LETTER_CLASS
}

// 对外枚举
export {
  AreaMode,
  BackgroundRepeat,
  BackgroundSize,
  BlockType,
  CaretMovement,
  Command,
  ControlComponent,
  ControlIndentation,
  ControlState,
  ControlType,
  DeleteMovement,
  Editor,
  EditorComponent,
  EditorMode,
  EditorZone,
  ElementType,
  FlexDirection,
  ImageDisplay,
  KeyMap,
  LineNumberType,
  ListStyle,
  ListType,
  LocationPosition,
  MacroType,
  MaxHeightRatio,
  NumberType,
  PageMode,
  PaperDirection,
  RowFlex,
  SurroundPosition,
  TableBorder,
  TdBorder,
  TdSlash,
  TextDecorationStyle,
  TextDirection,
  TextScript,
  TitleLevel,
  VerticalAlign,
  WatermarkLayer,
  WatermarkType,
  WordBreak
}

// 对外类型
export type {
  IBadge,
  IBlock,
  ICatalog,
  ICatalogItem,
  IContextMenuContext,
  IEditorData,
  IEditorOption,
  IEditorResult,
  IUpdateOption,
  IElement,
  IGetElementListByHTMLOption,
  ILang,
  INavigateInfo,
  IRange,
  IRangeStyle,
  IRegisterContextMenu,
  IWatermark,
  RangeRect
}

export type {
  FontCodePoint,
  FontCoverageChange,
  FontCoverageIssue,
  FontCoverageIssueBase,
  FontCoverageLocation,
  FontCoverageReason,
  FontCoverageReport,
  FontDownloadAttempt,
  FontDownloadStatus,
  FontFailureStage
} from './interface/FontCoverage'
export type {
  BlockBox,
  BreakNode,
  DocumentLayout,
  InlineObject,
  LayoutCaret,
  LayoutCluster,
  LayoutFontRef,
  LayoutGlyph,
  LayoutNode,
  LayoutNodeBase,
  LayoutPage,
  LayoutRect,
  LayoutRevision,
  LayoutScope,
  LayoutScopeId,
  LayoutSource,
  LayoutTextPosition,
  MissingGlyphBox,
  TableCellLayout,
  TableFragment,
  TextLine
} from './interface/Layout'

export { EditorRuntimeError } from './core/EditorLifecycle'
export type {
  EditorRuntimeErrorCode,
  EditorRuntimeState
} from './interface/Runtime'

export type {
  FontBinaryFormat,
  FontPlaceholderMetrics,
  FontRegistrationFailure,
  FontRegistrationResult,
  IEditorFontFace,
  RegisteredFontFace
} from './interface/TextEngine'
