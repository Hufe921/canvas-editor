import { IDatePickerLang } from '../../core/draw/particle/date/DatePicker'
import { IContextmenuLang } from '../contextmenu/ContextMenu'
import { IAccessibilityLang } from './Accessibility'
import { ITraceLang } from './Trace'
import { IValidateLang } from './Validate'

export interface ILang {
  fontCoverage: {
    loading: string
    resolved: string
    manual: string
    failed: string
    unsupported: string
    details: string
    locate: string
    characters: string
    samples: string
    codePoints: string
    style: string
    format: string
    reason: Record<import('../FontCoverage').FontCoverageReason, string>
    script: Record<string, string>
  }
  contextmenu: IContextmenuLang
  datePicker: IDatePickerLang
  accessibility: IAccessibilityLang
  trace: ITraceLang
  validate: IValidateLang
}
