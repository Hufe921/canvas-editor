import { DeepRequired } from '../../interface/Common'
import { IModeRule } from '../../interface/Editor'

export const EDITOR_COMPONENT = 'editor-component'
export const EDITOR_PREFIX = 'ce'
export const EDITOR_CLIPBOARD = `${EDITOR_PREFIX}-clipboard`

// 启用增量行计算的文档最小元素数量（低于该值全量计算成本可忽略）
export const INCREMENTAL_COMPUTE_MIN_ELEMENT_COUNT = 2000

export const defaultModeRuleOption: Readonly<DeepRequired<IModeRule>> = {
  print: {
    imagePreviewerDisabled: false,
    backgroundDisabled: false,
    filterEmptyControl: true,
    areaHideDisabled: false
  },
  readonly: {
    imagePreviewerDisabled: false
  },
  form: {
    controlDeletableDisabled: false
  }
}
