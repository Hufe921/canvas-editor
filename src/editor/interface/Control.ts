import { FlexDirection, LocationPosition } from '../dataset/enum/Common'
import {
  ControlType,
  ControlIndentation,
  ControlState
} from '../dataset/enum/Control'
import { EditorZone } from '../dataset/enum/Editor'
import { MoveDirection } from '../dataset/enum/Observer'
import { RowFlex } from '../dataset/enum/Row'
import { IDrawOption } from './Draw'
import { IElement } from './Element'
import { IPositionContext } from './Position'
import { IRange } from './Range'
import { IRow, IRowElement } from './Row'

export interface IValueSet {
  value: string
  code: string
}

export interface IControlSelect {
  code: string | null
  valueSets: IValueSet[]
  isMultiSelect?: boolean
  multiSelectDelimiter?: string
  selectExclusiveOptions?: {
    inputAble?: boolean
  }
}

export interface IControlCheckbox {
  code: string | null
  min?: number
  max?: number
  flexDirection: FlexDirection
  valueSets: IValueSet[]
}

export interface IControlRadio {
  code: string | null
  flexDirection: FlexDirection
  valueSets: IValueSet[]
}

export interface IControlDate {
  dateFormat?: string
}

export interface IControlNumber {
  numberExclusiveOptions?: {
    calculatorDisabled?: boolean
  }
}

export interface IControlHighlightRule {
  keyword: string
  alpha?: number
  backgroundColor?: string
}

export interface IControlHighlight {
  ruleList: IControlHighlightRule[]
  id?: string
  conceptId?: string
}

export interface IControlRule {
  deletable?: boolean
  disabled?: boolean
  pasteDisabled?: boolean
  hide?: boolean
  required?: boolean // 必填（校验时使用，可被级联动态控制）
}

export interface IControlBasic {
  type: ControlType
  value: IElement[] | null
  placeholder?: string
  conceptId?: string
  groupId?: string
  prefix?: string
  postfix?: string
  minWidth?: number
  underline?: boolean
  border?: boolean
  extension?: unknown
  indentation?: ControlIndentation
  rowFlex?: RowFlex
  preText?: string
  postText?: string
  cascade?: IControlCascadeRule[]
  validation?: IControlValidation
  compute?: string // 计算表达式：结果自动回写本控件值（如 BMI）
}

export interface IControlStyle {
  font?: string
  size?: number
  bold?: boolean
  highlight?: string
  italic?: boolean
  strikeout?: boolean
}

export type IControl = IControlBasic &
  IControlRule &
  Partial<IControlStyle> &
  Partial<IControlSelect> &
  Partial<IControlCheckbox> &
  Partial<IControlRadio> &
  Partial<IControlDate> &
  Partial<IControlNumber>

export interface IControlOption {
  placeholderColor?: string
  bracketColor?: string
  prefix?: string
  postfix?: string
  borderWidth?: number
  borderColor?: string
  activeBackgroundColor?: string
  disabledBackgroundColor?: string
  existValueBackgroundColor?: string
  noValueBackgroundColor?: string
  errorBackgroundColor?: string // 校验失败背景色
}

export interface IControlInitOption {
  index: number
  isTable?: boolean
  trIndex?: number
  tdIndex?: number
  tdValueIndex?: number
}

export interface IControlInitResult {
  newIndex: number
}

export interface IControlInstance {
  setElement(element: IElement): void
  getElement(): IElement
  getValue(context?: IControlContext): IElement[]
  setValue(
    data: IElement[],
    context?: IControlContext,
    options?: IControlRuleOption
  ): number
  keydown(evt: KeyboardEvent): number | null
  cut(): number
}

export interface IControlContext {
  range?: IRange
  elementList?: IElement[]
}

export interface IControlRuleOption {
  isIgnoreDisabledRule?: boolean // 忽略禁用校验规则
  isIgnoreDeletedRule?: boolean // 忽略删除校验规则
  isAddPlaceholder?: boolean // 是否添加占位符
}

export interface IGetControlValueOption {
  id?: string
  groupId?: string
  conceptId?: string
  areaId?: string
}

export type IGetControlValueResult = (Omit<IControl, 'value'> & {
  value: string | null
  innerText: string | null
  zone: EditorZone
  elementList?: IElement[]
})[]

export interface ISetControlValueOption {
  id?: string
  groupId?: string
  conceptId?: string
  areaId?: string
  value: string | IElement[] | null
  isSubmitHistory?: boolean
}

export interface ISetControlExtensionOption {
  id?: string
  groupId?: string
  conceptId?: string
  areaId?: string
  extension: unknown
}

export type ISetControlHighlightOption = IControlHighlight[]

export type ISetControlProperties = {
  id?: string
  groupId?: string
  conceptId?: string
  areaId?: string
  properties: Partial<Omit<IControl, 'value'>>
  isSubmitHistory?: boolean
}

export type IRepaintControlOption = Pick<
  IDrawOption,
  'curIndex' | 'isCompute' | 'isSubmitHistory' | 'isSetCursor'
>

export interface IControlChangeOption {
  context?: IControlContext
  controlElement?: IElement
  controlValue?: IElement[]
}

export interface INextControlContext {
  positionContext: IPositionContext
  nextIndex: number
}

export interface IInitNextControlOption {
  direction?: MoveDirection
}

export interface ILocationControlOption {
  position: LocationPosition
}

export interface ISetControlRowFlexOption {
  row: IRow
  rowElement: IRowElement
  availableWidth: number
  controlRealWidth: number
}

export interface IControlChangeResult {
  state: ControlState
  control: IControl
  controlId: string
}

export interface IControlContentChangeResult {
  control: IControl
  controlId: string
}

export interface IDestroyControlOption {
  isEmitEvent?: boolean
}

export interface IRemoveControlOption {
  id?: string
  conceptId?: string
}

export type CascadeTargetType = 'control' | 'title'

export interface ICascadeAction {
  controlId?: string // 目标控件 id（唯一，精确控制）
  conceptId?: string // 目标控件/标题 conceptId（可多个，批量控制）
  // 与 controlId 可同时配置，合并命中全部应用
  targetType?: CascadeTargetType // conceptId 消歧用，缺省自动探测：先控件后标题
  effects: {
    hide?: boolean
    required?: boolean
    disabled?: boolean
    deletable?: boolean
  }
}

export interface IControlCascadeRule {
  expression: string
  actions: ICascadeAction[]
  elseActions?: ICascadeAction[] // 缺省时还原目标基线值
}

export interface IControlValidation {
  minLength?: number // TEXT
  maxLength?: number
  pattern?: string
  min?: number // NUMBER
  max?: number
  integer?: boolean
  precision?: number
  minDate?: string // DATE：'YYYY-MM-DD' 或 'today'
  maxDate?: string
  minChecked?: number // CHECKBOX
  maxChecked?: number
  message?: string // 自定义错误文案
}

export interface IValidateOption {
  zone?: EditorZone
  errorBackgroundColor?: string
}

export interface IControlValidateResult {
  controlId: string
  conceptId?: string
  control: IControl // 校验失败控件的完整配置（浅拷贝）
  errors: string[]
}
