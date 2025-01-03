export enum ControlType {
  TEXT = 'text',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  NUMBER = 'number'
}

export enum ControlComponent {
  PREFIX = 'prefix',
  POSTFIX = 'postfix',
  PRE_TEXT = 'preText',
  POST_TEXT = 'postText',
  PLACEHOLDER = 'placeholder',
  VALUE = 'value',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

// 控件内容缩进方式
export enum ControlIndentation {
  ROW_START = 'rowStart', // 从行起始位置缩进
  VALUE_START = 'valueStart' // 从值起始位置缩进
}

// 控件状态
export enum ControlState {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
