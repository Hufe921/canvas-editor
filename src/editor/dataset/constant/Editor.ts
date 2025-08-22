import { DeepRequired } from '../../interface/Common'
import { IModeRule } from '../../interface/Editor'

export const EDITOR_COMPONENT = 'editor-component'
export const EDITOR_PREFIX = 'ce'
export const EDITOR_CLIPBOARD = `${EDITOR_PREFIX}-clipboard`

export const defaultModeRuleOption: Readonly<DeepRequired<IModeRule>> = {
  print: {
    imagePreviewerDisabled: false
  },
  readonly: {
    imagePreviewerDisabled: false
  },
  form: {
    controlDeletableDisabled: false
  }
}
