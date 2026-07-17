import { IDatePickerLang } from '../../core/draw/particle/date/DatePicker'
import { IContextmenuLang } from '../contextmenu/ContextMenu'
import { IAccessibilityLang } from './Accessibility'
import { ITraceLang } from './Trace'

export interface ILang {
  contextmenu: IContextmenuLang
  datePicker: IDatePickerLang
  accessibility: IAccessibilityLang
  trace: ITraceLang
}
