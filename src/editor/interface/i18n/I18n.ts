import { IDatePickerLang } from '../../core/draw/particle/date/DatePicker'
import { IContextmenuLang } from '../contextmenu/ContextMenu'
import { IAccessibilityLang } from './Accessibility'

export interface ILang {
  contextmenu: IContextmenuLang
  datePicker: IDatePickerLang
  accessibility: IAccessibilityLang
}
