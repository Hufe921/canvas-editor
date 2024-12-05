import { defaultBackground } from '../dataset/constant/Background'
import { defaultCheckboxOption } from '../dataset/constant/Checkbox'
import { LETTER_CLASS } from '../dataset/constant/Common'
import { defaultControlOption } from '../dataset/constant/Control'
import { defaultCursorOption } from '../dataset/constant/Cursor'
import { defaultFooterOption } from '../dataset/constant/Footer'
import { defaultGroupOption } from '../dataset/constant/Group'
import { defaultHeaderOption } from '../dataset/constant/Header'
import { defaultLineBreak } from '../dataset/constant/LineBreak'
import { defaultPageBreakOption } from '../dataset/constant/PageBreak'
import { defaultPageNumberOption } from '../dataset/constant/PageNumber'
import { defaultPlaceholderOption } from '../dataset/constant/Placeholder'
import { defaultRadioOption } from '../dataset/constant/Radio'
import { defaultSeparatorOption } from '../dataset/constant/Separator'
import { defaultTableOption } from '../dataset/constant/Table'
import { defaultTitleOption } from '../dataset/constant/Title'
import { defaultWatermarkOption } from '../dataset/constant/Watermark'
import { defaultZoneOption } from '../dataset/constant/Zone'
import { defaultLineNumberOption } from '../dataset/constant/LineNumber'
import { IBackgroundOption } from '../interface/Background'
import { ICheckboxOption } from '../interface/Checkbox'
import { DeepRequired } from '../interface/Common'
import { IControlOption } from '../interface/Control'
import { ICursorOption } from '../interface/Cursor'
import { IEditorOption } from '../interface/Editor'
import { IFooter } from '../interface/Footer'
import { IGroup } from '../interface/Group'
import { IHeader } from '../interface/Header'
import { ILineBreakOption } from '../interface/LineBreak'
import { IPageBreak } from '../interface/PageBreak'
import { IPageNumber } from '../interface/PageNumber'
import { IPlaceholder } from '../interface/Placeholder'
import { IRadioOption } from '../interface/Radio'
import { ISeparatorOption } from '../interface/Separator'
import { ITableOption } from '../interface/table/Table'
import { ITitleOption } from '../interface/Title'
import { IWatermark } from '../interface/Watermark'
import { IZoneOption } from '../interface/Zone'
import { ILineNumberOption } from '../interface/LineNumber'
import { IPageBorderOption } from '../interface/PageBorder'
import { defaultPageBorderOption } from '../dataset/constant/PageBorder'
import {
  EditorMode,
  PageMode,
  PaperDirection,
  RenderMode,
  WordBreak
} from '../dataset/enum/Editor'
import { defaultBadgeOption } from '../dataset/constant/Badge'
import { IBadgeOption } from '../interface/Badge'

export function mergeOption(
  options: IEditorOption = {}
): DeepRequired<IEditorOption> {
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
  const lineNumberOptions: Required<ILineNumberOption> = {
    ...defaultLineNumberOption,
    ...options.lineNumber
  }
  const pageBorderOptions: Required<IPageBorderOption> = {
    ...defaultPageBorderOption,
    ...options.pageBorder
  }
  const badgeOptions: Required<IBadgeOption> = {
    ...defaultBadgeOption,
    ...options.badge
  }

  return {
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
    renderMode: RenderMode.SPEED,
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
    separator: separatorOptions,
    lineNumber: lineNumberOptions,
    pageBorder: pageBorderOptions,
    badge: badgeOptions
  }
}
